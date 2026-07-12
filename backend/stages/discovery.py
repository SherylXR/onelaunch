"""Stage 2: discovery. Two modes per prompts/stage2_discovery.md:
  Mode A generate_questions: profile -> 5-7 personalized questions
  Mode B build_energy_map:   profile + questions + answers -> energy_map

Mode A gets discovery/question_bank.md appended to its system prompt as
few-shot exemplars of the house question style.

Standalone runs:
  python -m backend.stages.discovery                 # Mode A on fixture CV
  python -m backend.stages.discovery payload.json    # {"mode": ..., ...}
"""
import json
import sys
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from backend import db
from backend.config import ROOT
from backend.llm import call_stage, load_prompt


class Question(BaseModel):
    id: str
    construct: str
    format: Literal["single_select", "free_text"]
    question: str
    options: list[str] | None = None
    # one weight object per option, aligned to options; null for free_text
    riasec_weights: list[dict[str, float]] | None = None


class Questions(BaseModel):
    questions: list[Question] = Field(min_length=5, max_length=7)


class HiddenStrength(BaseModel):
    strength: str
    why_hidden: str
    evidence: str


class EnergyMap(BaseModel):
    riasec: dict[str, float]
    riasec_top2: list[str] = Field(min_length=2, max_length=2)
    career_anchor: Literal["autonomy", "security", "technical", "managerial",
                           "entrepreneurial", "service", "challenge", "lifestyle"]
    anchor_evidence: str
    flow_sources: list[str]
    energy_drains: list[str]
    hidden_strengths: list[HiddenStrength]
    stated_vs_demonstrated_tension: str | None
    autonomy_vs_income: Literal["autonomy_first", "balanced", "income_first"]

    @field_validator("riasec")
    @classmethod
    def _full_hexagon(cls, v):
        if set(v) != set("RIASEC") or not all(0 <= s <= 100 for s in v.values()):
            raise ValueError("riasec needs all of R,I,A,S,E,C scored 0-100")
        return v


def _mode_prompts() -> tuple[str, str, str]:
    """Split the stage 2 prompt into (shared header, mode A, mode B)."""
    text = load_prompt("stage2_discovery")
    header, _, rest = text.partition("## MODE A")
    mode_a, _, mode_b = rest.partition("## MODE B")
    return header.strip(), "## MODE A" + mode_a, "## MODE B" + mode_b


def generate_questions(profile: dict) -> dict:
    header, mode_a, _ = _mode_prompts()
    bank = (ROOT / "discovery/question_bank.md").read_text()
    system = (f"{header}\n\nYou are running MODE A.\n\n{mode_a.strip()}\n\n"
              f"# HOUSE-STYLE EXEMPLARS (imitate the style, never copy verbatim)\n{bank}")
    user_content = f"<profile>{json.dumps(profile, ensure_ascii=False)}</profile>"
    raw = call_stage("discovery", {"kind": "discovery_questions", "profile": profile},
                     system, user_content, temperature=0.5)
    return Questions.model_validate(raw).model_dump()


def build_energy_map(profile: dict, questions: dict, answers: list[dict]) -> dict:
    header, _, mode_b = _mode_prompts()
    system = f"{header}\n\nYou are running MODE B.\n\n{mode_b.strip()}"
    user_content = (f"<profile>{json.dumps(profile, ensure_ascii=False)}</profile>\n"
                    f"<questions>{json.dumps(questions, ensure_ascii=False)}</questions>\n"
                    f"<answers>{json.dumps(answers, ensure_ascii=False)}</answers>")
    input_obj = {"kind": "energy_map", "profile": profile,
                 "questions": questions, "answers": answers}
    raw = call_stage("discovery", input_obj, system, user_content, temperature=0.5)
    return EnergyMap.model_validate(raw).model_dump()


def run(payload: dict) -> dict:
    mode = payload.get("mode", "generate_questions")
    if mode == "generate_questions":
        return generate_questions(payload["profile"])
    if mode == "build_energy_map":
        return build_energy_map(payload["profile"], payload["questions"],
                                payload["answers"])
    raise ValueError(f"unknown discovery mode {mode!r}")


if __name__ == "__main__":
    db.init_db()
    if len(sys.argv) > 1:
        payload = json.loads(open(sys.argv[1], encoding="utf-8").read())
    else:  # Mode A on the fixture CV
        from backend.stages import ingest
        profile = ingest.run({"cv_text": (ROOT / "fixtures/cv.txt").read_text()})
        payload = {"mode": "generate_questions", "profile": profile}
    print(json.dumps(run(payload), indent=2, ensure_ascii=False))
