# Discovery Question Bank
Stage 2 Mode A *generates* personalized questions, but it needs exemplars to imitate.
These are the house-style references, tagged by construct. Feed this file into the
Mode A system prompt as few-shot examples.

## Flow (Csíkszentmihályi) — absorption reveals demonstrated strength
- "Think of the last workday that flew by. What were you actually doing for most of it?"
  (free_text)
- "Your CV shows [X]. When you do [X], which part do you delay starting, and which part
  do you start without thinking?" (free_text — the 'start without thinking' half is the
  flow signal; the delayed half feeds energy_drains)

## SDT — autonomy
- "A client offers a 12-month retainer at a good rate, but they dictate your methods.
  Take it?" — options: (a) Yes, security first [anchor:security]
  (b) Negotiate methods, walk if refused [sdt_autonomy high, anchor:autonomy]
  (c) Take it year one, renegotiate later [balanced, E+C]

## SDT — competence / mastery direction
- "Money aside, which would you rather be known for in 3 years?" — options map to RIASEC:
  (a) The person who fixes what others can't [I + technical anchor]
  (b) The person who grows other people [S + service anchor]
  (c) The person who built something from nothing [E + entrepreneurial anchor]
  (d) The person whose systems everyone runs on [C + R]

## SDT — relatedness (solo-readiness probe; critical for OPC viability)
- "Picture your ideal Tuesday, month 6 of your own business:" — options:
  (a) Deep solo work, one client call max [low S — solo-friendly]
  (b) Back-to-back workshops with people [high S — build teaching/facilitation in]
  (c) Half building, half selling [E — BD appetite exists]
  This one is a Stage 3 veto input: (a) profiles should not get pitched
  networking-heavy directions.

## Energy drains (the negative space — most tools skip this)
- "Which of these would make you quit within a year, even if it paid well?" — options:
  chasing invoices / constant new-client hunting / repetitive delivery /
  being on-call to clients. Direct veto feed for Stage 3.

## Career anchors (Schein)
- "You've just been retrenched. Honestly, what stung the most?" — options:
  (a) The income uncertainty [security]
  (b) Losing the team [relatedness/service]
  (c) The unfinished work [technical/challenge]
  (d) Nothing — part of me felt free [autonomy/entrepreneurial]
  Kind, disarming, and diagnostically dense. Good candidate for question #1.

## Hidden strength probe
- "What do colleagues come to you for that ISN'T in your job description?" (free_text —
  the single highest-yield question in the bank; almost always surfaces the hidden strength)

## Format rules recap (enforced in Stage 2 prompt)
- 5–7 questions, ≤2 free-text, every option maps to riasec_weights and/or anchors
- Question 1 should be the most human one (career anchor probe works well)
- Last question always: autonomy_vs_income direct trade-off
