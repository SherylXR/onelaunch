import { QRCodeSVG } from 'qrcode.react'
import misePreview from '../assets/previews/mise-en-place.png'
import groundworkPreview from '../assets/previews/groundwork-advisory.png'

// UI_SPEC stage 6 on the dark system. The deployed sites send X-Frame-Options,
// so a live iframe renders blank — we show a pre-captured screenshot in a
// browser-chrome frame instead (matched by project slug in the deploy URL),
// with a branded placeholder when a run has no capture. The QR and the
// clickable URL still point at the real live site.
const PREVIEWS = [
  ['mise-en-place', misePreview],
  ['groundwork-advisory', groundworkPreview],
]

const previewFor = (url) => PREVIEWS.find(([slug]) => url.includes(slug))?.[1]

export default function FinalePanel({ url, seconds }) {
  const shot = previewFor(url)
  const bare = url.replace(/^https?:\/\//, '')
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
      {/* Browser-chrome frame around the site preview */}
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-line bg-panel">
        <div className="flex items-center gap-2 border-b border-line bg-panel2 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]/70" />
          <span className="mx-auto flex min-w-0 max-w-[75%] items-center gap-1.5 truncate rounded-md bg-paper px-3.5 py-1 font-mono text-[11px] text-muted">
            <span className="shrink-0">🔒</span>
            <span className="truncate">{bare}</span>
          </span>
          <span className="w-12 shrink-0" />
        </div>
        {shot ? (
          <img
            src={shot}
            alt="Preview of the deployed site"
            className="h-auto w-full md:h-[540px] md:object-cover md:object-top"
          />
        ) : (
          <div
            className="flex h-[540px] w-full flex-col items-center justify-center gap-4 px-10 text-center"
            style={{
              backgroundImage:
                'radial-gradient(420px circle at 50% 30%, rgba(59,130,246,0.14), transparent 65%)',
            }}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#3B82F6] to-[#38BDF8] font-display text-3xl font-extrabold text-white shadow-[0_0_28px_rgba(99,102,241,0.5)]">
              N
            </span>
            <p className="font-display text-2xl font-bold tracking-tight">
              Your site is live at
            </p>
            <p className="max-w-full break-all font-mono text-sm text-bright">{bare}</p>
            <p className="text-sm text-muted">
              Open the URL or scan the QR to see it — freshly deployed sites get
              their preview captured next run.
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto w-[300px] shrink-0 text-center md:mx-0">
        <div className="inline-block rounded-xl bg-white p-5 shadow-[0_0_28px_rgba(59,130,246,0.25)]">
          <QRCodeSVG value={url} size={260} fgColor="#0B0F1A" bgColor="#FFFFFF" />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block break-all font-mono text-[13px] leading-relaxed text-bright underline decoration-bright/40 underline-offset-2"
        >
          {url}
        </a>
        {seconds != null && (
          <p className="mt-2 text-xs text-muted">Deployed in {seconds.toFixed(1)}s</p>
        )}
      </div>
    </div>
  )
}
