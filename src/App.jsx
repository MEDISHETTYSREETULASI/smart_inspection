import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import './services/riskService' // starts the risk engine (it listens for inspection / issue / site changes)
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/auth/Login'
const InspectorHome = lazy(() => import('./pages/inspector/InspectorHome'))
const OldSites = lazy(() => import('./pages/inspector/OldSites'))
const SiteDetails = lazy(() => import('./pages/inspector/SiteDetails'))
const InspectionWizard = lazy(() => import('./pages/inspector/InspectionWizard'))
const ProjectDetails = lazy(() => import('./pages/inspector/ProjectDetails'))
const NewSites = lazy(() => import('./pages/inspector/NewSites'))
const Profile = lazy(() => import('./pages/inspector/Profile'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const Officers = lazy(() => import('./pages/admin/Officers'))
const OfficerDetail = lazy(() => import('./pages/admin/OfficerDetail'))
const SiteDetail = lazy(() => import('./pages/admin/SiteDetail'))
const Assignments = lazy(() => import('./pages/admin/Assignments'))
const Attendance = lazy(() => import('./pages/admin/Attendance'))
const Sites = lazy(() => import('./pages/admin/Sites'))
const Inspections = lazy(() => import('./pages/admin/Inspections'))
const Issues = lazy(() => import('./pages/admin/Issues'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const CCTV = lazy(() => import('./pages/shared/CCTV'))
const Alerts = lazy(() => import('./pages/shared/Alerts'))
const Notifications = lazy(() => import('./pages/shared/Notifications'))
const Settings = lazy(() => import('./pages/shared/Settings'))

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/inspector" element={<ProtectedRoute role="inspector" />}>
        <Route element={<AppShell />}>
          <Route index element={<InspectorHome />} />
          <Route path="old-sites" element={<OldSites />} />
          <Route path="old-sites/:siteId" element={<SiteDetails />} />
          <Route path="old-sites/:siteId/inspect" element={<InspectionWizard />} />
          <Route path="new-sites" element={<NewSites />} />
          <Route path="new-sites/:siteId" element={<ProjectDetails />} />
          <Route path="new-sites/:siteId/inspect" element={<InspectionWizard />} />
          <Route path="cctv" element={<CCTV />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/admin" element={<ProtectedRoute role="admin" />}>
        <Route element={<AppShell />}>
          <Route index element={<AdminDashboard />} />
          <Route path="officers" element={<Officers />} />
          <Route path="officers/:officerId" element={<OfficerDetail />} />
          <Route path="sites" element={<Sites />} />
          <Route path="sites/:siteId" element={<SiteDetail />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="issues" element={<Issues />} />
          <Route path="cctv" element={<CCTV />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
    </Routes>
  )
}
