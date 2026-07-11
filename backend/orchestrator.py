"""Pipeline orchestrator + SSE event stream.

SSE contract (frontend/UI_SPEC.md): each event is one JSON object, e.g.
  {"stage": 3, "state": "running", "note": "Scoring market demand…"}
  {"stage": 3, "state": "awaiting_choice", "payload": {...}}
Frontend is a dumb renderer; all intelligence lives here.

Stage logic is stubbed for now — this file only proves the plumbing:
left rail lights up per stage, and stage 3 pauses in "awaiting_choice"
(the human-judgment beat).
"""
import asyncio
import json
from typing import AsyncIterator

STAGES = [
    (1, "ingest", "Reading your CV…"),
    (2, "discovery", "Mapping what energises you…"),
    (3, "directions", "Scoring market demand…"),
    (4, "viability", "Stress-testing the numbers…"),
    (5, "launchkit", "Packaging your offer…"),
    (6, "site", "Deploying your site…"),
]


def sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


async def run_pipeline(session: str) -> AsyncIterator[str]:
    """Stub run: streams each stage running → done; pauses at stage 3.

    Real stage functions (backend/stages/*) get wired in here as they land.
    """
    for num, name, note in STAGES:
        yield sse({"stage": num, "state": "running", "note": note})
        await asyncio.sleep(0.8)  # stub work; replaced by real stage calls
        if num == 3:
            yield sse({"stage": 3, "state": "awaiting_choice", "payload": {"directions": []}})
            return  # resumes via a choice endpoint once stage 3 is real
        yield sse({"stage": num, "state": "done"})
