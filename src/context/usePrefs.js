import { useSyncExternalStore } from 'react'

// Theme (light / dark) and sidebar state. Saved in localStorage; applied as data-theme / data-sidebar on <html>
// (index.html applies the saved values before first paint). Any component can read them with useTheme() / useSidebar().
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const root = () => document.documentElement

export const getTheme = () => (typeof document !== 'undefined' && root().getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
export function setTheme(t) {
  root().setAttribute('data-theme', t)
  try { localStorage.setItem('sih_theme', t) } catch { /* storage unavailable: theme still applies for this visit */ }
  emit()
}
export const useTheme = () => [useSyncExternalStore(subscribe, getTheme, () => 'light'), setTheme]

export const getCollapsed = () => typeof document !== 'undefined' && root().getAttribute('data-sidebar') === 'collapsed'
export function setCollapsed(on) {
  if (on) root().setAttribute('data-sidebar', 'collapsed'); else root().removeAttribute('data-sidebar')
  try { localStorage.setItem('sih_sidebar', on ? 'collapsed' : 'open') } catch { /* ignore */ }
  emit()
}
export const useSidebarCollapsed = () => [useSyncExternalStore(subscribe, getCollapsed, () => false), setCollapsed]
