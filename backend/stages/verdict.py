"""Stage 4: viability verdict. profile + energy_map + chosen direction +
market_data in -> honest green/amber/red verdict out. Negative verdicts are
valid product output; the user may proceed against them (record, don't block).

Standalone run (chains stages 1+3 on fixtures, assesses d2):
  python -m backend.stages.verdict [payload.json]
"""
import json
import sys
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from backend import db
from backend.llm import call_stage, load_prompt
from backend.stages.directions import load_market_data


class RevenueRange(BaseModel):
    low: float
    high: float
    basis: str

    @model_validator(mode="after")
    def _ordered(self):
        if self.low > self.high:
            raise ValueError("year1_revenue_range_sgd.low must be <= high")
        return self


class Runway(BaseModel):
    amount: float
    basis: str


class Risk(BaseModel):
    risk: str
    mitigation: str


class Verdict(BaseModel):
    verdict: Literal["green", "amber", "red"]
    verdict_line: str
    year1_revenue_range_sgd: RevenueRange
    ramp_months_to_first_client: float
    runway_needed_sgd: Runway
    key_risks: list[Risk] = Field(max_length=3)
    unfair_advantages: list[str] = Field(max_length=2)
    conditions_for_green: list[str] = []
    week_one_actions: list[str]

    @model_validator(mode="after")
    def _amber_red_need_conditions(self):
        if self.verdict in ("amber", "red") and not self.conditions_for_green:
            raise ValueError(f"{self.verdict} verdict requires conditions_for_green")
        return self


def run(payload: dict) -> dict:
    profile = payload["profile"]
    energy_map = payload["energy_map"]
    direction = payload["direction"]
    market_data = payload.get("market_data") or load_market_data()

    prompt = load_prompt("stage4_viability")
    system, _, user_template = prompt.partition("USER MESSAGE TEMPLATE:")
    user_content = (user_template.strip()
                    .replace("{{profile_json}}", json.dumps(profile, ensure_ascii=False))
                    .replace("{{energy_map_json}}", json.dumps(energy_map, ensure_ascii=False))
                    .replace("{{direction_json}}", json.dumps(direction, ensure_ascii=False))
                    .replace("{{market_data}}", json.dumps(market_data, ensure_ascii=False)))

    input_obj = {"profile": profile, "energy_map": energy_map,
                 "direction": direction, "market_data": market_data}
    raw = call_stage("verdict", input_obj, system.strip(), user_content,
                     temperature=0.3)
    return Verdict.model_validate(raw).model_dump()


if __name__ == "__main__":
    db.init_db()
    if len(sys.argv) > 1:
        payload = json.loads(open(sys.argv[1], encoding="utf-8").read())
    else:  # fixture chain: stages 1+3, assess d2
        from backend.config import ROOT
        from backend.stages import directions, ingest
        profile = ingest.run({"cv_text": (ROOT / "fixtures/cv.txt").read_text()})
        energy_map = json.loads((ROOT / "fixtures/energy_map.json").read_text())
        d_out = directions.run({"profile": profile, "energy_map": energy_map})
        chosen = next(d for d in d_out["directions"] if d["id"] == "d2")
        payload = {"profile": profile, "energy_map": energy_map, "direction": chosen}
    print(json.dumps(run(payload), indent=2, ensure_ascii=False))
