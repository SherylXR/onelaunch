"""Stage 6: site. launchkit in -> 31 content tokens -> filled template ->
Vercel deploy -> {"url", "tokens"} out. The deploy result is cached too, so a
demo replay returns the same live URL with zero network.

Standalone run (chains stages 1+3+5 on fixtures — all cache hits):
  python -m backend.stages.site [payload.json]
"""
import json
import sys

from pydantic import BaseModel, Field

from backend import cache, db
from backend.config import TEMPLATES_DIR
from backend.llm import call_stage, load_prompt
from deploy.vercel_deploy import deploy_site, fill_template, slugify


class SiteTokens(BaseModel):
    ACCENT: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    BUSINESS_NAME: str
    TAGLINE: str
    HERO_HEADLINE: str
    HERO_SUB: str
    CTA_PRIMARY: str
    PROBLEM_HEADING: str
    PROBLEM_BODY: str
    PKG1_NAME: str
    PKG1_PRICE: str
    PKG1_DELIVERABLE: str
    PKG1_DURATION: str
    PKG1_BESTFOR: str
    PKG2_NAME: str
    PKG2_PRICE: str
    PKG2_DELIVERABLE: str
    PKG2_DURATION: str
    PKG2_BESTFOR: str
    PKG3_NAME: str
    PKG3_PRICE: str
    PKG3_DELIVERABLE: str
    PKG3_DURATION: str
    PKG3_BESTFOR: str
    ABOUT_HEADING: str
    ABOUT_BODY: str
    PROCESS_STEP1: str
    PROCESS_STEP2: str
    PROCESS_STEP3: str
    CONTACT_LINE: str
    EMAIL: str
    FOOTER_LINE: str


def generate_tokens(launchkit: dict) -> dict:
    system = load_prompt("stage6_site")  # no user-template section in this prompt
    user_content = f"<launchkit>{json.dumps(launchkit, ensure_ascii=False)}</launchkit>"
    # "kind" discriminates from the deploy cache entry: cache PK is input_hash only
    raw = call_stage("site", {"kind": "site_tokens", "launchkit": launchkit},
                     system.strip(), user_content, temperature=0.5)
    return SiteTokens.model_validate(raw).model_dump()


def run(payload: dict) -> dict:
    launchkit = payload["launchkit"]

    def _build(_: dict) -> dict:
        tokens = generate_tokens(launchkit)
        html = fill_template(str(TEMPLATES_DIR / "site.html"), tokens)
        url = deploy_site(html, slugify(launchkit["brand"]["business_name"]))
        return {"url": url, "tokens": tokens}

    return cache.cached_call("site", {"kind": "site_deploy", "launchkit": launchkit}, _build)


if __name__ == "__main__":
    db.init_db()
    if len(sys.argv) > 1:
        payload = json.loads(open(sys.argv[1], encoding="utf-8").read())
    else:  # fixture chain: stages 1+3+4+5 (d2), all cached by now
        from backend.config import ROOT
        from backend.stages import directions, ingest, launchkit as lk, verdict
        profile = ingest.run({"cv_text": (ROOT / "fixtures/cv.txt").read_text()})
        energy_map = json.loads((ROOT / "fixtures/energy_map.json").read_text())
        d_out = directions.run({"profile": profile, "energy_map": energy_map})
        chosen = next(d for d in d_out["directions"] if d["id"] == "d2")
        v = verdict.run({"profile": profile, "energy_map": energy_map, "direction": chosen})
        kit = lk.run({"profile": profile, "energy_map": energy_map,
                      "direction": chosen, "verdict": v})
        payload = {"launchkit": kit}
    out = run(payload)
    print("LIVE:", out["url"])
    print(json.dumps(out, indent=2, ensure_ascii=False))
