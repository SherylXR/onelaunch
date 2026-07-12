import illustration from '../assets/this_is_abt_u.png'

// Target mock's reassurance footer with the final illustration asset.
// Static copy — no pipeline data.
const POINTS = [
  { icon: '🛡', title: "You're in control",
    body: 'You decide what feels right. We provide clarity, not pressure.' },
  { icon: '🔒', title: 'Honest & private',
    body: 'Your story stays private and is never shared.' },
  { icon: '✦', title: 'Real progress',
    body: 'Every answer helps build a future that fits you.' },
]

export default function ReassuranceStrip() {
  return (
    <div className="mt-7 flex items-center gap-8 rounded-xl border border-line bg-panel px-7 py-5">
      <img
        src={illustration}
        alt=""
        className="hidden h-24 w-40 shrink-0 rounded-lg object-cover lg:block"
      />
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 md:grid-cols-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold tracking-tight">
            This is about you. <span className="text-amber">♥</span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Your experience is unique. We're here to help you uncover the
            possibilities and build something meaningful.
          </p>
        </div>
        {POINTS.map((p) => (
          <div key={p.title} className="min-w-0">
            <p className="text-[13px] font-semibold">
              <span className="mr-1">{p.icon}</span> {p.title}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
