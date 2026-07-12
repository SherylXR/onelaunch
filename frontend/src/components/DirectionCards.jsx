const BARS = [
  ['market_demand', 'Demand'],
  ['saturation', 'Open field'],
  ['skill_fit', 'Skill fit'],
  ['energy_alignment', 'Energy'],
]

// UI_SPEC stage 3: title, one-liner, four thin score bars with glowing fill,
// composite large, "why you"; agent's pick gets a subtle tag — the USER chooses.
export default function DirectionCards({ payload, selectedId, onChoose, busy }) {
  const recommendedId = payload.recommendation?.match(/\bd\d+\b/)?.[0]
  return (
    <div className="max-w-2xl">
      <div className="space-y-4">
        {payload.directions.map((d) => {
          const selected = d.id === selectedId
          return (
            <button
              key={d.id}
              onClick={() => onChoose(d.id)}
              disabled={busy}
              className={`block w-full rounded-xl border bg-panel p-6 text-left transition-all disabled:pointer-events-none ${
                selected
                  ? 'border-amber shadow-[0_0_24px_rgba(240,163,47,0.25)]'
                  : busy
                    ? 'border-line opacity-40'
                    : 'border-line hover:border-bright hover:shadow-[0_0_18px_rgba(59,130,246,0.2)]'
              }`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-xl font-bold tracking-tight">
                      {d.title}
                    </span>
                    {d.id === recommendedId && (
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-bright">
                        agent suggests
                      </span>
                    )}
                    {selected && (
                      <span className="rounded-full bg-amber px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#221605]">
                        Your pick
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-snug text-muted">{d.one_liner}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-display text-4xl font-extrabold tracking-tight text-bright">
                    {d.composite.toFixed(1)}
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    composite
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
                {BARS.map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-[11px] font-medium text-muted">
                      {label}
                    </span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-bright shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                        style={{ width: `${d.scores[key].score * 10}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted">
                      {d.scores[key].score}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
                {d.why_you}
              </p>
            </button>
          )
        })}
      </div>

      {payload.judgment_note && (
        <p className="mt-6 text-[13px] leading-relaxed text-muted">
          {payload.judgment_note}
        </p>
      )}
    </div>
  )
}
