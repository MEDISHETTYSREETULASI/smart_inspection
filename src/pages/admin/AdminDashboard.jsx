import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, HardHat, ClipboardCheck, Clock, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus, Plus, BarChart3, CalendarClock, BellRing, Activity, ChevronRight, CheckCircle2 } from 'lucide-react'
import { getIssues, getSiteById } from '../../services/dataService'
import { getRecentActivity } from '../../services/adminService'
import { buildAlerts, isActive, SEVERITY_RANK } from '../../services/alertService'
import { getKpis, getActivitySeries, getUpcomingAndOverdue, getRecentIssues } from '../../services/dashboardService'
import { getRiskSummary } from '../../services/riskService'
import { timeAgo, todayLabel, formatDate } from '../../utils/date'
import { severityTone } from '../../utils/status'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/ui/Badge'
import Toast from '../../components/ui/Toast'
import HighRiskSites from '../../components/risk/HighRiskSites'
import ActivityChart from '../../components/charts/ActivityChart'

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const sevOrder = [['Critical', 'red'], ['High', 'orange'], ['Medium', 'amber'], ['Low', 'blue']]

function Trend({ t, goodWhen, unit }) {
  if (!t) return null
  const up = t.delta > 0
  const good = goodWhen === 'up' ? up : !up
  const cls = t.delta === 0 ? 'flat' : `${up ? 'up' : 'down'}-${good ? 'good' : 'bad'}`
  const Icon = t.delta === 0 ? Minus : up ? ArrowUpRight : ArrowDownRight
  return <span className={`trend ${cls}`} title={`${t.now} now vs ${t.before} ${unit}`}><Icon size={12} aria-hidden="true" />{t.delta > 0 ? '+' : ''}{t.delta}<span className="sr-only"> compared with {unit}</span></span>
}

// Admin command centre. Every number is calculated from the live records; cards open the matching page.
export default function AdminDashboard() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const k = getKpis()
  const risk = getRiskSummary()
  const series = getActivitySeries(14)
  const upcoming = getUpcomingAndOverdue(7)
  const recentIssues = getRecentIssues(5)
  const criticalAlerts = buildAlerts().filter(isActive).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.at - a.at).filter((a) => ['Critical', 'High'].includes(a.severity)).slice(0, 4)
  const open = getIssues().filter((i) => !['Resolved', 'Closed'].includes(i.status))
  const maxSev = Math.max(...sevOrder.map(([s]) => open.filter((i) => i.severity === s).length), 1)
  const activity = getRecentActivity(6)
  const hasActivity = series.some((d) => d.completed || d.missed)

  const kpis = [
    { to: '/admin/sites', icon: FolderKanban, tone: 'blue', label: 'Total sites', value: k.totalSites, sub: `${risk.total} scored for risk` },
    { to: '/admin/sites?type=construction', icon: HardHat, tone: 'amber', label: 'Active projects', value: k.activeProjects, sub: 'New sites in progress' },
    { to: '/admin/inspections', icon: ClipboardCheck, tone: 'green', label: 'Inspections completed', value: k.completed, sub: `${k.completedLast7} in the last 7 days`, trend: <Trend t={k.completedTrend} goodWhen="up" unit="the previous 7 days" /> },
    { to: '/admin/inspections', icon: Clock, tone: k.overdue || k.missed ? 'red' : 'amber', label: 'Pending / overdue', value: k.pending, sub: `${k.overdue} overdue · ${k.missed} missed` },
    { to: '/admin/issues', icon: AlertTriangle, tone: 'orange', label: 'Open issues', value: k.openIssues, sub: `${k.criticalIssues} critical` },
    { to: '/admin/sites?risk=high', icon: ShieldAlert, tone: 'red', label: 'High-risk sites', value: k.high, sub: `${risk.immediate} need immediate inspection`, trend: <Trend t={k.highTrend} goodWhen="down" unit="the last recorded day" /> },
  ]

  const summary = [
    `${upcoming.today} inspection${upcoming.today === 1 ? '' : 's'} scheduled today`,
    `${k.overdue} overdue`, `${k.openIssues} open issue${k.openIssues === 1 ? '' : 's'}`,
  ].join(' · ')

  return (
    <>
      <section className="hero" aria-labelledby="dash-title">
        <h1 id="dash-title">{greeting()}, {user.name.split(' ')[0]}</h1>
        <p>{todayLabel()} · Here is what needs your attention across all districts.</p>
        <div className="hero-meta">
          <span className="chip"><CalendarClock size={14} /> {summary}</span>
          <span className="chip"><ShieldAlert size={14} /> {risk.immediate} site{risk.immediate === 1 ? '' : 's'} need immediate inspection</span>
        </div>
        <div className="hero-actions">
          <Link className="btn" to="/admin/sites?new=1"><Plus size={16} /> Add site</Link>
          <Link className="btn btn-ghost" to="/admin/sites?sort=risk"><ShieldAlert size={16} /> Review risk ranking</Link>
          <Link className="btn btn-ghost" to="/admin/reports"><BarChart3 size={16} /> Reports</Link>
        </div>
      </section>

      <div className="kpi-grid" role="list" aria-label="Key figures">
        {kpis.map(({ to, icon: Icon, tone, label, value, sub, trend }, i) => (
          <Link key={label} to={to} className="kpi" style={{ '--i': i }} role="listitem">
            <div className="kpi-top"><span className={`kpi-icon tone-${tone}`}><Icon size={18} aria-hidden="true" /></span>{trend}</div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-sub">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="dash-cols">
        <div className="dash-col">
          <HighRiskSites user={user} onMessage={(text, tone = 'ok') => setToast({ text, tone })} />

          <section className="card" aria-labelledby="act-title">
            <div className="card-head"><h2 id="act-title" className="panel-title"><span className="ico"><Activity size={16} /></span> Inspection activity <span className="muted small" style={{ fontWeight: 400 }}>last 14 days</span></h2><Link to="/admin/reports" className="muted small">Full report <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div>
            {hasActivity ? <ActivityChart data={series} /> : <div className="empty-inline"><b>No inspections in the last 14 days.</b><span className="muted"> Once inspections are completed or missed, daily activity appears here.</span></div>}
          </section>
        </div>

        <div className="dash-col">
          <section className="card" aria-labelledby="up-title">
            <div className="card-head"><h2 id="up-title" className="panel-title"><span className="ico"><CalendarClock size={16} /></span> Upcoming &amp; overdue</h2><Link to="/admin/inspections" className="muted small">All <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div>
            {upcoming.rows.length === 0 && <div className="empty-inline"><CheckCircle2 size={15} style={{ verticalAlign: '-3px' }} /> <b>Nothing due in the next 7 days.</b><span className="muted"> Add or assign inspections from <Link to="/admin/assignments" style={{ textDecoration: 'underline' }}>Assignments</Link>.</span></div>}
            <div className="mini-list">
              {upcoming.rows.map(({ i, site, state }) => (
                <Link key={i.id} to={`/admin/sites/${site.id}`} className="list-row">
                  <div className="grow"><b>{site.name}</b><div className="muted small">{formatDate(i.date)} · {i.slot}</div></div>
                  <Badge tone={state === 'overdue' ? 'red' : state === 'today' ? 'blue' : 'gray'}>{state === 'overdue' ? 'Overdue' : state === 'today' ? 'Today' : 'Upcoming'}</Badge>
                </Link>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="crit-title">
            <div className="card-head"><h2 id="crit-title" className="panel-title"><span className="ico" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}><BellRing size={16} /></span> Critical alerts &amp; recent issues</h2><Link to="/admin/alerts" className="muted small">Alerts <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div>
            {criticalAlerts.length === 0 && recentIssues.length === 0 && <div className="empty-inline"><b>No open alerts or issues.</b><span className="muted"> Everything reported so far has been resolved.</span></div>}
            <div className="mini-list">
              {criticalAlerts.map((a) => (
                <Link key={a.id} to="/admin/alerts" className="list-row">
                  <div className="grow"><b>{a.title}</b><div className="muted small">{a.typeLabel} · {a.siteName}</div></div>
                  <Badge tone={severityTone[a.severity]}>{a.severity}</Badge>
                </Link>
              ))}
              {recentIssues.map((i) => (
                <Link key={i.id} to="/admin/issues" className="list-row">
                  <div className="grow"><b>{i.title}</b><div className="muted small">{(getSiteById(i.siteId) || {}).name} · {i.daysAgo === 0 ? 'today' : `${i.daysAgo} d ago`}</div></div>
                  <Badge tone={severityTone[i.severity]}>{i.severity}</Badge>
                </Link>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="sev-title">
            <div className="card-head"><h2 id="sev-title">Open issues by severity</h2></div>
            {sevOrder.map(([s, tone]) => {
              const n = open.filter((i) => i.severity === s).length
              return <div className="bar-row" key={s}><span>{s}</span><div className="bar"><span className={`fill-${tone}`} style={{ width: `${(n / maxSev) * 100}%` }} /></div><b>{n}</b></div>
            })}
          </section>

          <section className="card" aria-labelledby="adm-title">
            <div className="card-head"><h2 id="adm-title">Recent activity</h2><Link to="/admin/notifications" className="muted small">Notifications <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div>
            {activity.length === 0 && <div className="empty-inline"><b>No activity yet.</b><span className="muted"> Submissions, assignments and resolved issues will be listed here.</span></div>}
            <div className="mini-list">
              {activity.map((x) => (
                <Link to={x.link} className="list-row" key={x.id}>
                  <div className="grow">{x.text}</div>
                  <span className="muted small" style={{ whiteSpace: 'nowrap' }}>{timeAgo(Math.max(0, Math.round((Date.now() - x.at) / 60000)))}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
