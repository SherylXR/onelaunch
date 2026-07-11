# OneLaunch Starter Pack

Drop this folder into your repo root and point Claude Code at it. CLAUDE.md is the brain.

## Contents
- `CLAUDE.md` — project rules, stack, pipeline table, build order
- `prompts/stage1..6_*.md` — system prompts with strict JSON output schemas
- `discovery/question_bank.md` — framework-grounded exemplar questions (feed into Stage 2 Mode A)
- `schemas/living_profile.json` — agent memory shape + SQLite DDL + /api/ask prompt
- `schemas/market_data_fixture.json` — offline market stub (Stage 3/4 input tonight)
- `templates/site.html` — the generated-business landing page (token-fill, single file)
- `deploy/vercel_deploy.py` — working deploy script incl. --test smoke run
- `frontend/UI_SPEC.md` — layout, radar, Ikigai animation, SSE contract

## Tonight, in order
1. `export VERCEL_TOKEN=…` then `python deploy/vercel_deploy.py --test` → must print a live URL
   before you write anything else.
2. Tell Claude Code: "Read CLAUDE.md and frontend/UI_SPEC.md. Execute build-order step 1
   (scaffold + cache + API smoke test)." Then proceed block by block.
3. After stages 1→3→5 work end-to-end with the fixture, wire stage 6 and see a real
   generated business go live. That's your minimum-victory screenshot — take it.
4. Then discovery + radar, then verdict + journal.

## First prompts to Claude Code (copy-paste)
- "Read CLAUDE.md. Scaffold the repo per the stack section: FastAPI backend with
  stages/, orchestrator with SSE, SQLite per schemas/living_profile.json DDL,
  cache-before-API-call helper, React+Vite+Tailwind frontend per frontend/UI_SPEC.md
  left-rail layout. No business logic yet. Then run the backend and confirm /health."
- "Implement stage 1 per prompts/stage1_ingest.md as backend/stages/ingest.py with a
  __main__ that runs on fixtures/cv.txt. Create a plausible fixtures/cv.txt (SG ops
  manager, 15 yrs) for testing."
- …continue per the build order.

## Freeze rule
Tomorrow 12:00 — features freeze. Only golden-path fixes after that. Cache a full
successful run (all six stages) and verify replay with wifi OFF before you leave home.
