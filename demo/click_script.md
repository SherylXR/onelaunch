# CANONICAL SARAH DEMO — stage click script

**Start at: http://localhost:8000/?demo=sarah** (hidden demo mode — CV and
answers come prefilled; you only click. No pasting on stage.)

**Final URL (cached, deterministic):**
**https://mise-en-place-oeyvyzy1y-onelaunch.vercel.app**

Verified: this exact click path replays byte-identically with INVALID API keys
— every stage cache-hits. The canonical option on each question carries a
quiet blue highlight; it reads as a focus state, not a demo tell.

---

1. **Landing** — CV is already in the box. Click **Discover my strengths →**

2. **Q1** — say the beat ("The first week was awful. But part of me felt…
   free."), then click the **highlighted option** (option 4, "Honestly? A
   quiet sense of relief…").

3. **Q2** — free text is prefilled. Click **Next question →**

4. **Q3** — click the **highlighted option** (option 1, "…the turnaround is
   the job").

5. **Q4** — say "I've done stable. I want mine.", click the **highlighted
   option** (option 2, "Take the fractional role…").

6. **Q5** — click the **highlighted option** (option 3, "The implementation…").

7. **Q6** — click the **highlighted option** (option 4, "…maintain, not
   improve").

8. **Q7** — the pineapple-tart answer is prefilled. **Read it aloud, pause
   half a beat**, click **Next question →**  ← the pivot moment.

9. **Strength Map** — optional: flip theme swatches, click **Download your
   Strength Map**. Then click **Continue — pick your direction →**

10. **Directions** — the agent's tag sits on the safe option. Click the
    **Production Operations Consultant for Micro F&B Brands** card.
    Say: "The agent scored the safe option highest. Sarah chose the pineapple
    tarts. The human decides — that's the design."

11. **No more clicks** — amber verdict → Mise en Place Ops launch kit →
    finale: site preview, QR, live URL. "Deployed in 0.0s" = cache replay.
    Invite the audience to scan the left-rail QR.

## Recovery

- Clicked a wrong option → keep going; live keys handle it (~20s deploy, new
  URL, finale preview still matches).
- Server hiccup → restart per `demo/RUNBOOK.md`, reopen `?demo=sarah`,
  re-click — under 60 seconds.

## HARD FREEZE

Prompts, fixtures, stage inputs, market data, pins, templates: frozen.
Nothing that touches a cache key or the deployed site changes without an
explicit "unfreeze".
