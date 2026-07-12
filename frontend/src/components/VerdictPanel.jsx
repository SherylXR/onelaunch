// UI_SPEC stage 4 on the dark system: verdict band strip, verdict_line in
// display type, revenue bracket with arithmetic small underneath, risks as
// tight aligned rows. Green/amber/red semantics tuned for dark contrast.
const BAND = {
  green: 'bg-mint shadow-[0_0_18px_rgba(52,211,153,0.5)]',
  amber: 'bg-amber shadow-[0_0_18px_rgba(240,163,47,0.5)]',
  red: 'bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.5)]',
}
const WORD = {
  green: 'text-mint',
  amber: 'text-amber',
  red: 'text-red-400',
}

const sgd = (n) => `S$${Math.round(n).toLocaleString('en-SG')}`

export default function VerdictPanel({ verdict, note }) {
  const rev = verdict.year1_revenue_range_sgd
  return (
    <div className="max-w-2xl rounded-xl border border-line bg-panel p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        Viability verdict —{' '}
        <span className={`${WORD[verdict.verdict]} font-bold`}>{verdict.verdict}</span>
      </p>
      <div className={`mt-3 h-2.5 w-full rounded-full ${BAND[verdict.verdict] ?? 'bg-line'}`} />

      <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight">
        {verdict.verdict_line}
      </h2>

      <div className="mt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Year-one revenue range
        </p>
        <div className="mt-4 flex items-end justify-between font-display text-2xl font-extrabold tracking-tight text-bright">
          <span>{sgd(rev.low)}</span>
          <span>{sgd(rev.high)}</span>
        </div>
        {/* the bracket */}
        <div className="mt-1.5 h-3 border-x-2 border-b-2 border-muted/60" />
        <p className="mt-3 text-xs leading-relaxed text-muted">{rev.basis}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            First client in
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">
            ~{verdict.ramp_months_to_first_client} months
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Runway needed
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">
            {sgd(verdict.runway_needed_sgd.amount)}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <div className="hidden grid-cols-2 gap-6 border-b border-line pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted md:grid">
          <span>Risk</span>
          <span>Mitigation</span>
        </div>
        <div className="divide-y divide-line border-t border-line md:border-t-0">
          {verdict.key_risks.map((r) => (
            <div key={r.risk} className="grid grid-cols-1 gap-3 py-3.5 text-[13px] leading-relaxed md:grid-cols-2 md:gap-6">
              <p className="font-medium">{r.risk}</p>
              <p className="text-muted">{r.mitigation}</p>
            </div>
          ))}
        </div>
      </div>

      {verdict.conditions_for_green.length > 0 && (
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            What would make this green
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
            {verdict.conditions_for_green.map((c) => (
              <li key={c} className="flex gap-2.5">
                <span className="text-mint">·</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {note && (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-bright" />
          {note}
        </p>
      )}
    </div>
  )
}
