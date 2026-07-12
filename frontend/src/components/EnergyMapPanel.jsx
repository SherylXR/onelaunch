import RiasecRadar from './RiasecRadar.jsx'
import WhatThisMeans from './WhatThisMeans.jsx'

// Interlude between discovery and directions: the scored energy map with
// hidden-strength / energy-drain chips, straight from the stage 2 payload.
export default function EnergyMapPanel({ energyMap, note }) {
  return (
    <div className="flex flex-col gap-7 md:flex-row md:items-start">
      <div className="min-w-0 max-w-lg flex-1 rounded-xl border border-line bg-panel p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bright">
          Energy map
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
          What actually energises you
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{energyMap.anchor_evidence}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {energyMap.hidden_strengths.map((h) => (
            <span
              key={h.strength}
              className="max-w-full rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs leading-snug"
            >
              <b className="text-bright">Hidden strength</b> · {h.strength}
            </span>
          ))}
          {energyMap.energy_drains.slice(0, 2).map((d) => (
            <span
              key={d}
              className="max-w-full rounded-full border border-amber/40 bg-amber/10 px-3.5 py-1.5 text-xs leading-snug"
            >
              <b className="text-amber">Drain</b> · {d.split('—')[0].trim()}
            </span>
          ))}
        </div>

        {note && (
          <p className="mt-8 flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-bright" />
            {note}
          </p>
        )}
      </div>

      <div className="w-full shrink-0 rounded-xl border border-line bg-panel p-5 md:w-[430px]">
        <RiasecRadar values={energyMap.riasec} height={380} detailed />
        <p className="mt-1 text-center text-xs text-muted">
          Strongest: {energyMap.riasec_top2.join(' + ')} · anchor: {energyMap.career_anchor}
        </p>
      </div>

      <div className="w-full shrink-0 md:w-64">
        <WhatThisMeans values={energyMap.riasec} />
      </div>
    </div>
  )
}
