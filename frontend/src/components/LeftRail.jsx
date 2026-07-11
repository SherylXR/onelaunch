export const STAGES = [
  { num: 1, name: 'Upload' },
  { num: 2, name: 'Discovery' },
  { num: 3, name: 'Directions' },
  { num: 4, name: 'Verdict' },
  { num: 5, name: 'Launch kit' },
  { num: 6, name: 'Site + QR' },
]

const DOT = {
  pending: 'bg-line',
  running: 'bg-accent animate-pulse',
  done: 'bg-accent',
  awaiting_choice: 'bg-amber animate-pulse',
}

const LABEL = {
  pending: 'pending',
  running: 'running',
  done: 'done',
  awaiting_choice: 'awaiting you', // human-judgment moments render warm amber
}

export default function LeftRail({ statuses }) {
  return (
    <aside className="w-64 shrink-0 border-r border-line px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted">Pipeline</div>
      <ol className="mt-6 space-y-5">
        {STAGES.map(({ num, name }) => {
          const { state = 'pending', note } = statuses[num] ?? {}
          const awaiting = state === 'awaiting_choice'
          return (
            <li key={num}>
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${DOT[state]}`} />
                <span className={`text-sm font-semibold ${state === 'pending' ? 'text-muted' : ''}`}>
                  {name}
                </span>
                <span className={`ml-auto text-xs ${awaiting ? 'text-amber' : 'text-muted'}`}>
                  {LABEL[state]}
                </span>
              </div>
              {state === 'running' && note && (
                <p className="mt-1 pl-5 text-xs text-muted">{note}</p>
              )}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
