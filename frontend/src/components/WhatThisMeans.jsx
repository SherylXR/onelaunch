import { AXES } from './RiasecRadar.jsx'

// Target mock's "What this means" column, driven by our real RIASEC values:
// axes bucketed by score into High energy / Strong fit / Developing / Lower fit.
const GROUPS = [
  { label: 'High energy', icon: '⚡', test: (v) => v >= 70, bar: 'bg-bright',
    blurb: 'A strong source of motivation for you.' },
  { label: 'Strong fit', icon: '🎯', test: (v) => v >= 50 && v < 70, bar: 'bg-mint',
    blurb: 'This comes naturally and feels aligned.' },
  { label: 'Developing', icon: '⭐', test: (v) => v >= 25 && v < 50, bar: 'bg-amber',
    blurb: 'You show potential and interest here.' },
  { label: 'Lower fit', icon: '◎', test: (v) => v < 25, bar: 'bg-muted/50',
    blurb: "We'll explore if this matters to you." },
]

export default function WhatThisMeans({ values }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <p className="font-display text-lg font-bold tracking-tight">
        What this means <span className="text-amber">✦</span>
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        We're mapping the drivers that energise you most.
      </p>
      <div className="mt-5 space-y-5">
        {GROUPS.map((g) => {
          const count = AXES.filter((a) => g.test(values[a.key] ?? 0)).length
          return (
            <div key={g.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold">
                  {g.icon} {g.label}
                </span>
                <span className="font-display text-sm font-bold text-bright">{count}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${g.bar} transition-all duration-500`}
                  style={{ width: `${(count / AXES.length) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-muted">{g.blurb}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
