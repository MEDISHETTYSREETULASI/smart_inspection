import { formatDate } from '../../utils/date'

// Completed vs missed inspections per day. Grouped bars with a text table for screen readers.
export default function ActivityChart({ data }) {
  const W = 640, H = 200, L = 28, R = 8, T = 10, B = 28
  const max = Math.max(1, ...data.map((d) => Math.max(d.completed, d.missed)))
  const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i)
  const slot = (W - L - R) / data.length
  const bw = Math.min(14, slot / 2.6)
  const y = (v) => T + (1 - v / max) * (H - T - B)
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="act-chart" role="img" aria-label={`Inspections per day for the last ${data.length} days: ${data.reduce((s, d) => s + d.completed, 0)} completed, ${data.reduce((s, d) => s + d.missed, 0)} missed`}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--line)' }} /><text x={L - 6} y={y(t) + 3} fontSize="9" textAnchor="end" style={{ fill: 'var(--muted)' }}>{t}</text></g>)}
        {data.map((d, i) => {
          const cx = L + slot * i + slot / 2
          return (
            <g key={d.date}>
              <rect className="bar-g" style={{ '--i': i, fill: 'var(--c-blue)' }} x={cx - bw - 1} y={y(d.completed)} width={bw} height={Math.max(0, y(0) - y(d.completed))} rx="3"><title>{`${formatDate(d.date)}: ${d.completed} completed`}</title></rect>
              <rect className="bar-g" style={{ '--i': i, fill: 'var(--c-red)' }} x={cx + 1} y={y(d.missed)} width={bw} height={Math.max(0, y(0) - y(d.missed))} rx="3"><title>{`${formatDate(d.date)}: ${d.missed} missed`}</title></rect>
              {(i === 0 || i === data.length - 1 || i % 3 === 0) && <text x={cx} y={H - 9} fontSize="9" textAnchor="middle" style={{ fill: 'var(--muted)' }}>{d.date.slice(5)}</text>}
            </g>
          )
        })}
      </svg>
      <div className="legend-inline"><span><i style={{ background: 'var(--c-blue)' }} />Completed</span><span><i style={{ background: 'var(--c-red)' }} />Missed</span></div>
      <table className="sr-only"><caption>Inspections per day</caption><thead><tr><th>Date</th><th>Completed</th><th>Missed</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.completed}</td><td>{d.missed}</td></tr>)}</tbody></table>
    </>
  )
}
