# OneLaunch Frontend Spec

## Design tokens
- Paper #FAFAF8, Ink #16181D, Accent #2F5AF5 (electric blue — product accent; the
  *generated sites* use their own per-brand accent), Line #E7E6E2, Muted #6E7178
- Display: Bricolage Grotesque (700/800). Body: Inter. Numbers/labels: Inter 600.
- Feel: instrument, not brochure. Generous whitespace, hairline dividers, no cards-with-
  shadows soup. The left rail + swapping main panel IS the layout signature.

## Layout
┌──────────────┬──────────────────────────────────────────┐
│ LEFT RAIL    │ MAIN PANEL (swaps per stage)             │
│ pipeline     │                                          │
│ stages with  │ 1 Upload  2 Discovery  3 Directions      │
│ live status  │ 4 Verdict 5 Launch kit 6 Site + QR       │
└──────────────┴──────────────────────────────────────────┘

## Left rail (the "agency is visible" requirement)
- 6 stage rows: dot + name + status (pending/running/done/awaiting-you)
- "running" = pulsing accent dot + one-line streamed status text from SSE
  (e.g. "Researching SME consulting rates in Singapore…"). These strings come from
  the orchestrator, hardcoded per stage — do NOT stream raw model tokens (messy).
- "awaiting-you" state (stage 3 choice) renders in a warm amber — human judgment
  moments are visually distinct from machine moments. Say this in the pitch.

## Stage 2 screen — the screenshot moment
- Left: one question at a time, big type, options as full-width quiet buttons
- Right: RIASEC radar (Recharts <RadarChart>) that animates new values after EACH
  answer (animationDuration 600). Under it, chips appear as detected:
  "Hidden strength: …", "Energy drain: …"
- Keep radar axes labeled with plain words, not letters:
  Practical / Analytical / Creative / People / Enterprising / Structured

## Ikigai convergence (tomorrow AM — between stages 2 and 3)
- SVG, 4 circles: "What you love" / "What you're good at" / "What pays" /
  "What the market needs". Start apart, animate translating inward over ~1.8s
  (CSS transitions on transform; respect prefers-reduced-motion → skip to final state).
- Final state: 3 direction titles fade in inside the overlap zone, then morph into
  the Stage 3 direction cards. One orchestrated moment — no other decorative motion
  anywhere in the app.

## Stage 3 — direction cards
- 3 cards, each: title, one-liner, 4 score bars (thin, accent fill), composite number
  large, "why you" sentence. Agent's recommendation gets a subtle "agent suggests" tag —
  but the USER clicks to choose. Log choice + (optional one-line reason input) to
  decision journal.

## Stage 4 — verdict
- Verdict band: green/amber/red strip + verdict_line in display type
- Revenue range as a simple horizontal bracket, the arithmetic shown small underneath
  (credibility > slickness). Risks as 3 tight rows, not icons.

## Stage 6 — the finale
- Split: live iframe preview of the deployed site (left) + big QR (right,
  qrcode.react, 260px) + the URL in monospace + "Deployed in Xs" timer.
- Below: the /api/ask input ("Ask your partner anything") for the memory demo beat.

## SSE contract
GET /api/run?session=… streams events:
  {"stage": 3, "state": "running", "note": "Scoring market demand…"}
  {"stage": 3, "state": "awaiting_choice", "payload": {directions json}}
Frontend is a dumb renderer of these events. All intelligence server-side.
