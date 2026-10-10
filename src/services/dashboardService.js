// Numbers for the Admin command centre. Everything is calculated from the live records – nothing is invented.
// A trend is returned ONLY when there is genuine data to compare with (otherwise null, and the card shows no trend).
import { getInspections, getIssues, getAllSites, getSiteById, inspectionBucket, getAdminSummary } from './dataService'
import { getAllRisks, getRiskHistory } from './riskService'
import { dayOffset } from '../utils/date'

const OPEN = (i) => !['Resolved', 'Closed'].includes(i.status)

export function getKpis() {
  const a = getAdminSummary()
  const today = dayOffset(0)
  const sites = getAllSites().filter((s) => !s.archived)
  const insp = getInspections()
  const inWindow = (i, from, to) => i.status === 'completed' && i.date >= dayOffset(from) && i.date <= dayOffset(to)
  const last7 = insp.filter((i) => inWindow(i, -6, 0)).length
  const prev7 = insp.filter((i) => inWindow(i, -13, -7)).length
  const overdue = insp.filter((i) => inspectionBucket(i) === 'pending' && i.date < today).length
  const missed = insp.filter((i) => i.status === 'missed').length

  const risks = getAllRisks().filter((x) => x.risk)
  const highNow = risks.filter((x) => x.risk.level === 'high').length
  // high-risk count "as of the last snapshot before today" – only if at least one site has such a snapshot
  let haveBefore = false
  let highBefore = 0
  for (const { site, risk } of risks) {
    const before = getRiskHistory(site.id).filter((h) => h.date < today).pop()
    if (before) { haveBefore = true; if (before.level === 'high') highBefore += 1 } else if (risk.level === 'high' && !before) { /* new today: not comparable */ }
  }
  return {
    totalSites: sites.length,
    activeProjects: sites.filter((s) => s.type === 'construction' && s.projectStatus === 'in-progress').length,
    completed: a.completed, completedTrend: prev7 > 0 ? { now: last7, before: prev7, delta: last7 - prev7 } : null, completedLast7: last7,
    pending: a.pending, overdue, missed,
    openIssues: a.openIssues, criticalIssues: a.criticalIssues,
    high: highNow, highTrend: haveBefore ? { now: highNow, before: highBefore, delta: highNow - highBefore } : null,
  }
}

// completed / missed inspections per day for the last N days (real records)
export function getActivitySeries(days = 14) {
  const insp = getInspections()
  const out = []
  for (let k = days - 1; k >= 0; k -= 1) {
    const date = dayOffset(-k)
    out.push({ date, completed: insp.filter((i) => i.date === date && i.status === 'completed').length, missed: insp.filter((i) => i.date === date && i.status === 'missed').length })
  }
  return out
}

// overdue first (oldest first), then today, then the next 7 days
export function getUpcomingAndOverdue(limit = 7) {
  const today = dayOffset(0)
  const horizon = dayOffset(7)
  const rows = getInspections().filter((i) => ['upcoming', 'in-progress'].includes(i.status) && i.date <= horizon)
    .map((i) => ({ i, site: getSiteById(i.siteId), state: i.date < today ? 'overdue' : i.date === today ? 'today' : 'upcoming' }))
    .filter((r) => r.site)
  const order = { overdue: 0, today: 1, upcoming: 2 }
  rows.sort((a, b) => order[a.state] - order[b.state] || a.i.date.localeCompare(b.i.date))
  return { rows: rows.slice(0, limit), total: rows.length, overdue: rows.filter((r) => r.state === 'overdue').length, today: rows.filter((r) => r.state === 'today').length }
}

export const getRecentIssues = (limit = 5) => getIssues().filter(OPEN).sort((a, b) => a.daysAgo - b.daysAgo).slice(0, limit)
