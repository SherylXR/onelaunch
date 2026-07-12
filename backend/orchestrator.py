"""Pipeline orchestrator + SSE event stream.

SSE contract (frontend/UI_SPEC.md): each event is one JSON object, e.g.
  {"stage": 3, "state": "running", "note": "Scoring market demand…"}
  {"stage": 3, "state": "awaiting_choice", "payload": {...}}
Frontend is a dumb renderer; all intelligence lives here.

Three streams, two human pauses:
  run_pipeline      stage 1 → stage 2 Mode A → awaiting_answers (pause 1)
  continue_pipeline answers → Mode B energy map → stage 3 → awaiting_choice (pause 2)
  resume_pipeline   choice → stages 4→6 → live URL
In-flight state lives in SESSIONS; durable state (living profile, decision
journal) goes to SQLite after every stage per CLAUDE.md.
"""
import asyncio
import json
import random
from typing import AsyncIterator

from backend import db
from backend.config import ROOT
from backend.stages import directions, discovery, ingest, launchkit, site, verdict

STAGES = [
    (1, "ingest", "Reading your CV…"),
    (2, "discovery", "Mapping what energises you…"),
    (3, "directions", "Scoring market demand…"),
    (4, "viability", "Stress-testing the numbers…"),
    (5, "launchkit", "Packaging your offer…"),
    (6, "site", "Deploying your site…"),
]
NOTES = {num: note for num, _, note in STAGES}

# In-flight pipeline state per session (single uvicorn process).
SESSIONS: dict[str, dict] = {}

# Input-side creative direction for stage 5 (the prompt file stays untouched).
# Passed on every run so cached demo replays through the UI stay key-stable.
LAUNCHKIT_NOTES = (
    "If the energy map's hidden_strengths cite an origin story from life outside "
    "work, the about_blurb must reference it in exactly one sentence as the origin "
    "of this person's professional instinct — warm and matter-of-fact, not gimmicky."
)


def _launchkit_payload(state: dict, chosen: dict) -> dict:
    """Stage 5 payload incl. per-persona demo pins/notes (demo/launchkit_pins.json).

    Resolved by profile name so a UI replay of the same CV builds the identical
    cache key — that's what keeps the offline demo replay on cache hits.
    """
    payload = {"profile": state["profile"], "energy_map": state["energy_map"],
               "direction": chosen, "verdict": state["verdict"],
               "notes": LAUNCHKIT_NOTES}
    pins_path = ROOT / "demo/launchkit_pins.json"
    if pins_path.exists():
        persona = json.loads(pins_path.read_text()).get(state["profile"].get("name") or "", {})
        if persona.get("notes_extra"):
            payload["notes"] += " " + persona["notes_extra"]
        if persona.get("pinned"):
            payload["pinned"] = persona["pinned"]
    return payload


def sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _update_living_profile(state: dict, session: str) -> None:
    """Merge whatever the pipeline knows so far into THIS session's profile."""
    profile = state.get("profile", {})
    energy_map = state.get("energy_map", {})
    living = db.get_profile(session) or {}
    living.update({
        "identity": {"name": profile.get("name"),
                     "profile_summary": profile.get("career_arc")},
        "strengths": {"riasec": energy_map.get("riasec"),
                      "career_anchor": energy_map.get("career_anchor"),
                      "hidden_strengths": energy_map.get("hidden_strengths", []),
                      "flow_sources": energy_map.get("flow_sources", []),
                      "energy_drains": energy_map.get("energy_drains", [])},
        "preferences": {"autonomy_vs_income": energy_map.get("autonomy_vs_income"),
                        "stated_constraints": living.get("preferences", {}).get("stated_constraints", [])},
        "business": {**living.get("business", {}),
                     "chosen_direction": state.get("chosen", {}).get("title"),
                     "verdict": state.get("verdict", {}).get("verdict"),
                     "site_url": state.get("site", {}).get("url")},
    })
    db.save_profile(session, living)


async def run_pipeline(session: str) -> AsyncIterator[str]:
    """Stage 1 → stage 2 Mode A; ends paused at awaiting_answers."""
    state = SESSIONS.setdefault(session, {})
    current = 1
    try:
        yield sse({"stage": 1, "state": "running", "note": NOTES[1]})
        cv_text = state.get("cv_text") or (ROOT / "fixtures/cv.txt").read_text()
        state["profile"] = await asyncio.to_thread(ingest.run, {"cv_text": cv_text})
        _update_living_profile(state, session)
        yield sse({"stage": 1, "state": "done", "payload": state["profile"]})

        current = 2
        yield sse({"stage": 2, "state": "running", "note": NOTES[2]})
        state["questions"] = await asyncio.to_thread(
            discovery.generate_questions, state["profile"])
        yield sse({"stage": 2, "state": "awaiting_answers", "payload": state["questions"]})
    except Exception as err:  # surface, don't hang the stream
        yield sse({"stage": current, "state": "error", "note": str(err)})


async def continue_pipeline(session: str) -> AsyncIterator[str]:
    """Collected answers → Mode B energy map → stage 3; ends at awaiting_choice."""
    state = SESSIONS.get(session) or {}
    if "answers" not in state or "questions" not in state:
        yield sse({"stage": 2, "state": "error",
                   "note": "no collected answers for session; POST /api/answers first"})
        return
    current = 2
    try:
        yield sse({"stage": 2, "state": "running", "note": "Building your energy map…"})
        state["energy_map"] = await asyncio.to_thread(
            discovery.build_energy_map, state["profile"], state["questions"],
            state["answers"])
        _update_living_profile(state, session)
        yield sse({"stage": 2, "state": "done", "payload": state["energy_map"]})

        current = 3
        yield sse({"stage": 3, "state": "running", "note": NOTES[3]})
        state["directions"] = await asyncio.to_thread(
            directions.run, {"profile": state["profile"], "energy_map": state["energy_map"]})
        yield sse({"stage": 3, "state": "awaiting_choice", "payload": state["directions"]})
    except Exception as err:
        yield sse({"stage": current, "state": "error", "note": str(err)})


async def resume_pipeline(session: str, choice: str,
                          reason: str | None = None) -> AsyncIterator[str]:
    """Choice → stages 4→6 → live URL."""
    state = SESSIONS.get(session) or {}
    options = state.get("directions", {}).get("directions", [])
    chosen = next((d for d in options if d["id"] == choice), None)
    if chosen is None:
        yield sse({"stage": 3, "state": "error",
                   "note": f"unknown choice {choice!r}; run /api/run first"})
        return
    current = 3
    try:
        state["chosen"] = chosen
        db.log_decision(session, "directions", chosen["title"], reason)
        _update_living_profile(state, session)
        yield sse({"stage": 3, "state": "done", "payload": {"chosen": chosen}})

        current = 4
        yield sse({"stage": 4, "state": "running", "note": NOTES[4]})
        state["verdict"] = await asyncio.to_thread(verdict.run, {
            "profile": state["profile"], "energy_map": state["energy_map"],
            "direction": chosen})
        _update_living_profile(state, session)
        yield sse({"stage": 4, "state": "done", "payload": state["verdict"]})

        current = 5
        yield sse({"stage": 5, "state": "running", "note": NOTES[5]})
        # Pacing: cached replays return instantly, which reads as pre-baked on
        # stage — a 3-5s beat keeps the "agent at work" feel (and gives the
        # verdict panel its screen time). Timing only; no cache/payload impact.
        await asyncio.sleep(random.uniform(3, 5))
        state["launchkit"] = await asyncio.to_thread(
            launchkit.run, _launchkit_payload(state, chosen))
        yield sse({"stage": 5, "state": "done", "payload": state["launchkit"]})

        current = 6
        yield sse({"stage": 6, "state": "running", "note": NOTES[6]})
        state["site"] = await asyncio.to_thread(site.run, {"launchkit": state["launchkit"]})
        _update_living_profile(state, session)
        yield sse({"stage": 6, "state": "done", "payload": state["site"]})
    except Exception as err:
        yield sse({"stage": current, "state": "error", "note": str(err)})
