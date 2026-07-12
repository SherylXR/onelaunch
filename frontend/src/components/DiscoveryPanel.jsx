import { useEffect, useState } from 'react'
import RiasecRadar, { AXES } from './RiasecRadar.jsx'
import WhatThisMeans from './WhatThisMeans.jsx'

const zeroWeights = () => Object.fromEntries(AXES.map((a) => [a.key, 0]))

// One question at a time; radar fills live as each single-select answer lands
// its riasec_weights (free-text scores server-side). Answer strings and the
// submit flow are FROZEN — this component only changed its dress.
// `presets` (hidden demo mode): map of question id → canonical answer. Free
// text is prefilled; the matching option gets a quiet highlight. The presenter
// still clicks to advance, and record() sends the same strings either way.
export default function DiscoveryPanel({ questions, onComplete, submitting, presets }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [weights, setWeights] = useState(zeroWeights)
  const [freeText, setFreeText] = useState('')

  const q = questions[idx]
  const done = idx >= questions.length

  useEffect(() => {
    if (!done && q?.format === 'free_text' && presets?.[q.id]) setFreeText(presets[q.id])
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const record = (answerText, optionWeights) => {
    const next = [...answers, { id: q.id, question: q.question, answer: answerText }]
    if (optionWeights) {
      setWeights((w) =>
        Object.fromEntries(AXES.map((a) => [a.key, w[a.key] + (optionWeights[a.key] ?? 0)])))
    }
    setAnswers(next)
    setFreeText('')
    if (idx + 1 >= questions.length) onComplete(next)
    setIdx(idx + 1)
  }

  const maxW = Math.max(...AXES.map((a) => weights[a.key]), 1)
  const values = Object.fromEntries(
    AXES.map((a) => [a.key, Math.round((weights[a.key] / maxW) * 100)]))

  return (
    <div className="flex flex-col gap-7 md:flex-row md:items-start">
      {/* Question card */}
      <div className="w-full shrink-0 rounded-xl border border-line bg-panel p-5 md:w-[400px] md:p-6">
        {done ? (
          <p className="flex items-center gap-2 py-10 text-sm text-muted">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-bright" />
            {submitting ? 'Building your energy map…' : 'Answers submitted.'}
          </p>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bright">
              Question {idx + 1} of {questions.length}
            </p>
            <div className="mt-3 flex gap-1.5">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i < idx ? 'bg-accent' : i === idx ? 'bg-bright' : 'bg-line'}`}
                />
              ))}
            </div>

            <p className="mt-6 font-display text-3xl font-extrabold leading-none text-accent/60">
              “
            </p>
            <p className="-mt-2 font-display text-[21px] font-bold leading-snug tracking-tight">
              {q.question}
            </p>

            {q.format === 'single_select' ? (
              <div className="mt-6 space-y-2.5">
                {(q.options ?? []).map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => record(opt, q.riasec_weights?.[i])}
                    className={`block w-full rounded-lg border px-4 py-3 text-left text-[13.5px] leading-snug transition-all hover:border-bright hover:shadow-[0_0_14px_rgba(59,130,246,0.25)] focus-visible:border-bright focus-visible:outline-none ${
                      presets?.[q.id] === opt
                        ? 'border-bright/50 bg-panel2 shadow-[0_0_10px_rgba(59,130,246,0.18)]'
                        : 'border-line bg-panel2'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-line bg-panel2 p-4 text-[13.5px] leading-relaxed placeholder:text-muted/60 focus:border-bright focus:outline-none"
                  placeholder="Answer in your own words…"
                />
                <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-panel2 px-3.5 py-2.5 text-[12px] leading-snug text-muted">
                  <span>💡</span>
                  <span>Think in specific moments — recent weeks beat career summaries.</span>
                </div>
                <button
                  onClick={() => freeText.trim() && record(freeText.trim(), null)}
                  disabled={!freeText.trim()}
                  className="mt-4 w-full rounded-lg bg-amber px-6 py-3 text-sm font-bold text-[#221605] shadow-[0_0_20px_rgba(240,163,47,0.3)] transition-opacity disabled:opacity-40"
                >
                  Next question →
                </button>
              </div>
            )}
            <p className="mt-5 text-[11px] text-muted/80">
              🔒 Your answers are private and only used to build your profile.
            </p>
          </>
        )}
      </div>

      {/* Radar panel */}
      <div className="min-w-0 flex-1 rounded-xl border border-line bg-panel p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-lg">
            🎯
          </span>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">
              Your Discovery Radar
              <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-bright">
                LIVE
              </span>
            </p>
            <p className="text-xs text-muted">We update this as we learn more about you.</p>
          </div>
        </div>
        <RiasecRadar values={values} height={400} detailed />
        <p className="mt-2 rounded-lg bg-panel2 px-3.5 py-2.5 text-center text-[11px] text-muted">
          ⓘ These readings are patterns, not labels — free-text answers are scored at the end.
        </p>
      </div>

      {/* What this means */}
      <div className="w-full shrink-0 md:w-64">
        <WhatThisMeans values={values} />
      </div>
    </div>
  )
}
