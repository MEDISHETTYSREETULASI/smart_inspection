const store = {}
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] } }
globalThis.window = { addEventListener() {} }
// Checks that the dashboard numbers and the global search come from real records. Run: npm run test:risk
import { build } from 'esbuild'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const root = resolve(new URL('..', import.meta.url).pathname)
const dir = mkdtempSync(join(tmpdir(), 'dash-test-'))
writeFileSync(join(dir, 'entry.js'), `
export * from '${root}/src/services/dataService.js'
export * from '${root}/src/services/riskService.js'
export * from '${root}/src/services/dashboardService.js'
export * from '${root}/src/services/searchService.js'
`)
await build({ entryPoints: [join(dir, 'entry.js')], bundle: true, format: 'esm', platform: 'node', outfile: join(dir, 'd1.mjs'), logLevel: 'error' })
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1 }
const M = await import(pathToFileURL(join(dir, 'd1.mjs')).href)
const admin = { id: 'a1', role: 'admin' }, insp = M.getUserById('u1')
const k = M.getKpis(), a = M.getAdminSummary()
ok(k.totalSites === M.getSites().length && k.openIssues === a.openIssues && k.completed === a.completed, 'KPIs equal the underlying summary numbers')
ok(k.highTrend === null, 'no High-risk trend is shown on the first day (no earlier snapshot exists)')
const series = M.getActivitySeries(14)
const total = series.reduce((s, d) => s + d.completed, 0)
ok(total === M.getInspections().filter((i) => i.status === 'completed' && i.date >= series[0].date && i.date <= series[13].date).length, 'activity chart totals match real inspection records (' + total + ' completed)')
const up = M.getUpcomingAndOverdue(50)
ok(up.rows.every((r) => ['overdue', 'today', 'upcoming'].includes(r.state)) && up.rows.every((r, i, arr) => i === 0 || ['overdue', 'today', 'upcoming'].indexOf(arr[i - 1].state) <= ['overdue', 'today', 'upcoming'].indexOf(r.state)), 'upcoming list ordered overdue → today → upcoming')
// search isolation
const sa = M.globalSearch(admin, 'anita'); ok(sa.some((g) => g.label === 'Officers'), 'admin can find officers')
const si = M.globalSearch(insp, 'anita'); ok(!si.some((g) => g.label === 'Officers'), 'officer search never returns officers')
const mine = new Set(M.getSites().filter((s) => s.assignedOfficer === 'u1').map((s) => s.id))
const hits = M.globalSearch(insp, 'school').flatMap((g) => g.items).concat(M.globalSearch(insp, 'hospital').flatMap((g) => g.items))
ok(M.globalSearch(insp, 'civil hospital').filter((g) => g.label === 'Sites / projects').length === 0 || M.globalSearch(insp, 'civil hospital')[0].items.every((i) => mine.has(i.id)), 'officer only finds their own sites')
ok(M.globalSearch(admin, 'a').length === 0, 'one-letter queries are ignored')
console.log(process.exitCode ? 'SOME FAILED' : 'DASHBOARD/SEARCH CHECKS PASSED')
