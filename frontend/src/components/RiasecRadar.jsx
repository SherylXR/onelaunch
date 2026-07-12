import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer,
} from 'recharts'

// UI_SPEC: plain words on the radar, not Holland letters. Axes and values are
// frozen — only the dress changed with the dark restyle.
export const AXES = [
  { key: 'R', label: 'Practical' },
  { key: 'I', label: 'Analytical' },
  { key: 'A', label: 'Creative' },
  { key: 'S', label: 'People' },
  { key: 'E', label: 'Enterprising' },
  { key: 'C', label: 'Structured' },
]

// Per-axis icon + one-line caption (display-only, from the target mock's
// treatment mapped onto OUR axes).
export const AXIS_META = {
  R: { icon: '🔧', caption: 'You make things work.' },
  I: { icon: '🔍', caption: 'You dig for the why.' },
  A: { icon: '✨', caption: 'New from nothing.' },
  S: { icon: '🤝', caption: 'You grow people.' },
  E: { icon: '🚀', caption: 'You move things forward.' },
  C: { icon: '🧩', caption: 'Order from complexity.' },
}

// Default (app-wide dark) radar palette; themed cards pass their own.
export const DEFAULT_PALETTE = {
  stroke: '#60A5FA',
  fill: '#3B82F6',
  fillOpacity: 0.3,
  dot: '#93C5FD',
  grid: '#22304F',
  tickName: '#C6D0E6',
  tickScore: '#60A5FA',
  tickCaption: '#7E89A3',
  glow: 'rgba(96,165,250,0.65)',
}

// Detailed tick: icon + axis name, big glowing score, one-line caption.
function DetailTick({ x, y, cx, cy, payload, values, scale = 1, palette }) {
  const axis = AXES.find((a) => a.label === payload.value)
  const meta = AXIS_META[axis.key]
  const dx = x - cx
  const dy = y - cy
  const tx = cx + dx * 1.28
  const ty = cy + dy * 1.22
  const anchor = Math.abs(dx) < 24 ? 'middle' : dx > 0 ? 'start' : 'end'
  return (
    <text x={tx} y={ty} textAnchor={anchor} fontFamily="Inter">
      <tspan x={tx} dy={-8 * scale} fontSize={12.5 * scale} fontWeight="600" fill={palette.tickName}>
        {meta.icon} {payload.value}
      </tspan>
      <tspan x={tx} dy={19 * scale} fontSize={18 * scale} fontWeight="800" fill={palette.tickScore}>
        {Math.round(values[axis.key] ?? 0)}
      </tspan>
      <tspan x={tx} dy={14 * scale} fontSize={9.5 * scale} fill={palette.tickCaption}>
        {meta.caption}
      </tspan>
    </text>
  )
}

export default function RiasecRadar({
  values, height = 300, tickFontSize = 11, animate = true, detailed = false,
  tickScale = 1, palette = DEFAULT_PALETTE,
}) {
  const data = AXES.map((a) => ({ axis: a.label, value: values[a.key] ?? 0 }))
  return (
    <div className="radar-glow" style={{ '--radar-glow': palette.glow }}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart
          data={data}
          outerRadius={detailed ? '52%' : '64%'}
          margin={detailed
            ? { left: 40, right: 40, top: 20, bottom: 20 }
            : { left: 12, right: 12, top: 4, bottom: 4 }}
        >
          <PolarGrid stroke={palette.grid} />
          <PolarAngleAxis
            dataKey="axis"
            tick={detailed
              ? (props) => <DetailTick {...props} values={values} scale={tickScale} palette={palette} />
              : { fill: '#9AA7C7', fontSize: tickFontSize, fontFamily: 'Inter' }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={palette.stroke}
            strokeWidth={2.5}
            fill={palette.fill}
            fillOpacity={palette.fillOpacity}
            dot={{ r: 3.5, fill: palette.dot, strokeWidth: 0 }}
            isAnimationActive={animate}
            animationDuration={600}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
