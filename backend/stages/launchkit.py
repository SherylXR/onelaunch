"""Stage 5: launchkit. profile + energy_map + chosen direction + verdict in ->
brand, positioning, 3 SGD-priced packages, proposal email, about blurb out.

Standalone run (chains stages 1+3 on fixtures, picks d2, stubs a green verdict):
  python -m backend.stages.launchkit [payload.json]
"""
import json
import sys

from pydantic import BaseModel, Field, field_validator

from backend import db
from backend.llm import call_stage, load_prompt
from backend.stages.directions import load_market_data


class Brand(BaseModel):
    business_name: str
    alternatives: list[str] = Field(min_length=2, max_length=2)
    tagline: str
    accent_color_hex: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    voice: str  # "3 adjectives" per prompt — models return a list or a string

    @field_validator("voice", mode="before")
    @classmethod
    def _join_voice(cls, v):
        return ", ".join(v) if isinstance(v, list) else v


class Positioning(BaseModel):
    target_customer: str
    problem: str
    differentiator: str


class Package(BaseModel):
    name: str
    price_sgd: float
    price_basis: str
    deliverable: str
    duration: str
    best_for: str


class ProposalDraft(BaseModel):
    subject: str
    body: str


class LaunchKit(BaseModel):
    brand: Brand
    positioning: Positioning
    packages: list[Package] = Field(min_length=3, max_length=3)
    proposal_draft: ProposalDraft
    about_blurb: str


def _set_path(obj: dict, dotted: str, value) -> None:
    keys = dotted.split(".")
    for key in keys[:-1]:
        obj = obj[key]
    obj[keys[-1]] = value


def run(payload: dict) -> dict:
    profile = payload["profile"]
    energy_map = payload["energy_map"]
    direction = payload["direction"]
    verdict = payload["verdict"]
    market_data = payload.get("market_data") or load_market_data()
    notes = payload.get("notes")  # optional input-side creative direction
    pinned = payload.get("pinned")  # {"brand.business_name": "..."} kept verbatim

    prompt = load_prompt("stage5_launchkit")
    system, _, user_template = prompt.partition("USER MESSAGE TEMPLATE:")
    user_content = (user_template.strip()
                    .replace("{{profile_json}}", json.dumps(profile, ensure_ascii=False))
                    .replace("{{energy_map_json}}", json.dumps(energy_map, ensure_ascii=False))
                    .replace("{{direction_json}}", json.dumps(direction, ensure_ascii=False))
                    .replace("{{verdict_json}}", json.dumps(verdict, ensure_ascii=False))
                    .replace("{{market_data}}", json.dumps(market_data, ensure_ascii=False)))
    if notes:
        user_content += f"\n<notes>{notes}</notes>"
    if pinned:
        user_content += ("\n<pinned>These fields are fixed constraints. Keep these EXACT "
                         "values verbatim in your output and regenerate everything else "
                         f"coherently around them: {json.dumps(pinned, ensure_ascii=False)}</pinned>")

    input_obj = {"profile": profile, "energy_map": energy_map,
                 "direction": direction, "verdict": verdict, "market_data": market_data}
    if notes:
        input_obj["notes"] = notes
    if pinned:
        input_obj["pinned"] = pinned
    raw = call_stage("launchkit", input_obj, system.strip(), user_content,
                     temperature=0.8)
    for path, value in (pinned or {}).items():  # guarantee verbatim, whatever the model did
        _set_path(raw, path, value)
    return LaunchKit.model_validate(raw).model_dump()


if __name__ == "__main__":
    db.init_db()
    if len(sys.argv) > 1:
        payload = json.loads(open(sys.argv[1], encoding="utf-8").read())
    else:  # fixture chain: stages 1+3+4, choose d2 (hidden-strength direction)
        from backend.stages import directions, ingest, verdict
        from backend.config import ROOT
        profile = ingest.run({"cv_text": (ROOT / "fixtures/cv.txt").read_text()})
        energy_map = json.loads((ROOT / "fixtures/energy_map.json").read_text())
        d_out = directions.run({"profile": profile, "energy_map": energy_map})
        chosen = next(d for d in d_out["directions"] if d["id"] == "d2")
        payload = {"profile": profile, "energy_map": energy_map, "direction": chosen,
                   "verdict": verdict.run({"profile": profile, "energy_map": energy_map,
                                           "direction": chosen})}
    print(json.dumps(run(payload), indent=2, ensure_ascii=False))
