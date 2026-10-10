import { useState } from 'react'
import { getIssues, getSiteById, getUserById, updateIssueStatus, ISSUE_FLOW } from '../../services/dataService'
import { severityTone } from '../../utils/status'
import PageHead from '../../components/ui/PageHead'
import Badge from '../../components/ui/Badge'
import { Repeat2, TrendingUp, AlertOctagon, AlertTriangle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

const tabs = ['All', 'Open', 'Critical', 'In Progress', 'Resolved', 'Closed', 'Recurring']
const match = {
  All: () => true,
  Open: (i) => !['Resolved', 'Closed'].includes(i.status),
  Critical: (i) => i.severity === 'Critical',
  'In Progress': (i) => i.status === 'In Progress',
  Resolved: (i) => i.status === 'Resolved',
  Closed: (i) => i.status === 'Closed',
  Recurring: (i) => i.recurring,
}

export default function Issues() {
  const [tab, setTab] = useState('All')
  const [q, setQ] = useState('')
  const [sev, setSev] = useState('all')
  const [, setVersion] = useState(0)
  const move = (id, status) => { updateIssueStatus(id, status); setVersion((v) => v + 1) }
  const all = getIssues()
  const rows = all.filter(match[tab]).filter((i) => (sev === 'all' || i.severity === sev) && `${i.title} ${i.id} ${getSiteById(i.siteId).name} ${i.category}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHead title="Issues" subtitle="Each issue moves Reported → Verified → Assigned → In Progress → Resolved → Closed. Resolved means the fix is done; Closed means it has been checked.">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button key={t} className={`btn ${tab === t ? '' : 'btn-ghost'}`} style={{ padding: '7px 12px' }} onClick={() => setTab(t)}>
              {t} ({all.filter(match[t]).length})
            </button>
          ))}
        </div>
      </PageHead>
      <div className="filters">
        <input placeholder="Search issue, site or category" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search issues" />
        <select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Filter by severity">
          <option value="all">All severities</option>{['Critical', 'High', 'Medium', 'Low'].map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Issue</th><th>Site / project</th><th>Category</th><th>Severity</th><th>Status (admin can update)</th><th>Team</th><th>Reported by</th></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td><b>{i.title}</b><div className="muted small">{i.id} · {i.daysAgo} days ago {i.recurring && <Badge tone="orange"><Repeat2 size={12} /> Recurring Issue ×{i.recurrenceCount}</Badge>}{i.recurring && !['Resolved', 'Closed'].includes(i.status) && <> <Badge tone="red"><TrendingUp size={12} /> Escalate</Badge></>}</div></td>
                <td><Link to={`/admin/sites/${i.siteId}`}>{getSiteById(i.siteId).name}</Link></td><td>{i.category}</td>
                <td><Badge tone={severityTone[i.severity]}>{i.severity === 'Critical' ? <AlertOctagon size={12} /> : i.severity === 'High' ? <AlertTriangle size={12} /> : null} {i.severity}</Badge></td>
                <td><select value={i.status} onChange={(e) => move(i.id, e.target.value)} aria-label={`Status of ${i.id}`}>{ISSUE_FLOW.map((st) => <option key={st}>{st}</option>)}</select></td>
                <td>{i.team}</td><td><Link to={`/admin/officers/${i.reportedBy}`}>{getUserById(i.reportedBy).name}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state" style={{ padding: 28 }}><Search size={22} /><b>No issues match your filters</b><span className="muted">Try another tab, severity or search word.</span></div>}
      </div>
    </>
  )
}
