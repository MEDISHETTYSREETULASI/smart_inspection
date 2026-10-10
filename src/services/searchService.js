// Global search (top bar). Searches real records only. An inspector only finds their own sites and issues; officers are Admin-only.
import { getSites, getAllSites, getIssues, getInspectors, getSiteById } from './dataService'
import { sitePath } from '../utils/paths'

const has = (text, q) => String(text || '').toLowerCase().includes(q)

export function globalSearch(user, query, limit = 5) {
  const q = String(query || '').trim().toLowerCase()
  if (q.length < 2 || !user) return []
  const admin = user.role === 'admin'
  const sites = (admin ? getAllSites() : getSites().filter((s) => s.assignedOfficer === user.id))
  const groups = []
  const siteHits = sites.filter((s) => has(`${s.name} ${s.id} ${s.area} ${s.city} ${s.district} ${s.projectName}`, q)).slice(0, limit)
  if (siteHits.length) groups.push({ label: 'Sites / projects', items: siteHits.map((s) => ({ id: s.id, title: s.name, sub: `${s.id} · ${s.area || ''}${s.archived ? ' · archived' : ''}`, to: admin ? `/admin/sites/${s.id}` : sitePath(s) })) })
  const mySiteIds = new Set(sites.map((s) => s.id))
  const issueHits = getIssues().filter((i) => (admin || mySiteIds.has(i.siteId)) && has(`${i.title} ${i.id} ${i.category}`, q)).slice(0, limit)
  if (issueHits.length) groups.push({ label: 'Issues', items: issueHits.map((i) => ({ id: i.id, title: i.title, sub: `${i.id} · ${i.severity} · ${(getSiteById(i.siteId) || {}).name || ''}`, to: admin ? '/admin/issues' : `${sitePath(getSiteById(i.siteId))}` })) })
  if (admin) {
    const off = getInspectors().filter((u) => has(`${u.name} ${u.officerId} ${u.area}`, q)).slice(0, limit)
    if (off.length) groups.push({ label: 'Officers', items: off.map((u) => ({ id: u.id, title: u.name, sub: `${u.officerId} · ${u.area}`, to: `/admin/officers/${u.id}` })) })
  }
  return groups
}
