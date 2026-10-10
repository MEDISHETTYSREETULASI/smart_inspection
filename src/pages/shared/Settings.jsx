import { useState } from 'react'
import { Sun, Moon, SlidersHorizontal, RotateCcw, PanelLeft, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme, useSidebarCollapsed } from '../../context/usePrefs'
import PageHead from '../../components/ui/PageHead'
import Toast from '../../components/ui/Toast'
import ResetDemoDialog from '../../components/layout/ResetDemoDialog'
import RiskSettingsModal from '../../components/risk/RiskSettingsModal'

// Shared by Admin and Officer. Appearance is saved on this device; risk settings and data reset are Admin-only.
export default function Settings() {
  const { user } = useAuth()
  const [theme, setTheme] = useTheme()
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  const [reset, setReset] = useState(false)
  const [risk, setRisk] = useState(false)
  const [toast, setToast] = useState(null)
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const admin = user.role === 'admin'

  return (
    <>
      <PageHead title="Settings" subtitle="Appearance and preferences for this device" />
      <div className="settings-grid">
        <section className="card" aria-labelledby="set-look">
          <h2 id="set-look" style={{ marginBottom: 6 }}>Appearance</h2>
          <div className="setting-row">
            <div><b>Theme</b><div className="muted small">Light is best in bright daylight; dark is easier on the eyes at night.</div></div>
            <div className="seg two" role="radiogroup" aria-label="Theme" style={{ minWidth: 200 }}>
              <button role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}><Sun size={15} /> Light</button>
              <button role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}><Moon size={15} /> Dark</button>
            </div>
          </div>
          <div className="setting-row">
            <div><b><PanelLeft size={15} style={{ verticalAlign: '-2px' }} /> Compact sidebar</b><div className="muted small">Show only icons in the desktop sidebar.</div></div>
            <button className="switch" role="switch" aria-checked={collapsed} aria-label="Compact sidebar" onClick={() => setCollapsed(!collapsed)} />
          </div>
          <div className="setting-row">
            <div><b>Animations</b><div className="muted small">The app follows your device’s “reduce motion” setting. It is currently {reduced ? 'ON, so animations are switched off' : 'off, so light animations are shown'}.</div></div>
          </div>
        </section>

        <section className="card" aria-labelledby="set-acc">
          <h2 id="set-acc" style={{ marginBottom: 6 }}>Account</h2>
          <dl className="kv">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Role</dt><dd>{admin ? 'Administrator' : 'Field officer'}</dd></div>
            <div><dt>Designation</dt><dd>{user.designation}</dd></div>
            <div><dt>Officer ID</dt><dd>{user.officerId}</dd></div>
            <div><dt>Department</dt><dd>{user.department}</dd></div>
          </dl>
        </section>

        {admin && (
          <section className="card" aria-labelledby="set-risk">
            <h2 id="set-risk" style={{ marginBottom: 6 }}>Smart risk scoring</h2>
            <p className="muted small">The score is rule-based and explainable. You can change how much each factor counts and where Low / Medium / High begin.</p>
            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setRisk(true)}><SlidersHorizontal size={16} /> Adjust risk weights</button>
          </section>
        )}

        <section className="card" aria-labelledby="set-data">
          <h2 id="set-data" style={{ marginBottom: 6 }}>About &amp; data</h2>
          <p className="muted small"><Info size={14} style={{ verticalAlign: '-2px' }} /> This prototype keeps its data in this browser, so it stays after a refresh but is not shared between devices.</p>
          <button className="btn btn-ghost danger" style={{ marginTop: 12 }} onClick={() => setReset(true)}><RotateCcw size={16} /> Reset demo data…</button>
        </section>
      </div>
      {reset && <ResetDemoDialog onClose={() => setReset(false)} />}
      {risk && <RiskSettingsModal actor={user} onClose={() => setRisk(false)} onSaved={(m) => { setRisk(false); setToast({ text: m, tone: 'ok' }) }} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
