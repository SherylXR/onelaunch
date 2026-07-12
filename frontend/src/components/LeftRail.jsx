import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PUBLIC_URL } from '../config.js'

export const STAGES = [
  { num: 1, name: 'Upload' },
  { num: 2, name: 'Discovery' },
  { num: 3, name: 'Directions' },
  { num: 4, name: 'Verdict' },
  { num: 5, name: 'Launch kit' },
  { num: 6, name: 'Site + QR' },
]

const STATE_LABEL = {
  pending: ['Pending', 'text-muted/70'],
  running: ['In progress', 'text-bright'],
  done: ['Complete', 'text-mint'],
  error: ['Error', 'text-red-400'],
}

// Numbered circle with connector states (target mock): green check when
// complete, glowing blue when in progress, dim number when pending, warm
// amber on the human-turn pauses.
function StageCircle({ state, num }) {
  if (state === 'done')
    return (
      <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-mint/70 bg-panel text-sm font-bold text-mint">
        ✓
      </span>
    )
  if (state === 'running')
    return (
      <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-bright bg-panel font-display text-sm font-bold text-bright shadow-[0_0_16px_rgba(59,130,246,0.5)]">
        {num}
      </span>
    )
  if (state.startsWith('awaiting'))
    return (
      <span className="z-10 flex h-9 w-9 animate-pulse items-center justify-center rounded-full border-2 border-amber bg-panel font-display text-sm font-bold text-amber shadow-[0_0_16px_rgba(240,163,47,0.4)]">
        {num}
      </span>
    )
  return (
    <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-line bg-panel font-display text-sm font-bold text-muted/70">
      {num}
    </span>
  )
}

// Slim horizontal step indicator for phones — replaces the rail below md.
export function MobileStepBar({ statuses }) {
  const active = STAGES.find(({ num }) => {
    const s = statuses[num]?.state
    return s && s !== 'pending' && s !== 'done'
  })
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#8B5CF6] via-[#3B82F6] to-[#38BDF8] font-display text-[13px] font-extrabold text-white">
          N
        </span>
        <span className="font-display text-sm font-extrabold tracking-tight">NextChapter</span>
        <span className="ml-auto flex items-center gap-1">
          {STAGES.map(({ num }) => {
            const state = statuses[num]?.state ?? 'pending'
            const cls =
              state === 'done'
                ? 'border-mint/70 text-mint'
                : state === 'running'
                  ? 'border-bright text-bright'
                  : state.startsWith('awaiting')
                    ? 'animate-pulse border-amber text-amber'
                    : 'border-line text-muted/60'
            return (
              <span
                key={num}
                className={`flex h-6 w-6 items-center justify-center rounded-full border font-display text-[10px] font-bold ${cls}`}
              >
                {state === 'done' ? '✓' : num}
              </span>
            )
          })}
        </span>
      </div>
      {active && (
        <p className="mt-1 truncate text-[11px] text-muted">
          {active.name}
          {statuses[active.num]?.state?.startsWith('awaiting')
            ? ' — your turn'
            : statuses[active.num]?.note
              ? ` — ${statuses[active.num].note}`
              : ''}
        </p>
      )}
    </div>
  )
}

// Phase-2 horizon modules — future-state, visually quiet.
const ROADMAP = [
  ['Market Campaign', 'Launch content, LinkedIn posts, your first ad — drafted and scheduled'],
  ['Leads Engine', 'Finds and qualifies prospects, drafts outreach — you approve every send'],
  ['CFO Module', 'Invoices, expenses, GST-ready books, honest cashflow forecasts'],
  ['CEO Copilot', 'The partner that remembers every decision — pricing, pivots, priorities — and advises with your history'],
]

// Mobile: the roadmap collapses to one quiet row (rendered under MobileStepBar).
export function MobileRoadmapRow() {
  return (
    <div className="border-b border-line px-4 py-2 text-[11px] text-muted/80 md:hidden">
      ＋ 4 modules after launch — Campaign · Leads · CFO · CEO
    </div>
  )
}

export default function LeftRail({ statuses, console: consoleLines = [] }) {
  const [p1Open, setP1Open] = useState(true)
  const [p2Open, setP2Open] = useState(false)
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-line px-6 py-6 md:sticky md:top-0 md:flex md:max-h-screen md:overflow-y-auto">
      <div className="flex items-center gap-2.5">
        {/* CSS take on design/asset_final/next_chapter.png — glowing blue-purple N */}
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6] via-[#3B82F6] to-[#38BDF8] font-display text-xl font-extrabold text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]">
          N
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight">NextChapter</span>
      </div>
      <p className="mt-2 whitespace-nowrap text-[11px] text-muted">
        Your next chapter. Your own company.
      </p>

      {/* Phase 1 — the live launch pipeline (collapsible, default open) */}
      <button
        type="button"
        onClick={() => setP1Open((v) => !v)}
        className="mt-8 flex w-full items-center gap-2 text-left"
      >
        <span className={`text-[10px] text-muted transition-transform ${p1Open ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Phase 1 — Launch
        </span>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-mint">
          <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-mint" />
          Active
        </span>
      </button>
      {p1Open && (
        <ol className="relative mt-5 space-y-6">
          <span className="absolute bottom-4 left-[17px] top-4 w-px bg-line" />
          {STAGES.map(({ num, name }) => {
            const { state = 'pending', note } = statuses[num] ?? {}
            const awaiting = state.startsWith('awaiting')
            const [label, labelCls] = awaiting ? [] : STATE_LABEL[state] ?? STATE_LABEL.pending
            return (
              <li key={num} className="flex items-center gap-3.5">
                <StageCircle state={state} num={num} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${state === 'pending' ? 'text-muted' : 'text-ink'}`}>
                    {name}
                  </p>
                  {awaiting ? (
                    <span className="mt-1 inline-block rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#221605]">
                      Your turn
                    </span>
                  ) : (
                    <p className={`mt-0.5 text-xs ${labelCls}`}>
                      {label}
                      {state === 'running' && note ? ` — ${note}` : ''}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {/* Phase 2 — the horizon (collapsible, default closed, greyed) */}
      <div className="mt-6 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setP2Open((v) => !v)}
          className="flex w-full items-center gap-2 text-left opacity-60 transition-opacity hover:opacity-90"
        >
          <span className={`text-[10px] text-muted transition-transform ${p2Open ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Phase 2 — After launch
          </span>
          <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-muted">
            Coming soon
          </span>
        </button>
        {p2Open && (
          <>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
              Your company, run with you
            </p>
            <ul className="mt-3 space-y-3">
              {ROADMAP.map(([name, blurb]) => (
                <li key={name}>
                  <button
                    type="button"
                    className="group relative flex w-full items-start gap-2.5 text-left opacity-50 transition-opacity hover:opacity-90 focus:opacity-90 focus:outline-none"
                  >
                    <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-line px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-muted">
                      🔒 PHASE 2
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold leading-tight">{name}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-muted">{blurb}</span>
                    </span>
                    <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden w-60 rounded-lg border border-amber/30 bg-panel2 px-3 py-2 text-[11px] leading-snug text-ink shadow-xl group-hover:block group-focus:block">
                      Coming in Phase 2 — NextChapter runs the company{' '}
                      <b className="text-amber">with</b> you, not <b className="text-amber">for</b> you.
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {consoleLines.length > 0 && (
        <div className="mt-8 rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Agent console
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-mint">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
              LIVE
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {consoleLines.slice(-6).map((l, i) => (
              <li
                key={`${l.note}-${i}`}
                className={`flex items-baseline gap-2 text-xs leading-snug ${
                  l.amber ? 'text-amber' : l.done ? 'text-muted/70' : 'text-bright'
                }`}
              >
                <span className="shrink-0">
                  {l.amber ? '●' : l.done ? '✓' : '›'}
                </span>
                <span className="truncate">{l.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-8">
        {/* Every screen carries a scannable QR of the app's permanent public
            URL (PUBLIC_URL) — valid even when presenting from localhost. */}
        <div className="mb-4 rounded-lg border border-amber/30 bg-panel p-4 text-center">
          <div className="inline-block rounded-md bg-white p-2">
            <QRCodeSVG value={PUBLIC_URL} size={120} fgColor="#0B0F1A" bgColor="#FFFFFF" />
          </div>
          <p className="mt-2.5 text-[11px] font-bold uppercase tracking-wider text-amber">
            Scan to try NextChapter
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel px-4 py-3 text-xs leading-snug text-muted">
          🧡 We're here to help you build what's next.
        </div>
      </div>
    </aside>
  )
}
