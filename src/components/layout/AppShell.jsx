import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, MoreHorizontal, ShieldCheck, ChevronsLeft, X, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useInspection } from '../../context/InspectionContext'
import { useSidebarCollapsed, useTheme } from '../../context/usePrefs'
import { getActiveAlerts } from '../../services/alertService'
import { navByRole, bottomCount } from './navConfig'
import Topbar, { initials } from './Topbar'
import PageSkeleton from '../ui/Skeleton'
import ResetDemoDialog from './ResetDemoDialog'

export default function AppShell() {
  const { user, logout } = useAuth()
  const { clear } = useInspection()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  const [theme, setTheme] = useTheme()

  const items = navByRole[user.role]
  const bottomItems = items.slice(0, bottomCount)
  const openAlerts = getActiveAlerts(user).length

  useEffect(() => { setDrawer(false) }, [location.pathname])
  useEffect(() => {
    if (!drawer) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setDrawer(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  const handleLogout = () => { clear(); logout(); navigate('/login', { replace: true }) }

  const NavItems = ({ showLabelsAlways }) => {
    let last = null
    return items.map(({ to, label, icon: Icon, end, group }) => {
      const head = group !== last ? <div className="nav-group" key={`g-${group}`}>{group}</div> : null
      last = group
      const count = label === 'Alerts' ? openAlerts : 0
      return [head,
        <NavLink key={to} to={to} end={end} title={label}>
          <Icon size={19} aria-hidden="true" /><span className="nav-label">{label}</span>
          {count > 0 && <><span className="count" aria-label={`${count} open`}>{count}</span><span className="dot-count" aria-hidden="true" /></>}
        </NavLink>]
    })
  }

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to main content</a>

      <aside className="sidebar" aria-label="Sidebar">
        <Brand />
        <nav className="nav" aria-label="Main"><NavItems /></nav>
        <div className="side-user">
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-pressed={collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronsLeft size={18} /></button>
        </div>
      </aside>

      <div className="main">
        <Topbar user={user} onMenu={() => setDrawer(true)} onLogout={handleLogout} onReset={() => setResetting(true)} />
        <main id="main" className="page" tabIndex={-1}>
          <div key={location.pathname} className="page-anim">
            <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
          </div>
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Quick navigation">
        {bottomItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}><Icon size={22} aria-hidden="true" />{label.replace(' / Projects', '')}</NavLink>
        ))}
        <button onClick={() => setDrawer(true)}><MoreHorizontal size={22} aria-hidden="true" />More</button>
      </nav>

      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div style={{ display: 'flex', alignItems: 'center' }}><Brand /><button className="icon-btn-plain drawer-close" style={{ color: '#fff' }} onClick={() => setDrawer(false)} aria-label="Close menu"><X size={20} /></button></div>
            <nav className="nav" aria-label="All pages"><NavItems /></nav>
            <div className="side-user" style={{ marginTop: 14 }}>
              <div className="who" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 8px' }}>
                <span className="avatar-sm">{initials(user.name)}</span><div><b>{user.name}</b><span>{user.designation}</span></div>
              </div>
              <button className="logout-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
              <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Log out</button>
            </div>
          </aside>
        </>
      )}
      {resetting && <ResetDemoDialog onClose={() => setResetting(false)} />}
    </div>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><ShieldCheck size={21} /></div>
      <div>
        <div className="brand-name">Smart Inspection</div>
        <div className="brand-sub">Field Monitoring System</div>
      </div>
    </div>
  )
}
