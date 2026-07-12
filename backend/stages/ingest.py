"""Stage 1: ingest. CV text in -> profile JSON out (schema-validated).

Standalone run: python -m backend.stages.ingest fixtures/cv.txt
"""
import json
import sys
from typing import Literal

from pydantic import BaseModel

from backend import db
from backend.llm import call_stage, load_prompt


class HardSkill(BaseModel):
    skill: str
    evidence: str


class Achievement(BaseModel):
    what: str
    quantified: str | int | float | None = None


class InferredTrait(BaseModel):
    trait: str
    evidence: str


class Profile(BaseModel):
    name: str | None
    years_experience: float
    seniority: Literal["junior", "mid", "senior", "lead", "executive"]
    domains: list[str]
    hard_skills: list[HardSkill]
    soft_skills_stated: list[str]
    achievements: list[Achievement]
    artifacts: list[str]
    career_arc: str
    inferred: list[InferredTrait]
    gaps_for_discovery: list[str]


def run(payload: dict) -> dict:
    cv_text = (payload.get("cv_text") or payload.get("text") or "").strip()
    if not cv_text:
        raise ValueError("stage 1 needs non-empty CV text under 'cv_text'")

    prompt = load_prompt("stage1_ingest")
    system, _, user_template = prompt.partition("USER MESSAGE TEMPLATE:")
    user_content = user_template.strip().replace("{{cv_text}}", cv_text)

    raw = call_stage("ingest", {"cv_text": cv_text}, system.strip(), user_content,
                     temperature=0.3)
    return Profile.model_validate(raw).model_dump()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python -m backend.stages.ingest <cv_text_file>")
    db.init_db()
    text = open(sys.argv[1], encoding="utf-8").read()
    print(json.dumps(run({"cv_text": text}), indent=2, ensure_ascii=False))
