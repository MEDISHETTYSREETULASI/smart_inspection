import { Link, useNavigate } from 'react-router-dom'
import { Building2, HardHat, Video, BellRing, PlayCircle, MapPin, SendHorizontal, FlagTriangleRight, ClipboardList, Clock, AlertOctagon, CheckCircle2, CalendarClock, ChevronRight, RotateCcw, LogIn, LogOut as LogOutIcon, Minus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useInspection, STEPS_BY_KIND } from '../../context/InspectionContext'
import { getInspections, getSites, getSiteById, getIssues, getCameraStats, inspectionBucket } from '../../services/dataService'
import { getActiveAlerts } from '../../services/alertService'
import { getNotifications, markRead } from '../../services/notificationService'
import { inspectionTone, severityTone } from '../../utils/status'
import { relTime, todayLabel, dayOffset, formatDate, formatTime } from '../../utils/date'
import { sitePath } from '../../utils/paths'
import Badge from '../../components/ui/Badge'

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const OPEN = (i) => !['Resolved', 'Closed'].includes(i.status)

// Officer home: what to do today, in plain language, with big touch targets. Everything comes from the officer's own records.
export default function InspectorHome() {
  const { user } = useAuth()
  const insp = useInspection()
  const navigate = useNavigate()
  const today = dayOffset(0)

  const mine = getInspections().filter((i) => i.inspectorId === user.id)
  const overdue = mine.filter((i) => inspectionBucket(i) === 'pending' && i.date < today).sort((a, b) => a.date.localeCompare(b.date))
  const todays = mine.filter((i) => i.date === today && i.status !== 'missed')
  const soon = mine.filter((i) => i.status === 'upcoming' && i.date > today && i.date <= dayOffset(7)).sort((a, b) => a.date.localeCompare(b.date))
  const done = mine.filter((i) => i.status === 'completed').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const mySites = getSites().filter((s) => s.assignedOfficer === user.id)
  const mySiteIds = new Set(mySites.map((s) => s.id))
  const followUp = getIssues().filter((i) => mySiteIds.has(i.siteId) && OPEN(i)).sort((a, b) => ['Critical', 'High', 'Medium', 'Low'].indexOf(a.severity) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.severity)).slice(0, 4)
  const notes = getNotifications(user)
  const cam = getCameraStats()
  const openAlerts = getActiveAlerts(user)

  // attendance status for today, from the real check-in / check-out records
  const todayRecs = mine.filter((i) => i.date === today)
  const inRec = todayRecs.find((i) => i.checkIn)
  const draft = insp.draft && !insp.draft.checkOut ? insp.draft : null
  let attendance
  if (draft && draft.checkIn) attendance = { tone: 'blue', icon: LogIn, text: `Checked in at ${formatTime(draft.checkIn.time)} – inspection in progress` }
  else if (inRec && inRec.checkOut) attendance = { tone: 'green', icon: LogOutIcon, text: `Present – checked out at ${formatTime(inRec.checkOut.time)}` }
  else if (inRec) attendance = { tone: 'blue', icon: LogIn, text: `Checked in at ${formatTime(inRec.checkIn.time)}` }
  else if (todays.length) attendance = { tone: 'amber', icon: Clock, text: 'Not checked in yet today' }
  else attendance = { tone: 'gray', icon: Minus, text: 'No inspection scheduled today' }

  // the next site to inspect: today's unfinished work first, then anything overdue
  const queue = [...todays.filter((i) => i.status !== 'completed'), ...overdue.filter((i) => i.date !== today)]
  const nextTask = queue[0]
  const nextSite = nextTask ? getSiteById(nextTask.siteId) : null
  const draftSite = draft ? getSiteById(draft.siteId) : null

  const inspectPath = (site) => `${sitePath(site)}/inspect`
  const begin = (site, stepLabel) => {
    if (!draft || draft.siteId !== site.id) insp.start(site, user)
    navigate(inspectPath(site))
    if (stepLabel && draft && draft.siteId === site.id && draft.checkIn) {
      const idx = STEPS_BY_KIND[draft.kind].indexOf(stepLabel)
      if (idx > 0) insp.goto(idx)
    }
  }
  const startOrResume = () => { const s = draftSite || nextSite; if (s) begin(s) }

  const taskRow = (i, state) => {
    const site = getSiteById(i.siteId)
    if (!site) return null
    return (
      <Link key={i.id} to={sitePath(site)} className={`task ${state}`}>
        <div className="time">{state === 'overdue' ? formatDate(i.date) : i.slot}</div>
        <div className="grow" style={{ minWidth: 0 }}>
          <b>{site.name}</b>
          <div className="muted small">{site.area} · {site.type === 'existing' ? 'Existing site' : `Construction – ${site.phase}`}</div>
        </div>
        <Badge tone={state === 'overdue' ? 'red' : inspectionTone[i.status]}>{state === 'overdue' ? 'Overdue' : i.status.replace('-', ' ')}</Badge>
      </Link>
    )
  }

  return (
    <>
      <section className="hero officer-hero" aria-labelledby="oh-title">
        <h1 id="oh-title">{greeting()}, {user.name.split(' ')[0]}</h1>
        <p>{todayLabel()} · {user.designation}, {user.area}</p>
        <div className="status-strip">
          <span className="status-pill"><attendance.icon size={16} aria-hidden="true" /> {attendance.text}</span>
          <span className="status-pill"><CalendarClock size={16} aria-hidden="true" /> {todays.length} today</span>
          <span className="status-pill"><Clock size={16} aria-hidden="true" /> {overdue.length} overdue</span>
        </div>
      </section>

      <div className="big-actions" aria-label="Quick actions">
        <button className="big-action primary" onClick={startOrResume} disabled={!draftSite && !nextSite}>
          <span className="ico">{draftSite ? <RotateCcw size={22} /> : <PlayCircle size={22} />}</span>
          <span><b>{draftSite ? 'Resume inspection' : 'Start inspection'}</b><span className="d">{draftSite ? draftSite.name : nextSite ? nextSite.name : 'Nothing is due right now'}</span></span>
        </button>
        <button className="big-action" onClick={startOrResume} disabled={!draftSite && !nextSite}>
          <span className="ico tone-blue"><MapPin size={22} /></span>
          <span><b>Verify site location</b><span className="d">GPS check-in is the first step</span></span>
        </button>
        <button className="big-action" onClick={() => draftSite && begin(draftSite, 'Summary')} disabled={!draftSite || !draftSite.checkIn}>
          <span className="ico tone-green"><SendHorizontal size={22} /></span>
          <span><b>Submit inspection</b><span className="d">{draftSite && draftSite.checkIn ? 'Review and send your report' : 'Start an inspection first'}</span></span>
        </button>
        <button className="big-action" onClick={() => draftSite && draftSite.checkIn ? begin(draftSite, 'Issues') : startOrResume()} disabled={!draftSite && !nextSite}>
          <span className="ico tone-orange"><FlagTriangleRight size={22} /></span>
          <span><b>Report an issue</b><span className="d">{draftSite && draftSite.checkIn ? 'Add it to this inspection' : 'Opens after GPS check-in'}</span></span>
        </button>
        <Link className="big-action" to="/inspector/old-sites">
          <span className="ico tone-gray"><ClipboardList size={22} /></span>
          <span><b>View assigned sites</b><span className="d">{mySites.length} site{mySites.length === 1 ? '' : 's'} assigned to you</span></span>
        </Link>
      </div>

      <div className="grid grid-2 section">
        <section className="card" aria-labelledby="oh-today">
          <div className="card-head"><h2 id="oh-today">Today &amp; overdue</h2><span className="muted small">{mine.filter((i) => i.status === 'completed').length} completed so far</span></div>
          {overdue.length === 0 && todays.length === 0 && <div className="empty-inline"><CheckCircle2 size={15} style={{ verticalAlign: '-3px' }} /> <b>You’re all clear for today.</b><span className="muted"> Check the upcoming list or open your assigned sites.</span></div>}
          {overdue.map((i) => taskRow(i, 'overdue'))}
          {todays.filter((i) => !overdue.includes(i)).map((i) => taskRow(i, 'today'))}
        </section>

        <section className="card" aria-labelledby="oh-soon">
          <div className="card-head"><h2 id="oh-soon">Coming up</h2><span className="muted small">next 7 days</span></div>
          {soon.length === 0 && <div className="empty-inline"><b>Nothing scheduled this week.</b><span className="muted"> New assignments will appear here.</span></div>}
          {soon.map((i) => taskRow(i, 'upcoming'))}
        </section>
      </div>

      <div className="grid grid-2 section">
        <section className="card" aria-labelledby="oh-follow">
          <div className="card-head"><h2 id="oh-follow">Issues needing follow-up</h2><Link to="/inspector/alerts" className="muted small">Alerts <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div>
          {followUp.length === 0 && <div className="empty-inline"><CheckCircle2 size={15} style={{ verticalAlign: '-3px' }} /> <b>No open issues at your sites.</b></div>}
          <div className="mini-list">
            {followUp.map((i) => { const site = getSiteById(i.siteId); return (
              <Link key={i.id} to={sitePath(site)} className="list-row">
                <div className="grow"><b>{i.title}</b><div className="muted small">{site.name} · {i.status}</div></div>
                <Badge tone={severityTone[i.severity]}>{i.severity === 'Critical' && <AlertOctagon size={12} />} {i.severity}</Badge>
              </Link>
            ) })}
          </div>
        </section>

        <section className="card" aria-labelledby="oh-done">
          <div className="card-head"><h2 id="oh-done">Recently submitted reports</h2></div>
          {done.length === 0 && <div className="empty-inline"><b>No reports yet.</b><span className="muted"> Completed inspections are listed here.</span></div>}
          <div className="mini-list">
            {done.map((i) => { const site = getSiteById(i.siteId); return (
              <Link key={i.id} to={sitePath(site)} className="list-row">
                <div className="grow"><b>{site.name}</b><div className="muted small">{formatDate(i.date)} · {i.id}{i.summary ? ` · ${i.summary.issues} issue${i.summary.issues === 1 ? '' : 's'} found` : ''}</div></div>
                <Badge tone="green"><CheckCircle2 size={12} /> Submitted</Badge>
              </Link>
            ) })}
          </div>
        </section>
      </div>

      <div className="grid grid-2 section">
        <section className="card" aria-labelledby="oh-notes">
          <div className="card-head"><h2 id="oh-notes">Latest notifications</h2><Link to="/inspector/notifications" className="muted small">View all <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div>
          {notes.length === 0 && <div className="empty-inline"><b>No notifications.</b></div>}
          <div className="mini-list">
            {notes.slice(0, 4).map((n) => {
              const Row = n.link ? Link : 'div'
              return (
                <Row className="list-row" key={n.id} {...(n.link ? { to: n.link, onClick: () => markRead(n.id) } : {})}>
                  {!n.read ? <span className="unread" aria-label="unread" /> : <span style={{ width: 8 }} />}
                  <div className="grow"><b>{n.title}</b><div className="muted small">{n.body}</div><div className="muted small">{relTime(n.at)}</div></div>
                </Row>
              )
            })}
          </div>
        </section>

        <section className="card" aria-labelledby="oh-ws">
          <div className="card-head"><h2 id="oh-ws">Your workspace</h2></div>
          <div className="mini-list">
            <Link to="/inspector/old-sites" className="list-row"><span className="kpi-icon tone-blue"><Building2 size={18} /></span><div className="grow"><b>Old sites</b><div className="muted small">{getSites('existing').filter((s) => s.assignedOfficer === user.id).length} assigned to you</div></div><ChevronRight size={16} /></Link>
            <Link to="/inspector/new-sites" className="list-row"><span className="kpi-icon tone-amber"><HardHat size={18} /></span><div className="grow"><b>New sites</b><div className="muted small">{getSites('construction').filter((s) => s.assignedOfficer === user.id).length} assigned to you</div></div><ChevronRight size={16} /></Link>
            <Link to="/inspector/cctv" className="list-row"><span className="kpi-icon tone-green"><Video size={18} /></span><div className="grow"><b>CCTV</b><div className="muted small">{cam.live} of {cam.total} cameras live</div></div><ChevronRight size={16} /></Link>
            <Link to="/inspector/alerts" className="list-row"><span className="kpi-icon tone-red"><BellRing size={18} /></span><div className="grow"><b>Alerts</b><div className="muted small">{openAlerts.length} open · {openAlerts.filter((a) => a.severity === 'Critical').length} critical</div></div><ChevronRight size={16} /></Link>
          </div>
        </section>
      </div>
    </>
  )
}
