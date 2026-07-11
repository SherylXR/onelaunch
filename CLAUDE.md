# OneLaunch — CLAUDE.md

## What this is
OneLaunch turns a professional's CV + a short guided discovery process into a launch-ready
one-person company: strengths diagnosis → business directions → viability verdict →
launch kit (customer, packages, SGD pricing, brand) → live deployed website.
Built for BUIDL_OPC_Hackathon_SG (theme: One Person Company / Agentic Services,
"human judgment guides AI execution"). Demo is a 3-minute pitch; the product must
LOOK agentic (visible stage progress) and END with a live URL + QR code.

## Non-negotiables
1. **Golden path over features.** CV in → deployed site out must never break.
2. **Cache everything.** Every stage output is cached by SHA256 of its input JSON.
   Demo replay must work with zero network. Cache check happens BEFORE any API call.
3. **Human judgment is visible.** Stage 3 pauses for the user to CHOOSE a direction.
   This is a product feature (theme fit), not a UX afterthought.
4. **Honest outputs.** Viability verdicts can be negative. Never generate hype.
5. **Typed I/O.** Every stage is a pure function: JSON in → JSON out, schema-validated
   (pydantic). If Claude returns malformed JSON, retry once with the error appended.

## Stack
- Backend: FastAPI (Python 3.11+), SQLite (stdlib sqlite3, no ORM), Anthropic SDK.
- Frontend: React + Vite, Tailwind, Recharts (RIASEC radar), qrcode.react.
- Model: claude-sonnet-4-6 for stages 1–5 (fast, cheap); temperature 0.3 for
  extraction/scoring stages, 0.8 for stage 5 (brand/copy) and stage 6.
- Deploy target for generated sites: Vercel REST API (see deploy/vercel_deploy.py).
- SSE (Server-Sent Events) from FastAPI → React for live stage progress. No websockets.

## Pipeline (each stage = one file in backend/stages/)
| # | Stage       | Input                          | Output schema (schemas/)     |
|---|-------------|--------------------------------|------------------------------|
| 1 | ingest      | CV PDF text                    | profile.json                 |
| 2 | discovery   | profile + Q&A answers          | energy_map.json              |
| 3 | directions  | profile + energy_map + market  | directions.json (3 options)  |
| 4 | viability   | profile + chosen direction     | verdict.json                 |
| 5 | launchkit   | all above                      | launchkit.json               |
| 6 | site        | launchkit + templates/site.html| deployed URL + QR            |

Stage prompts live in prompts/stage{N}_*.md — load them as system prompts verbatim,
inject variables marked {{like_this}}.

## Living Profile (agent memory)
- schemas/living_profile.json defines the shape. Stored in SQLite table `profile`
  (single row per user for MVP), updated after EVERY stage and every user choice.
- Every Claude call gets the current living profile injected into the system prompt
  under a `<user_context>` block.
- Decision journal: table `decisions(ts, stage, choice, rationale)`. Stage 3 choice
  and any package/pricing edits get logged.
- Follow-up endpoint POST /api/ask: free-text question → answered WITH living profile
  + decision journal in context. This is the memory demo beat. Build it last tonight
  or tomorrow morning; it is ~30 lines.

## Build order (tonight)
1. Scaffold + Claude API smoke test + cache layer + Vercel dummy deploy  ← do deploy EARLY
2. Stages 1 → 3 → 5 wired end to end, ugly UI, static market data stub
3. Stage 6: template fill → Vercel deploy → URL + QR in UI
4. Stage 2 discovery Q&A + RIASEC radar (Recharts) + living profile writes
5. Stage 4 viability verdict + decision journal
Tomorrow AM: Ikigai convergence animation, UI polish, /api/ask memory beat.

## Frontend layout (frontend/UI_SPEC.md has detail)
- Left rail: pipeline stages with live status (pending / running / done), streamed
  via SSE. Judges must SEE agency.
- Main panel swaps per stage: upload → discovery Q&A (radar fills live on right)
  → direction cards (user picks one) → verdict card → launch kit → site preview + QR.
- Ikigai convergence animation plays between discovery and directions (tomorrow AM).

## Rules of engagement for Claude Code
- Ask before adding any dependency not listed above.
- No agent frameworks (LangChain/LangGraph/CrewAI). Plain functions + orchestrator.
- Every stage must run standalone: `python -m backend.stages.ingest fixtures/cv.txt`.
- Keep fixtures/ with one sample CV text so stages are testable without the UI.
- When something fails at 1am, prefer deleting the feature to debugging it. Golden path wins.
