# Demo Day Runbook — NextChapter

Single-port setup: the FastAPI backend serves the built frontend at `/`,
so ONE process on :8000 is the whole app, exposed at the **permanent public
URL**:

**https://designer-unfiled-service.ngrok-free.dev**

This static ngrok domain **survives restarts** — the printed QR, the embedded
in-app QR, and the "Copy link" button all point to it, always. (Source of
truth: `PUBLIC_URL` in `frontend/src/config.js`; override at build time with
`VITE_PUBLIC_URL=... npm run build`.)

Run these in order from the repo root:
`/Users/sheryld/llm_projects/aiagent_project/codex_public/hackerthon/onelaunch`

---

## 0. Once, before leaving for the venue (needs internet)

```bash
cd frontend && npm run build && cd ..     # bake the latest frontend into dist/
```

Fonts are self-hosted and both demo sites' previews are baked in — the app has
no external dependencies beyond the two cached API paths.

## 1. Start the backend (terminal 1)

```bash
.venv/bin/uvicorn backend.app:app --port 8000
```

Sanity check: http://localhost:8000 → the NextChapter landing.
(No `--reload` on stage — a stray file event mid-pitch would restart the
server and drop in-flight SSE streams.)

## 2. Start the tunnel (terminal 2)

```bash
ngrok http --url=designer-unfiled-service.ngrok-free.dev 8000
```

- Same URL every time — **restarts are safe**, the QR never goes stale.
- If ngrok won't start, fallback:
  `cloudflared tunnel --url http://localhost:8000` (random URL — the embedded
  QR will still show the ngrok domain, so share the cloudflared URL from the
  browser bar instead).

## 3. Sanity-check the public URL on your phone (mobile data, not venue wifi)

Open **https://designer-unfiled-service.ngrok-free.dev**:

1. ⚠️ **ngrok free shows a one-time interstitial** ("You are about to visit…")
   per device/browser — tap **Visit Site** once. Audience members who scan
   will see it too; it's one tap. Mention it or ignore it — it's quick.
2. Landing renders responsive on the phone; chip pulses.
3. Empty CV → "Discover my strengths →" → Marcus's cached flow streams
   instantly (cache hits = no API spend, no model latency).
4. Hard-refresh once — SPA fallback should still serve the app.

## 4. Present

**Stage demo starts at: http://localhost:8000/?demo=sarah**

Hidden demo mode — looks like a normal session on the projector, but Sarah's
CV comes prefilled, each question shows her canonical option with a quiet
highlight (you still click it — the human-turn theater stays), and the two
free-text answers are prefilled (just click Next). No pasting on stage.
Follow `demo/click_script.md`. Normal URLs (no `?demo`) behave exactly as
usual — that's what the audience gets via the QR.

The left-rail QR ("Scan to try NextChapter") always encodes the permanent
public URL, on every screen of the flow.

## Cached demo paths (zero API cost, instant)

- **Marcus**: leave the CV box empty.
- **Sarah**: paste `fixtures/sarah_cv.txt` exactly; click the five options per
  `fixtures/sarah_answers.json`; paste q2 and q7 free-text answers **verbatim**
  (the pineapple-tart answer is q7). Pick d2 at the direction pause →
  Mise en Place Ops replays from cache, finale shows its captured preview.
  Off-verbatim free text = live API calls + a fresh ~20s deploy (fine, just
  slower; the finale preview still matches thanks to the pinned brand).

## Notes

- The tunnel needs internet; the *cache* independence is from the
  Anthropic/Vercel APIs, not from the network.
- Audience members who scan share your backend and its `default` session
  namespace — someone driving the flow mid-pitch can clobber your paused
  state. Present first; invite scans at the finale.
- Kill everything after: `lsof -ti:8000 | xargs kill` and Ctrl-C ngrok.
