import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, Pencil, RefreshCw, FolderKanban, HardHat, Building2, Activity, CheckCircle2, MapPin, ArrowUp, ArrowDown, ChevronsUpDown, LayoutList, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSiteRows } from '../../services/adminService'
import { getInspectors } from '../../services/dataService'
import { getAllRisks } from '../../services/riskService'
import { RiskBar } from '../../components/risk/RiskVisuals'
import { inspectionSchedule } from '../../utils/schedule'
import { siteTone, siteLabel, progressStatus } from '../../utils/status'
import { formatDate } from '../../utils/date'
import { PROJECT_STATUSES, projectStatusLabel, projectStatusTone, frequencyLabel } from '../../data/siteOptions'
import PageHead from '../../components/ui/PageHead'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Toast from '../../components/ui/Toast'
import SiteFormModal from '../../components/sites/SiteFormModal'
import { StatusModal } from '../../components/sites/QuickModals'

const cmpStr = (a, b) => String(a || '').localeCompare(String(b || ''), undefined, { numeric: true })
// key → [label for the sort menu, default direction, value used for sorting]
const SORTS = {
  newest: ['Newest first', 'desc', (r) => `${r.site.registeredOn || ''}|${String(r.site.id).padStart(8, '0')}`],
  name: ['Site name', 'asc', (r) => r.site.name.toLowerCase()],
  type: ['Type', 'asc', (r) => r.site.type],
  officer: ['Officer', 'asc', (r) => (r.officer ? r.officer.name : 'zzz')],
  status: ['Status', 'asc', (r) => r.site.projectStatus],
  progress: ['Progress', 'desc', (r) => (r.site.type === 'construction' ? r.site.actualProgress : -1)],
  risk: ['Risk score', 'desc', (r) => (r.risk ? r.risk.score : -1)],
  next: ['Next inspection', 'asc', (r) => inspectionSchedule(r.site, r.lastDone).due || '9999'],
  inspected: ['Last inspection', 'desc', (r) => r.site.lastInspected || ''],
  issues: ['Open issues', 'desc', (r) => r.openIssues],
}
const FILTER_DEFAULT = { type: 'all', department: 'all', officer: 'all', district: 'all', status: 'all', view: 'active', risk: 'all' }
const PAGE_SIZES = [10, 25, 50]

export default function Sites() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)
  const [q, setQ] = useState('')
  const [f, setF] = useState({ ...FILTER_DEFAULT, type: ['existing', 'construction'].includes(params.get('type')) ? params.get('type') : 'all', risk: ['high', 'medium', 'low'].includes(params.get('risk')) ? params.get('risk') : 'all' })
  const [sort, setSort] = useState(() => (params.get('sort') === 'risk' || params.get('risk') ? { key: 'risk', dir: 'desc' } : { key: 'newest', dir: 'desc' }))
  const [view, setView] = useState(() => { try { return localStorage.getItem('sih_sites_view') === 'cards' ? 'cards' : 'table' } catch { return 'table' } })
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(() => (params.get('new') === '1' ? { site: null } : null)) // null | { site } (site = null → add)
  const [statusFor, setStatusFor] = useState(null)
  const [toast, setToast] = useState(location.state && location.state.toast ? { text: location.state.toast, tone: 'ok' } : null)
  const setFilter = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const chooseView = (v) => { setView(v); try { localStorage.setItem('sih_sites_view', v) } catch { /* ignore */ } }

  const riskMap = Object.fromEntries(getAllRisks().map((x) => [x.site.id, x.risk]))
  const all = getSiteRows().map((r) => ({ ...r, risk: riskMap[r.site.id] || null }))
  const active = all.filter((r) => !r.site.archived)
  const officers = getInspectors()
  const departments = useMemo(() => [...new Set(all.map((r) => r.site.department).filter(Boolean))].sort(), [all.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const districts = useMemo(() => [...new Set(all.map((r) => r.site.district).filter(Boolean))].sort(), [all.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = {
    total: active.length,
    fresh: active.filter((r) => r.site.type === 'construction').length,
    old: active.filter((r) => r.site.type === 'existing').length,
    progress: active.filter((r) => r.site.projectStatus === 'in-progress').length,
    done: active.filter((r) => r.site.projectStatus === 'completed').length,
  }
  const archivedCount = all.length - active.length

  const needle = q.trim().toLowerCase()
  const sortFn = SORTS[sort.key][2]
  const rows = all.filter(({ site: s, officer, risk }) =>
    (f.view === 'all' || (f.view === 'archived') === !!s.archived) &&
    (f.type === 'all' || s.type === f.type) && (f.department === 'all' || s.department === f.department) &&
    (f.officer === 'all' || s.assignedOfficer === f.officer) && (f.district === 'all' || s.district === f.district) &&
    (f.status === 'all' || s.projectStatus === f.status) && (f.risk === 'all' || (risk && risk.level === f.risk)) &&
    (!needle || `${s.name} ${s.projectName || ''} ${s.id} ${s.area} ${s.city || ''} ${s.district || ''} ${s.address || ''} ${s.contractor || ''} ${officer ? officer.name : ''}`.toLowerCase().includes(needle))
  ).sort((a, b) => {
    const x = sortFn(a); const y = sortFn(b)
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : cmpStr(x, y)
    return (sort.dir === 'asc' ? c : -c) || cmpStr(a.site.id, b.site.id)
  })
  const filtered = needle || Object.entries(f).some(([k, val]) => (k === 'view' ? val !== 'active' : val !== 'all'))
  const clear = () => { setQ(''); setF({ ...FILTER_DEFAULT }) }

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => { setPage(1) }, [q, f, sort, pageSize])
  const cur = Math.min(page, pages)
  const shown = rows.slice((cur - 1) * pageSize, cur * pageSize)

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: SORTS[key][1] }))
  const th = (k, children) => (
    <th key={k} scope="col" aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className="th-sort" onClick={() => toggleSort(k)}>{children}{sort.key === k ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} style={{ opacity: .5 }} />}</button>
    </th>
  )

  const say = (text, tone = 'ok') => setToast({ text, tone })
  const typePill = (s) => <span className={`type-pill ${s.type === 'construction' ? 'new' : ''}`}>{s.type === 'existing' ? <><Building2 size={12} /> Existing</> : <><HardHat size={12} /> New</>}</span>
  const progress = (s) => {
    if (s.type !== 'construction') return <span className="muted small">Operational site</span>
    const ps = progressStatus(s.expectedProgress, s.actualProgress)
    return (
      <div className={`prog ${s.actualProgress < s.expectedProgress ? 'behind' : ''}`} title={`Actual ${s.actualProgress}% vs expected ${s.expectedProgress}%`}>
        <div className="track" role="progressbar" aria-valuenow={s.actualProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress ${s.actualProgress}%`}><span style={{ width: `${s.actualProgress}%` }} /></div>
        <span>{s.actualProgress}% · {ps.label}</span>
      </div>
    )
  }
  const actions = (s) => (
    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
      <button className="btn btn-ghost icon-btn" title="Edit site" aria-label={`Edit ${s.name}`} onClick={() => setForm({ site: s })}><Pencil size={15} /></button>
      <button className="btn btn-ghost icon-btn" title="Change status" aria-label={`Change status of ${s.name}`} disabled={s.archived} onClick={() => setStatusFor(s)}><RefreshCw size={15} /></button>
    </div>
  )
  const badges = (s) => (
    <div className="pill-row">
      <Badge tone={projectStatusTone[s.projectStatus]}>{projectStatusLabel[s.projectStatus]}</Badge>
      {s.archived && <Badge tone="gray">Archived</Badge>}
    </div>
  )

  return (
    <>
      <PageHead title="Sites / projects" subtitle="Register, manage and monitor every old and new site.">
        <button className="btn" onClick={() => setForm({ site: null })}><Plus size={18} /> Add site</button>
      </PageHead>

      <div className="grid grid-4 stats-5">
        <StatCard icon={FolderKanban} label="Total sites" value={stats.total} />
        <StatCard icon={HardHat} label="New sites" value={stats.fresh} tone="amber" />
        <StatCard icon={Building2} label="Existing sites" value={stats.old} tone="gray" />
        <StatCard icon={Activity} label="In-progress projects" value={stats.progress} />
        <StatCard icon={CheckCircle2} label="Completed projects" value={stats.done} tone="green" />
      </div>

      <div className="filters" style={{ marginTop: 18 }} role="search" aria-label="Filter sites">
        <input type="search" placeholder="Search by name, site ID or location" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sites" style={{ flex: '2 1 240px' }} />
        <select value={f.type} onChange={setFilter('type')} aria-label="Filter by site type"><option value="all">All types</option><option value="existing">Old / existing</option><option value="construction">New sites</option></select>
        <select value={f.department} onChange={setFilter('department')} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select>
        <select value={f.district} onChange={setFilter('district')} aria-label="Filter by district"><option value="all">All districts</option>{districts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
        <select value={f.officer} onChange={setFilter('officer')} aria-label="Filter by officer"><option value="all">All officers</option>{officers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select value={f.status} onChange={setFilter('status')} aria-label="Filter by status"><option value="all">All statuses</option>{PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select value={f.risk} onChange={setFilter('risk')} aria-label="Filter by risk level"><option value="all">All risk levels</option><option value="high">High risk</option><option value="medium">Medium risk</option><option value="low">Low risk</option></select>
        <select value={f.view} onChange={setFilter('view')} aria-label="Show active or archived"><option value="active">Active sites</option><option value="archived">Archived ({archivedCount})</option><option value="all">Active + archived</option></select>
      </div>

      <div className="toolbar">
        <div className="muted small" role="status" aria-live="polite">{rows.length} site{rows.length === 1 ? '' : 's'}{filtered ? ' match your filters' : ''}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 500 }}><span className="small muted">Sort</span>
            <select value={sort.key} onChange={(e) => setSort({ key: e.target.value, dir: SORTS[e.target.value][1] })} aria-label="Sort sites" style={{ padding: '7px 9px' }}>{Object.entries(SORTS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}</select>
          </label>
          <div className="view-toggle" role="group" aria-label="Layout">
            <button aria-pressed={view === 'table'} onClick={() => chooseView('table')}><LayoutList size={15} /> Table</button>
            <button aria-pressed={view === 'cards'} onClick={() => chooseView('cards')}><LayoutGrid size={15} /> Cards</button>
          </div>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="card empty-state">
          <Search size={22} />
          {all.length === 0 ? (
            <><b>No sites registered yet</b><span className="muted">Add the first site to start inspections.</span><button className="btn" onClick={() => setForm({ site: null })}><Plus size={16} /> Add site</button></>
          ) : (
            <><b>No sites match your filters</b><span className="muted">Try changing your search or removing a filter.</span>{filtered && <button className="btn btn-ghost" onClick={clear}>Clear filters</button>}</>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <>
          {view === 'table' && (
            <div className="card table-wrap only-wide" style={{ padding: 0 }}>
              <table>
                <caption className="sr-only">Sites and projects</caption>
                <thead><tr>
                  {th('name', 'Site')}{th('type', 'Type')}<th scope="col">Location</th>{th('officer', 'Officer')}{th('progress', 'Progress')}
                  {th('status', 'Status')}{th('risk', 'Risk')}{th('next', 'Inspection')}{th('issues', 'Issues')}<th scope="col"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {shown.map(({ site: s, officer, openIssues, lastDone, risk }) => {
                    const sch = inspectionSchedule(s, lastDone)
                    return (
                      <tr key={s.id} className={`row-link${s.archived ? ' is-archived' : ''}`} onClick={() => navigate(`/admin/sites/${s.id}`)}>
                        <td><Link to={`/admin/sites/${s.id}`} onClick={(e) => e.stopPropagation()}><b>{s.name}</b></Link><div className="muted small">{s.id}{s.projectName ? ` · ${s.projectName}` : ''}</div></td>
                        <td>{typePill(s)}{s.type === 'construction' && <div className="muted small" style={{ marginTop: 3 }}>{s.phase}</div>}</td>
                        <td>{s.area}{s.district && s.district !== s.area && <div className="muted small">{s.district}</div>}</td>
                        <td>{officer ? officer.name : <span className="bad">Unassigned</span>}<div className="muted small">{frequencyLabel[s.inspectionFrequency]}</div></td>
                        <td>{progress(s)}</td>
                        <td>{badges(s)}<div style={{ marginTop: 4 }}><Badge tone={siteTone[s.status]}>{siteLabel[s.status]}</Badge></div></td>
                        <td title={risk ? risk.summary : ''}><RiskBar risk={risk} /><div className="muted small">{risk ? risk.levelLabel : ''}</div></td>
                        <td><Badge tone={sch.tone}>{sch.label}</Badge><div className="muted small">Last: {formatDate(s.lastInspected)}</div></td>
                        <td>{openIssues > 0 ? <Badge tone="orange">{openIssues} open</Badge> : <span className="muted">None</span>}</td>
                        <td>{actions(s)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className={`site-cards${view === 'cards' ? ' show' : ''} only-narrow`}>
            {shown.map(({ site: s, officer, openIssues, lastDone, risk }) => {
              const sch = inspectionSchedule(s, lastDone)
              return (
                <div key={s.id} className={`card site-card${s.archived ? ' is-archived' : ''}`}>
                  <Link to={`/admin/sites/${s.id}`} className="site-card-main">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}><b>{s.name}</b>{typePill(s)}</div>
                    <div className="muted small">{s.id}{s.projectName ? ` · ${s.projectName}` : ''}</div>
                    <ul className="meta-list">
                      <li><MapPin size={14} /> {s.area}{s.district && s.district !== s.area ? `, ${s.district}` : ''}</li>
                      <li>Officer: {officer ? officer.name : 'Unassigned'} · {frequencyLabel[s.inspectionFrequency]}</li>
                      <li>Last inspection: {formatDate(s.lastInspected)}</li>
                    </ul>
                    <div style={{ margin: '4px 0' }}><RiskBar risk={risk} /></div>
                    {s.type === 'construction' && <div style={{ margin: '4px 0' }}>{progress(s)}</div>}
                    <div className="pill-row">
                      {badges(s)}
                      <Badge tone={siteTone[s.status]}>{siteLabel[s.status]}</Badge>
                      <Badge tone={sch.tone}>{sch.label}</Badge>
                      {openIssues > 0 && <Badge tone="orange">{openIssues} open issue{openIssues === 1 ? '' : 's'}</Badge>}
                    </div>
                  </Link>
                  {actions(s)}
                </div>
              )
            })}
          </div>

          <div className="pager">
            <span>Showing {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, rows.length)} of {rows.length}{rows.length !== all.length ? ` (${all.length} in total)` : ''}</span>
            <div className="pager-btns">
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 500 }}><span className="small">Per page</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Sites per page">{PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </label>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(cur - 1)} disabled={cur <= 1} aria-label="Previous page"><ChevronLeft size={15} /></button>
              <span aria-live="polite">Page {cur} of {pages}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(cur + 1)} disabled={cur >= pages} aria-label="Next page"><ChevronRight size={15} /></button>
            </div>
          </div>
        </>
      )}

      {form && (
        <SiteFormModal site={form.site} actor={user} onClose={() => setForm(null)}
          onSaved={(saved, msg) => { setForm(null); refresh(); say(msg); if (!form.site) navigate(`/admin/sites/${saved.id}`, { state: { toast: msg } }) }} />
      )}
      {statusFor && <StatusModal site={statusFor} actor={user} onClose={() => setStatusFor(null)} onSaved={(msg) => { setStatusFor(null); refresh(); say(msg) }} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
