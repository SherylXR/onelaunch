import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import StrengthMapCard, { THEMES } from './StrengthMapCard.jsx'
import { PUBLIC_URL } from '../config.js'

// Card is 1080×1350; export stays 1080×1350 regardless of preview scale.
// Phones get a smaller preview so the card fits the viewport.
const SCALE = typeof window !== 'undefined' && window.innerWidth < 768 ? 0.31 : 0.52

// Milestone panel after the energy map: the shareable Strength Map with a
// 3-swatch theme picker and download / copy-link affordances. Download
// exports the active theme.
export default function StrengthMapPanel({ name, energyMap, marketSignal, ready, onContinue }) {
  const cardRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState('midnight')

  const download = async () => {
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1350,
        pixelRatio: 1,
        backgroundColor: THEMES[theme].exportBg,
      })
      const a = document.createElement('a')
      a.download = `${(name ?? 'your').split(/\s+/)[0].toLowerCase()}-strength-map.png`
      a.href = dataUrl
      a.click()
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    // Copies the app's public URL — per-map share links land with the lite tier
    await navigator.clipboard?.writeText(PUBLIC_URL).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-2.5">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              title={t.label}
              onClick={() => setTheme(key)}
              className={`h-7 w-7 rounded-full border transition-all ${
                theme === key
                  ? 'border-bright ring-2 ring-bright/50'
                  : 'border-line hover:border-muted'
              }`}
              style={{ background: t.swatch }}
            />
          ))}
          <span className="ml-1 text-xs font-semibold text-muted">{THEMES[theme].label}</span>
        </div>
        <div
          className="overflow-hidden rounded-md border border-line"
          style={{ width: 1080 * SCALE, height: 1350 * SCALE }}
        >
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
            <StrengthMapCard
              cardRef={cardRef}
              name={name}
              energyMap={energyMap}
              marketSignal={marketSignal}
              theme={theme}
            />
          </div>
        </div>
      </div>

      <div className="max-w-sm pt-0 md:pt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Milestone — share this
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Your Strength Map
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          What discovery found that your CV doesn't say. Download it, share it —
          it's yours whatever you decide next.
        </p>

        <div className="mt-7 space-y-3">
          <button
            onClick={download}
            disabled={busy}
            className="block w-full rounded-lg bg-amber px-6 py-3 text-sm font-bold text-[#221605] shadow-[0_0_20px_rgba(240,163,47,0.3)] transition-opacity disabled:opacity-40"
          >
            {busy ? 'Rendering…' : 'Download your Strength Map'}
          </button>
          <button
            onClick={copyLink}
            className="block w-full rounded-lg border border-line bg-panel px-6 py-3 text-sm font-semibold transition-colors hover:border-bright"
          >
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>

        {ready && (
          <button
            onClick={onContinue}
            className="mt-10 block text-left text-sm font-semibold text-bright"
          >
            Continue — pick your direction →
          </button>
        )}
      </div>
    </div>
  )
}
