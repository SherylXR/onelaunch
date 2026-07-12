import RiasecRadar from './RiasecRadar.jsx'

// The shareable Strength Map artifact — fixed 1080×1350 (social portrait) in
// three selectable themes. Theme = design tokens + background treatment only;
// props interface and content slots are unchanged. Backgrounds are pure
// CSS/SVG gradients so the PNG export stays deterministic (no images).

const STARS = (color = 'rgba(255,255,255,0.85)') =>
  [
    [12, 14], [30, 6], [55, 10], [78, 5], [90, 16], [68, 22], [22, 28], [86, 34],
  ]
    .map(([x, y]) => `radial-gradient(circle at ${x}% ${y}%, ${color} 0px, transparent 1.6px)`)
    .join(',')

export const THEMES = {
  midnight: {
    label: 'Midnight Instrument',
    exportBg: '#05070F',
    swatch: 'linear-gradient(135deg, #0A0E1A 60%, #1D3B8A)',
    bg: {
      backgroundColor: '#05070F',
      backgroundImage: `${STARS()},
        radial-gradient(720px circle at 84% 6%, rgba(59,130,246,0.18), transparent 60%),
        radial-gradient(640px circle at 8% 96%, rgba(59,130,246,0.12), transparent 55%)`,
      backgroundRepeat: 'no-repeat',
    },
    displayFont: "'Bricolage Grotesque', sans-serif",
    ink: '#EDF2FF',
    muted: '#8B96AE',
    kicker: '#60A5FA',
    heading: '#E9B24C',
    anchor: { color: '#E9B24C', border: 'rgba(233,178,76,0.55)', bg: 'rgba(233,178,76,0.08)' },
    signalBorder: '#60A5FA',
    footer: { bg: 'rgba(8,11,22,0.9)', border: 'rgba(96,165,250,0.22)', logo: '#3B82F6' },
    mountains: false,
    radar: {
      stroke: '#60A5FA', fill: '#3B82F6', fillOpacity: 0.32, dot: '#BFDBFE',
      grid: '#243456', tickName: '#C6D0E6', tickScore: '#60A5FA',
      tickCaption: '#7E89A3', glow: 'rgba(96,165,250,0.8)',
    },
  },
  gallery: {
    label: 'Gallery',
    exportBg: '#F7F5F0',
    swatch: 'linear-gradient(135deg, #FBFAF7 60%, #E7E4DB)',
    bg: {
      backgroundColor: '#F7F5F0',
      backgroundImage: 'linear-gradient(180deg, #FBFAF7 0%, #F2EFE7 100%)',
      backgroundRepeat: 'no-repeat',
    },
    displayFont: "Georgia, 'Times New Roman', serif",
    ink: '#1C1E26',
    muted: '#6E7178',
    kicker: '#2F5AF5',
    heading: '#8A8E99',
    anchor: { color: '#2F5AF5', border: 'rgba(47,90,245,0.4)', bg: 'rgba(47,90,245,0.05)' },
    signalBorder: '#2F5AF5',
    footer: { bg: '#FFFFFF', border: '#E3E0D8', logo: '#2F5AF5' },
    mountains: false,
    radar: {
      stroke: '#3B82F6', fill: '#93C5FD', fillOpacity: 0.3, dot: '#3B82F6',
      grid: '#D9D6CC', tickName: '#3A3F4C', tickScore: '#2F5AF5',
      tickCaption: '#8A8E99', glow: 'transparent',
    },
  },
  dawn: {
    label: 'Warm Dawn',
    exportBg: '#221546',
    swatch: 'linear-gradient(160deg, #4A2560 30%, #D3774B 75%, #F2A65A)',
    bg: {
      backgroundColor: '#221546',
      backgroundImage: `${STARS('rgba(255,240,220,0.8)')},
        radial-gradient(680px circle at 50% 98%, rgba(255,214,150,0.7), rgba(242,166,90,0.3) 42%, transparent 68%),
        linear-gradient(180deg, #1D1240 0%, #45225C 36%, #8E3D51 66%, #D3774B 88%, #F2A65A 100%)`,
      backgroundRepeat: 'no-repeat',
    },
    displayFont: "Georgia, 'Times New Roman', serif",
    ink: '#FFF4E4',
    muted: '#E2C3AC',
    kicker: '#F5C05C',
    heading: '#F5C05C',
    anchor: { color: '#F5C05C', border: 'rgba(245,192,92,0.6)', bg: 'rgba(245,192,92,0.10)' },
    signalBorder: '#F5C05C',
    footer: { bg: 'rgba(24,12,40,0.85)', border: 'rgba(245,192,92,0.3)', logo: '#F0A32F' },
    mountains: true,
    radar: {
      stroke: '#FFC46B', fill: '#F59E0B', fillOpacity: 0.36, dot: '#FFE3B3',
      grid: 'rgba(255,220,170,0.3)', tickName: '#FFE9CE', tickScore: '#FFC46B',
      tickCaption: '#E8C4A8', glow: 'rgba(255,180,80,0.85)',
    },
  },
}

// One clean line — CSS line-clamp truncates mid-sentence in the PNG export.
const firstSentence = (text) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text

const STRENGTH_ICONS = ['🧭', '🤝']

export default function StrengthMapCard({ cardRef, name, energyMap, marketSignal, theme = 'midnight' }) {
  const T = THEMES[theme] ?? THEMES.midnight
  const strengths = energyMap.hidden_strengths.slice(0, 2)
  const longName = (name ?? '').length > 26
  return (
    <div
      ref={cardRef}
      style={{ width: 1080, height: 1350, ...T.bg, color: T.ink }}
      className="relative flex flex-col overflow-hidden font-body"
    >
      {T.mountains && (
        <svg
          className="pointer-events-none absolute bottom-0 left-0 w-full"
          viewBox="0 0 1080 260"
          preserveAspectRatio="none"
          style={{ height: 260 }}
        >
          <path d="M0 260 L0 150 L190 90 L370 170 L560 100 L750 180 L920 120 L1080 170 L1080 260 Z" fill="#1E1030" opacity="0.75" />
          <path d="M0 260 L0 200 L240 140 L470 210 L700 150 L900 215 L1080 180 L1080 260 Z" fill="#160B26" opacity="0.9" />
        </svg>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col px-[76px] pt-[60px]">
        <p className="text-[20px] font-semibold uppercase tracking-[0.22em]" style={{ color: T.kicker }}>
          Strength map
        </p>
        <h1
          className="mt-4 font-extrabold leading-[1.04] tracking-tight"
          style={{ fontFamily: T.displayFont, fontSize: longName ? 56 : 74, overflowWrap: 'break-word' }}
        >
          {name}
        </h1>
        <p className="mt-5">
          <span
            className="inline-block rounded-full border-2 px-6 py-2.5 text-[21px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: T.anchor.color, borderColor: T.anchor.border, backgroundColor: T.anchor.bg }}
          >
            Anchor · {energyMap.career_anchor}
          </span>
        </p>

        <div className="-my-1">
          <RiasecRadar
            values={energyMap.riasec}
            height={longName ? 400 : 440}
            detailed
            tickScale={1.55}
            animate={false}
            palette={T.radar}
          />
        </div>

        <p className="text-[17px] font-bold uppercase tracking-[0.18em]" style={{ color: T.heading }}>
          Top 2 hidden strengths
        </p>
        <div className="mt-4 space-y-5">
          {strengths.map((h, i) => (
            <div key={h.strength} className="flex items-start gap-5">
              <span
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 text-[22px]"
                style={{ borderColor: T.anchor.border, backgroundColor: T.anchor.bg }}
              >
                {STRENGTH_ICONS[i]}
              </span>
              <div className="min-w-0">
                <p className="text-[27px] font-bold leading-tight tracking-tight" style={{ fontFamily: T.displayFont }}>
                  {h.strength}
                </p>
                <p className="mt-1 text-[18px] leading-snug" style={{ color: T.muted }}>
                  {firstSentence(h.why_hidden)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {marketSignal && (
          <div className="mt-7 border-l-4 pl-6" style={{ borderColor: T.signalBorder }}>
            <p className="text-[15px] font-bold uppercase tracking-[0.2em]" style={{ color: T.heading }}>
              📈 Market signal
            </p>
            <p className="mt-1.5 text-[20px] leading-snug">{marketSignal}</p>
          </div>
        )}
      </div>

      <div
        className="relative mt-auto flex shrink-0 items-center justify-between border-t px-[76px] py-8"
        style={{ backgroundColor: T.footer.bg, borderColor: T.footer.border }}
      >
        <span className="flex items-center gap-3">
          <span
            className="flex h-[46px] w-[46px] items-center justify-center rounded-xl text-[26px] font-extrabold text-white"
            style={{ backgroundColor: T.footer.logo, fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            N
          </span>
          <span className="text-[32px] font-extrabold tracking-tight" style={{ fontFamily: T.displayFont }}>
            NextChapter
          </span>
        </span>
        <span className="text-[20px] font-semibold" style={{ color: T.kicker }}>
          Discover yours →
        </span>
      </div>
    </div>
  )
}
