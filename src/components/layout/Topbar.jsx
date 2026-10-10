import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, Settings, LogOut, RotateCcw, UserCircle, X } from 'lucide-react'
import { useTheme } from '../../context/usePrefs'
import { globalSearch } from '../../services/searchService'
import { getNotifications, markRead, markAllRead } from '../../services/notificationService'
import { relTime } from '../../utils/date'

// click outside / Escape closes a menu
function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return undefined
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) close() }
    const key = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open, close, ref])
}

export const initials = (name) => String(name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Topbar({ user, onMenu, onLogout, onReset }) {
  return (
    <header className="topbar">
      <div className="tb-left">
        <button className="icon-btn-plain hamburger" onClick={onMenu} aria-label="Open navigation menu"><Menu size={22} /></button>
        <div className="brand"><div className="brand-name">Smart Inspection</div></div>
        <GlobalSearch user={user} />
      </div>
      <div className="tb-right">
        <ThemeButton />
        <NotificationCenter user={user} />
        <ProfileMenu user={user} onLogout={onLogout} onReset={onReset} />
      </div>
    </header>
  )
}

function ThemeButton() {
  const [theme, setTheme] = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button className="icon-btn-plain" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

function GlobalSearch({ user }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [hot, setHot] = useState(0)
  const ref = useRef(null)
  const input = useRef(null)
  const groups = useMemo(() => globalSearch(user, q), [user, q])
  const flat = groups.flatMap((g) => g.items)
  const close = () => { setOpen(false); setMobile(false) }
  useDismiss(ref, open || mobile, close)

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement && document.activeElement.tagName)
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); setMobile(true); setOpen(true); setTimeout(() => input.current && input.current.focus(), 0) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (item) => { navigate(item.to); setQ(''); close() }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHot((h) => Math.min(h + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHot((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && flat[hot]) { e.preventDefault(); go(flat[hot]) }
  }
  let n = -1
  return (
    <>
      <button className="icon-btn-plain search-toggle" aria-label="Search" onClick={() => { setMobile(true); setOpen(true); setTimeout(() => input.current && input.current.focus(), 0) }}><Search size={20} /></button>
      <div className={`search${mobile ? ' open' : ''}`} ref={ref} role="search">
        <Search size={16} />
        <input ref={input} type="search" value={q} placeholder={user.role === 'admin' ? 'Search sites, issues, officers…' : 'Search your sites and issues…'}
          aria-label="Search" aria-expanded={open && q.length >= 2} aria-controls="search-results" autoComplete="off"
          onChange={(e) => { setQ(e.target.value); setHot(0); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} />
        <kbd aria-hidden="true">/</kbd>
        {open && q.trim().length >= 2 && (
          <div className="menu" id="search-results" role="listbox">
            {groups.length === 0 && <div className="menu-empty">Nothing matches “{q.trim()}”. Try a site name, an ID such as S-101, or part of an address.</div>}
            {groups.map((g) => (
              <div className="menu-group" key={g.label}>
                <div className="menu-label">{g.label}</div>
                {g.items.map((it) => { n += 1; const idx = n; return (
                  <button key={it.id} role="option" aria-selected={hot === idx} className={`menu-item${hot === idx ? ' hot' : ''}`} onMouseEnter={() => setHot(idx)} onClick={() => go(it)}>
                    <span><b>{it.title}</b><small>{it.sub}</small></span>
                  </button>
                ) })}
              </div>
            ))}
          </div>
        )}
        {mobile && <button className="icon-btn-plain" style={{ position: 'absolute', right: 0, top: 0 }} onClick={close} aria-label="Close search"><X size={18} /></button>}
      </div>
    </>
  )
}

function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false)
  const [, setV] = useState(0)
  const ref = useRef(null)
  const navigate = useNavigate()
  useDismiss(ref, open, () => setOpen(false))
  const notes = getNotifications(user)
  const unread = notes.filter((x) => !x.read).length
  const all = `/${user.role}/notifications`
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn-plain" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell size={20} />{unread > 0 && <span className="pip" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="menu right" role="menu" aria-label="Notifications">
          <div className="menu-group">
            <div className="menu-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Notifications</span>
              {unread > 0 && <button className="mini-link" onClick={() => { markAllRead(user); setV((v) => v + 1) }}>Mark all read</button>}
            </div>
            {notes.length === 0 && <div className="menu-empty">You’re all caught up. New activity will show up here.</div>}
            {notes.slice(0, 6).map((x) => (
              <button key={x.id} className="menu-item" role="menuitem" onClick={() => { markRead(x.id); setOpen(false); if (x.link) navigate(x.link) }}>
                {!x.read ? <span className="unread" aria-label="unread" /> : <span style={{ width: 8 }} />}
                <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontWeight: x.read ? 500 : 700 }}>{x.title}</b><small>{x.body}</small><small>{relTime(x.at)}</small></span>
              </button>
            ))}
          </div>
          <div className="menu-foot"><Link className="btn btn-ghost btn-sm" style={{ width: '100%' }} to={all} onClick={() => setOpen(false)}>View all notifications</Link></div>
        </div>
      )}
    </div>
  )
}

function ProfileMenu({ user, onLogout, onReset }) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useTheme()
  const ref = useRef(null)
  useDismiss(ref, open, () => setOpen(false))
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="profile-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)} aria-label="Account menu">
        <span className="avatar-sm" aria-hidden="true">{initials(user.name)}</span>
        <span className="who"><b>{user.name}</b><span>{user.role === 'admin' ? 'Administrator' : user.designation}</span></span>
      </button>
      {open && (
        <div className="menu right" role="menu" style={{ width: 280 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <b>{user.name}</b>
            <div className="muted small">{user.designation} · {user.officerId}</div>
            <div className="muted small">{user.department}</div>
          </div>
          <div className="menu-group">
            {user.role === 'inspector' && <Link className="menu-item" role="menuitem" to="/inspector/profile" onClick={() => setOpen(false)}><UserCircle size={17} /> My profile</Link>}
            <Link className="menu-item" role="menuitem" to={`/${user.role}/settings`} onClick={() => setOpen(false)}><Settings size={17} /> Settings</Link>
            <button className="menu-item" role="menuitem" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            <button className="menu-item" role="menuitem" onClick={() => { setOpen(false); onReset() }}><RotateCcw size={17} /> Reset demo data…</button>
            <button className="menu-item" role="menuitem" onClick={onLogout}><LogOut size={17} /> Log out</button>
          </div>
        </div>
      )}
    </div>
  )
}
