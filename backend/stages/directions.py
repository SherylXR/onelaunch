"""Stage 3: directions. profile + energy_map + market_data in -> 3 scored
one-person-company directions out (schema-validated). The pipeline pauses after
this stage for the human to choose.

Standalone run (chains stage 1 + fixtures when no payload file given):
  python -m backend.stages.directions [payload.json]
"""
import json
import sys

from pydantic import BaseModel, Field

from backend import db
from backend.config import SCHEMAS_DIR
from backend.llm import call_stage, load_prompt


class ScoredBasis(BaseModel):
    score: float = Field(ge=1, le=10)
    basis: str


class ScoredNote(BaseModel):
    score: float = Field(ge=1, le=10)
    note: str


class Scores(BaseModel):
    market_demand: ScoredBasis
    saturation: ScoredNote
    skill_fit: ScoredBasis
    energy_alignment: ScoredBasis


class Direction(BaseModel):
    id: str
    title: str
    one_liner: str
    target_customer: str
    why_you: str
    scores: Scores
    composite: float
    first_client_hypothesis: str


class DirectionsOut(BaseModel):
    directions: list[Direction] = Field(min_length=3, max_length=3)
    recommendation: str
    judgment_note: str


def load_market_data() -> dict:
    return json.loads((SCHEMAS_DIR / "market_data_fixture.json").read_text())


def run(payload: dict) -> dict:
    profile = payload["profile"]
    energy_map = payload["energy_map"]
    market_data = payload.get("market_data") or load_market_data()

    prompt = load_prompt("stage3_directions")
    system, _, user_template = prompt.partition("USER MESSAGE TEMPLATE:")
    user_content = (user_template.strip()
                    .replace("{{profile_json}}", json.dumps(profile, ensure_ascii=False))
                    .replace("{{energy_map_json}}", json.dumps(energy_map, ensure_ascii=False))
                    .replace("{{market_data}}", json.dumps(market_data, ensure_ascii=False)))

    input_obj = {"profile": profile, "energy_map": energy_map, "market_data": market_data}
    raw = call_stage("directions", input_obj, system.strip(), user_content,
                     temperature=0.6)
    return DirectionsOut.model_validate(raw).model_dump()


if __name__ == "__main__":
    db.init_db()
    if len(sys.argv) > 1:
        payload = json.loads(open(sys.argv[1], encoding="utf-8").read())
    else:  # fixture chain: stage 1 on the sample CV + canned energy map
        from backend.stages import ingest
        from backend.config import ROOT
        payload = {
            "profile": ingest.run({"cv_text": (ROOT / "fixtures/cv.txt").read_text()}),
            "energy_map": json.loads((ROOT / "fixtures/energy_map.json").read_text()),
        }
    print(json.dumps(run(payload), indent=2, ensure_ascii=False))
