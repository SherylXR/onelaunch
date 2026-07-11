import { useRef, useState } from 'react'
import LeftRail, { STAGES } from './components/LeftRail.jsx'

const initialStatuses = () => Object.fromEntries(STAGES.map((s) => [s.num, { state: 'pending' }]))

export default function App() {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [running, setRunning] = useState(false)
  const sourceRef = useRef(null)

  // SSE contract (UI_SPEC.md): this component is a dumb renderer of orchestrator events.
  const startRun = () => {
    sourceRef.current?.close()
    setStatuses(initialStatuses())
    setRunning(true)
    const source = new EventSource('/api/run?session=default')
    sourceRef.current = source
    source.onmessage = (e) => {
      const event = JSON.parse(e.data)
      setStatuses((prev) => ({
        ...prev,
        [event.stage]: { state: event.state, note: event.note, payload: event.payload },
      }))
      if (event.state === 'awaiting_choice') {
        source.close()
        setRunning(false)
      }
    }
    source.onerror = () => {
      source.close()
      setRunning(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <LeftRail statuses={statuses} />

      <main className="flex-1 px-12 py-10">
        <header className="border-b border-line pb-6">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">OneLaunch</h1>
          <p className="mt-1 text-muted">CV in. Company out. Your judgment in between.</p>
        </header>

        {/* Main panel swaps per stage — placeholder until stage screens land */}
        <section className="mt-10 max-w-xl">
          <p className="text-sm text-muted">
            Scaffold check: the left rail is live-wired to the orchestrator over SSE.
          </p>
          <button
            onClick={startRun}
            disabled={running}
            className="mt-4 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {running ? 'Running…' : 'Run pipeline (stub)'}
          </button>
        </section>
      </main>
    </div>
  )
}
