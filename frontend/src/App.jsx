import { useRef, useState } from 'react'
import DiscoveryPanel from './components/DiscoveryPanel.jsx'
import DirectionCards from './components/DirectionCards.jsx'
import EnergyMapPanel from './components/EnergyMapPanel.jsx'
import FinalePanel from './components/FinalePanel.jsx'
import LeftRail, { MobileRoadmapRow, MobileStepBar, STAGES } from './components/LeftRail.jsx'
import ReassuranceStrip from './components/ReassuranceStrip.jsx'
import StrengthMapPanel from './components/StrengthMapPanel.jsx'
import VerdictPanel from './components/VerdictPanel.jsx'
import sarahCv from '../../fixtures/sarah_cv.txt?raw'
import sarahAnswersFixture from '../../fixtures/sarah_answers.json'

const initialStatuses = () => Object.fromEntries(STAGES.map((s) => [s.num, { state: 'pending' }]))

const PAUSE_STATES = ['awaiting_answers', 'awaiting_choice', 'error']

// Session isolation: every browser session gets its own id, sent on every API
// call — all server-side state (pipeline, living profile, journal) is scoped
// to it. NOT part of any cache key, so cached demo replays are unaffected.
const SESSION = (() => {
  let s = sessionStorage.getItem('nc-session')
  if (!s) {
    s = crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('nc-session', s)
  }
  return s
})()

// Hidden stage-demo mode (?demo=sarah): prefills the canonical fixture CV and
// answers so the presenter clicks through without pasting. Same components,
// same request payloads — the strings come from the same fixture files the
// cached canonical run used, so cache keys are byte-identical. No visible
// indicator; normal URLs are unaffected.
const DEMO = new URLSearchParams(window.location.search).get('demo')
const DEMO_CV = DEMO === 'sarah' ? sarahCv : ''
const DEMO_ANSWERS = DEMO === 'sarah'
  ? Object.fromEntries(sarahAnswersFixture.answers.map((a) => [a.id, a.answer]))
  : null

export default function App() {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [running, setRunning] = useState(false)
  const [cvText, setCvText] = useState(DEMO_CV)
  const [directionsPayload, setDirectionsPayload] = useState(null)
  const [selectedDirection, setSelectedDirection] = useState(null)
  const [mapDismissed, setMapDismissed] = useState(false)
  const [deploySeconds, setDeploySeconds] = useState(null)
  const [consoleLines, setConsoleLines] = useState([])
  const sourceRef = useRef(null)
  const deployStartRef = useRef(null)

  // SSE contract (UI_SPEC.md): this component is a dumb renderer of orchestrator events.
  const listen = (url) => {
    sourceRef.current?.close()
    setRunning(true)
    const source = new EventSource(url)
    sourceRef.current = source
    source.onmessage = (e) => {
      const event = JSON.parse(e.data)
      if (event.stage === 3 && event.state === 'awaiting_choice') setDirectionsPayload(event.payload)
      if (event.stage === 6 && event.state === 'running') deployStartRef.current = performance.now()
      if (event.stage === 6 && event.state === 'done' && deployStartRef.current)
        setDeploySeconds((performance.now() - deployStartRef.current) / 1000)
      // Agent console (left rail) — a running log of the orchestrator's notes
      if (event.state === 'running' && event.note)
        setConsoleLines((l) => [...l, { note: event.note, stage: event.stage, done: false }])
      if (event.state === 'done')
        setConsoleLines((l) => l.map((x) => (x.stage === event.stage ? { ...x, done: true } : x)))
      if (event.state.startsWith('awaiting'))
        setConsoleLines((l) => [...l, { note: 'Paused — your call', amber: true }])
      setStatuses((prev) => ({
        ...prev,
        [event.stage]: { state: event.state, note: event.note, payload: event.payload },
      }))
      if (PAUSE_STATES.includes(event.state) || (event.stage === 6 && event.state === 'done')) {
        source.close()
        setRunning(false)
      }
    }
    source.onerror = () => {
      source.close()
      setRunning(false)
    }
  }

  const startRun = async () => {
    setStatuses(initialStatuses())
    setDirectionsPayload(null)
    setSelectedDirection(null)
    setMapDismissed(false)
    setDeploySeconds(null)
    setConsoleLines([])
    // Empty text → backend falls back to the fixture CV
    await fetch('/api/cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: SESSION, cv_text: cvText }),
    })
    listen(`/api/run?session=${SESSION}`)
  }

  const submitAnswers = async (answers) => {
    setRunning(true)
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: SESSION, answers }),
    })
    listen(`/api/continue?session=${SESSION}`)
  }

  const chooseDirection = (id) => {
    setSelectedDirection(id)
    listen(`/api/resume?session=${SESSION}&choice=${id}`)
  }

  const readCvFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCvText(String(reader.result))
    reader.readAsText(file)
  }

  const questions = statuses[2]?.state === 'awaiting_answers'
    ? statuses[2].payload?.questions ?? []
    : []
  const energyMap = statuses[2]?.state === 'done' ? statuses[2].payload : null
  const awaitingChoice = statuses[3]?.state === 'awaiting_choice'
  const verdictData = statuses[4]?.state === 'done' ? statuses[4].payload : null
  const siteUrl = statuses[6]?.state === 'done' ? statuses[6].payload?.url : null
  const runningNote = Object.values(statuses).find((s) => s.state === 'running')?.note

  const profileName = statuses[1]?.payload?.name
  const strongestDirection = directionsPayload
    ? [...directionsPayload.directions].sort((a, b) => b.composite - a.composite)[0]
    : null

  const showDiscovery = questions.length > 0
  // Interlude: energy map is in, directions not yet — no dead "Working…" gaps.
  const showEnergyMap = !showDiscovery && energyMap && !directionsPayload && running
  // Milestone: shareable Strength Map gates the choice until the user continues.
  const showStrengthMap =
    !showDiscovery && !showEnergyMap && energyMap && awaitingChoice &&
    !mapDismissed && selectedDirection === null
  // Cards stay up (with the selected state) until the verdict takes over.
  const showDirections =
    !showDiscovery && !showEnergyMap && !showStrengthMap && directionsPayload &&
    !verdictData && !siteUrl && (awaitingChoice || selectedDirection !== null)

  const anyAwaiting = Object.values(statuses).some((s) => s.state?.startsWith('awaiting'))

  // Per-panel header treatment (target mock): caps display title + subtitle +
  // top-right status chip (heart badge + optional waveform, per design asset).
  const header = showDiscovery
    ? {
        title: 'Discovery Q&A',
        sub: "A few questions to uncover what your CV can't say. There are no right or wrong answers.",
        accent: 'Just be honest with yourself.',
        chip: { text: 'Listening to your story…', wave: true },
      }
    : showEnergyMap
      ? { title: 'Your Energy Map', sub: 'Scored from your answers — patterns, not labels.', chip: runningNote && { text: runningNote, wave: true } }
      : showStrengthMap
        ? { title: 'Your Strength Map', sub: "What discovery found that your CV doesn't say.", chip: { text: 'Your turn — take your time', wave: false } }
        : showDirections
          ? {
              title: 'Business Directions',
              sub: 'Three ways to turn this into a company. The agent scores.',
              accent: 'You decide.',
              chip: awaitingChoice
                ? { text: 'Your turn — pick a direction', wave: false }
                : runningNote && { text: runningNote, wave: true },
            }
          : verdictData && !siteUrl
            ? { title: 'Viability Verdict', sub: 'The honest friend, not the cheerleader.', chip: runningNote && { text: runningNote, wave: true } }
            : siteUrl
              ? { title: 'Your Site Is Live', sub: "Scan it, share it — it's real.", chip: null }
              : {
                  hero: true, // landing: the hero owns the display type
                  chip: { text: 'Listening to your story…', wave: true },
                }

  return (
    <div className="flex min-h-screen">
      <LeftRail statuses={statuses} console={consoleLines} />

      <main className="min-w-0 flex-1">
        <MobileStepBar statuses={statuses} />
        <MobileRoadmapRow />
        <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-10 md:py-9">
          <header className="flex flex-wrap items-start justify-between gap-4 md:gap-6">
            <div>
              {!header.hero && (
                <>
                  <h1 className="font-display text-[26px] font-extrabold uppercase leading-tight tracking-tight md:text-[34px]">
                    {header.title}
                  </h1>
                  <p className="mt-1.5 text-[15px] text-muted">
                    {header.sub}{' '}
                    {header.accent && (
                      <span className="font-display italic text-amber">{header.accent}</span>
                    )}
                  </p>
                </>
              )}
            </div>
            {header.chip && (
              <span className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber/35 bg-amber/5 py-2 pl-2 pr-5 shadow-[0_0_22px_rgba(240,163,47,0.15)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber/50 bg-amber/15 text-base text-amber shadow-[0_0_12px_rgba(240,163,47,0.4)]">
                  ♥
                </span>
                <span className="text-sm font-semibold text-amber">{header.chip.text}</span>
                {header.chip.wave && (
                  <span className="ml-1 flex items-center gap-[2.5px]">
                    {[5, 9, 14, 18, 14, 9, 5].map((h, i) => (
                      <span
                        key={i}
                        className="wave-bar w-[3px] rounded-full bg-amber/80"
                        style={{ height: h, animationDelay: `${i * 0.13}s` }}
                      />
                    ))}
                  </span>
                )}
              </span>
            )}
          </header>

          {/* Main panel swaps per stage */}
          <section className="mt-9">
            {showDiscovery ? (
              <DiscoveryPanel
                key={statuses[1]?.payload?.name ?? 'discovery'}
                questions={questions}
                onComplete={submitAnswers}
                submitting={running}
                presets={DEMO_ANSWERS}
              />
            ) : showEnergyMap ? (
              <EnergyMapPanel energyMap={energyMap} note={runningNote} />
            ) : showStrengthMap ? (
              <StrengthMapPanel
                name={profileName}
                energyMap={energyMap}
                marketSignal={strongestDirection?.one_liner}
                ready={awaitingChoice}
                onContinue={() => setMapDismissed(true)}
              />
            ) : showDirections ? (
              <DirectionCards
                payload={directionsPayload}
                selectedId={selectedDirection}
                onChoose={chooseDirection}
                busy={running}
              />
            ) : verdictData && !siteUrl ? (
              <VerdictPanel verdict={verdictData} note={runningNote} />
            ) : siteUrl ? (
              <FinalePanel url={siteUrl} seconds={deploySeconds} />
            ) : running ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-bright" />
                {runningNote ?? 'Working…'}
              </p>
            ) : (
              <div className="relative">
                {/* One orchestrated motion: slow-pulsing radar outline behind the hero */}
                <svg
                  className="radar-pulse pointer-events-none absolute left-1/2 top-[-30px] -ml-[260px] hidden md:block"
                  width="520"
                  height="480"
                  viewBox="-110 -100 220 200"
                  fill="none"
                >
                  {[100, 66, 33].map((r) => (
                    <polygon
                      key={r}
                      points={[0, 60, 120, 180, 240, 300]
                        .map((a) => {
                          const rad = ((a - 90) * Math.PI) / 180
                          return `${(Math.cos(rad) * r).toFixed(1)},${(Math.sin(rad) * r * 0.86).toFixed(1)}`
                        })
                        .join(' ')}
                      stroke="#3B82F6"
                      strokeWidth="0.8"
                    />
                  ))}
                  {[0, 60, 120, 180, 240, 300].map((a) => {
                    const rad = ((a - 90) * Math.PI) / 180
                    return (
                      <line
                        key={a}
                        x1="0"
                        y1="0"
                        x2={(Math.cos(rad) * 100).toFixed(1)}
                        y2={(Math.sin(rad) * 86).toFixed(1)}
                        stroke="#3B82F6"
                        strokeWidth="0.5"
                      />
                    )
                  })}
                </svg>

                {/* Hero */}
                <div className="relative mx-auto max-w-3xl pt-1 text-center">
                  <h1 className="font-display text-[30px] font-extrabold leading-[1.05] tracking-tight md:text-[46px]">
                    Your next chapter
                    <br />
                    starts with your CV
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-base">
                    An AI agent that finds what your CV doesn't say — your hidden
                    strengths, your direction, your one-person company.
                  </p>
                </div>

                {/* CV card */}
                <div className="relative mx-auto mt-6 w-full max-w-[600px] rounded-xl border border-line bg-panel p-5 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                  <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    rows={4}
                    placeholder="Paste your CV text here…"
                    className="w-full rounded-lg border border-line bg-panel2 p-4 text-sm leading-relaxed placeholder:text-muted/60 focus:border-bright focus:outline-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                    <label className="cursor-pointer font-semibold text-bright">
                      or drop a .txt file
                      <input
                        type="file"
                        accept=".txt,.md"
                        onChange={(e) => readCvFile(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                    <span>· Leave empty to try the sample CV.</span>
                  </div>
                  <button
                    onClick={startRun}
                    disabled={running}
                    className="mt-4 w-full rounded-lg bg-amber px-6 py-3 text-[15px] font-bold text-[#221605] shadow-[0_0_26px_rgba(240,163,47,0.35)] transition-opacity disabled:opacity-40"
                  >
                    {running ? 'Reading your story…' : 'Discover my strengths →'}
                  </button>
                  <p className="mt-2.5 text-center text-[11px] text-muted/80">
                    🔒 Processed only to build your map — nothing stored, nothing shared.
                  </p>
                </div>

                {/* Three-step strip — one row on desktop, stacked on phones */}
                <div className="mx-auto mt-7 flex flex-col items-center justify-center gap-2.5 md:flex-row md:whitespace-nowrap">
                  {[
                    '7 questions that see past your job titles',
                    'Your Strength Map, yours to keep',
                    'A real business direction, honestly scored',
                  ].map((step, i) => (
                    <span key={step} className="flex items-center gap-2.5">
                      <span className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-[12px]">
                        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber/15 font-display text-[10px] font-bold text-amber">
                          {i + 1}
                        </span>
                        {step}
                      </span>
                      {i < 2 && <span className="hidden text-sm text-muted md:inline">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <ReassuranceStrip />
        </div>
      </main>
    </div>
  )
}
