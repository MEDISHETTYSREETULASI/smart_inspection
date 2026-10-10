import {
  Home, Building2, HardHat, Video, BellRing, UserCircle, Settings,
  LayoutDashboard, Users, FolderKanban, ClipboardCheck, AlertTriangle, BarChart3, CalendarCheck, Shuffle,
} from 'lucide-react'

// Add a page = add one line here + one <Route> in App.jsx.  `group` only controls the small headings in the sidebar.
// (Notifications live behind the bell in the top bar; their page /…/notifications is unchanged.)
export const navByRole = {
  inspector: [
    { to: '/inspector', label: 'Home', icon: Home, end: true, group: 'Field work' },
    { to: '/inspector/old-sites', label: 'Old Sites', icon: Building2, group: 'Field work' },
    { to: '/inspector/new-sites', label: 'New Sites', icon: HardHat, group: 'Field work' },
    { to: '/inspector/cctv', label: 'CCTV', icon: Video, group: 'Monitoring' },
    { to: '/inspector/alerts', label: 'Alerts', icon: BellRing, group: 'Monitoring' },
    { to: '/inspector/profile', label: 'Profile', icon: UserCircle, group: 'Account' },
    { to: '/inspector/settings', label: 'Settings', icon: Settings, group: 'Account' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, group: 'Operations' },
    { to: '/admin/officers', label: 'Officers', icon: Users, group: 'Operations' },
    { to: '/admin/sites', label: 'Sites / Projects', icon: FolderKanban, group: 'Operations' },
    { to: '/admin/inspections', label: 'Inspections', icon: ClipboardCheck, group: 'Operations' },
    { to: '/admin/assignments', label: 'Assignments', icon: Shuffle, group: 'Operations' },
    { to: '/admin/issues', label: 'Issues', icon: AlertTriangle, group: 'Monitoring' },
    { to: '/admin/cctv', label: 'CCTV', icon: Video, group: 'Monitoring' },
    { to: '/admin/alerts', label: 'Alerts', icon: BellRing, group: 'Monitoring' },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, group: 'Monitoring' },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3, group: 'Monitoring' },
    { to: '/admin/settings', label: 'Settings', icon: Settings, group: 'System' },
  ],
}

// Items shown directly in the mobile bottom bar; the rest are in the slide-out menu
export const bottomCount = 4
