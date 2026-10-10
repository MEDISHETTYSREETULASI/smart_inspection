// Placeholder shown while a page's code is loading (so the layout does not jump)
export default function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading page">
      <div className="skeleton sk-title" />
      <div className="sk-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton sk-card" />)}</div>
      <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
      <div className="skeleton sk-line" style={{ width: '70%', marginTop: 16 }} /><div className="skeleton sk-line" style={{ width: '55%' }} />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
