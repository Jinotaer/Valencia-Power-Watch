import Redirect from './Redirect'
import LandingPage from '../pages/landingPage'
import AdminLogin from '../pages/auth/admin/login'
import AdminForgotPassword from '../pages/auth/admin/forgotPassword'
import AdminResetPassword from '../pages/auth/admin/resetPassword'
import AdminDashboard from '../pages/admin/dashboard'
import AdminProfile from '../pages/admin/profile'
import AdminAnalytics from '../pages/admin/analytics'
import AdminAuditLogs from '../pages/admin/auditLogs'
import AdminNotifications from '../pages/admin/notifications'
import AdminSettings from '../pages/admin/settings'
import AdminUsers from '../pages/admin/users'
import AdminResidents from '../pages/admin/residents'
import AdminSchedules from '../pages/admin/schedules'
import AdminAnnouncements from '../pages/admin/announcements'
import AdminBarangay from '../pages/admin/barangay'
import AdminMap from '../pages/admin/map'
import AdminReports from '../pages/admin/reports'
import PortalLogin from '../pages/auth/resident-staff/login'
import PortalForgotPassword from '../pages/auth/resident-staff/forgotPassword'
import { ResidentResetPassword, StaffResetPassword } from '../pages/auth/resident-staff/resetPassword'
import ResidentRegister from '../pages/auth/resident-staff/register'
import ResidentHome from '../pages/resident/home'
import ResidentAnnouncements from '../pages/resident/announcements'
import ResidentNotifications from '../pages/resident/notifications'
import ResidentFeedback from '../pages/resident/feedback'
import ResidentSchedules from '../pages/resident/schedule'
import ResidentReports from '../pages/resident/reports'
import ResidentReportDetail from '../pages/resident/reportDetail'
import ResidentProfile from '../pages/resident/profile'
import ResidentMap from '../pages/resident/map'
import SubmitReport from '../pages/resident/submitReport'
import StaffHome from '../pages/staff/home'
import StaffJobs from '../pages/staff/jobs'
import StaffMap from '../pages/staff/map'
import StaffNotifications from '../pages/staff/notifications'
import StaffProfile from '../pages/staff/profile'

/* -------------------------------------------------------------------------- */
/*  Route configuration                                                       */
/* -------------------------------------------------------------------------- */

// Routes that only signed-in users may enter.
export const privateRoutes = ['/admin', '/staff', '/community', '/resident']

// Routes owned by the auth flow (login, register, forgot/reset password).
export const authRoutes = [
  '/admin/login',
  '/community/login',
  '/staff/login',
  '/login',
  '/community/register',
  '/forgot-password',
  '/community/forgot-password',
  '/staff/forgot-password',
  '/admin/forgot-password',
  '/reset-password',
  '/admin/reset-password',
  '/community/reset-password',
  '/staff/reset-password',
]

// Users arriving from a password-recovery email hold a temporary session.
// They must be allowed to stay on these pages to set a new password.
export const resetRoutes = [
  '/reset-password',
  '/admin/reset-password',
  '/community/reset-password',
  '/staff/reset-password',
]

// Where each section sends signed-out users. Residents and staff share one
// login; the admin console keeps its own.
export const sectionLogin = {
  admin: '/admin/login',
  staff: '/login',
  community: '/login',
}

// PWA manifest per section. `null` means no manifest (admin is not installable).
// Resident and staff portals share one manifest; the public landing page uses it
// too.
export const sectionManifest = {
  admin: null,
  staff: '/community-manifest.webmanifest',
  community: '/community-manifest.webmanifest',
}
export const defaultManifest = '/community-manifest.webmanifest'

/* -------------------------------------------------------------------------- */
/*  Path helpers                                                              */
/* -------------------------------------------------------------------------- */

// Strip trailing slashes so "/admin/login/" behaves like "/admin/login".
export const normalizePath = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

// Exact match or a true sub-path ("/admin" matches "/admin/users", not "/administrator").
export const matches = (path, route) => path === route || path.startsWith(`${route}/`)
export const matchesAny = (path, routes) => routes.some((route) => matches(path, route))

// Build the current section (portal area) from the path.
export const getSection = (path) => {
  if (matches(path, '/admin')) return 'admin'
  if (matches(path, '/staff')) return 'staff'
  if (matches(path, '/community') || matches(path, '/resident')) return 'community'
  return null
}

export const portalForRole = (role) => {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/community'
}

export const isAllowedSection = (section, role) => {
  if (section === 'admin') return role === 'admin'
  if (section === 'staff') return role === 'staff'
  if (section === 'community') return role === 'resident'
  return true
}

/* -------------------------------------------------------------------------- */
/*  Page tables                                                               */
/* -------------------------------------------------------------------------- */

// Legacy per-portal login URLs (old links, bookmarks) live on as redirects to
// the one shared login.
// Exact-match pages. Built once so lookups are a simple Map.get().
const pageRoutes = new Map([
  // Auth
  ['/admin/login', <AdminLogin />],
  ['/login', <PortalLogin />],
  ['/community/login', <Redirect to="/login" />],
  ['/staff/login', <Redirect to="/login" />],
  ['/community/register', <ResidentRegister />],
  ['/forgot-password', <PortalForgotPassword role="resident" />],
  ['/community/forgot-password', <PortalForgotPassword role="resident" />],
  ['/staff/forgot-password', <PortalForgotPassword role="staff" />],
  ['/admin/forgot-password', <AdminForgotPassword />],
  ['/reset-password', <ResidentResetPassword />],
  ['/community/reset-password', <ResidentResetPassword />],
  ['/staff/reset-password', <StaffResetPassword />],
  ['/admin/reset-password', <AdminResetPassword />],

  // Resident
  ['/community/profile', <ResidentProfile />],
  ['/resident/profile', <ResidentProfile />],
  ['/community/map', <ResidentMap />],
  ['/resident/map', <ResidentMap />],
  ['/community/reports/new', <SubmitReport />],
  ['/resident/reports/new', <SubmitReport />],
  ['/community/submit-report', <SubmitReport />],
  ['/community/reports', <ResidentReports />],
  ['/resident/reports', <ResidentReports />],
  ['/community/schedule', <ResidentSchedules />],
  ['/resident/schedule', <ResidentSchedules />],
  ['/community/announcements', <ResidentAnnouncements />],
  ['/resident/announcements', <ResidentAnnouncements />],
  ['/community/notifications', <ResidentNotifications />],
  ['/resident/notifications', <ResidentNotifications />],
  ['/community/feedback', <ResidentFeedback />],
  ['/resident/feedback', <ResidentFeedback />],

  // Staff
  ['/staff/jobs', <StaffJobs />],
  ['/staff/map', <StaffMap />],
  ['/staff/notifications', <StaffNotifications />],
  ['/staff/profile', <StaffProfile />],

  // Admin
  ['/admin/profile', <AdminProfile />],
  ['/admin/analytics', <AdminAnalytics />],
  ['/admin/audit-logs', <AdminAuditLogs />],
  ['/admin/notifications', <AdminNotifications />],
  ['/admin/settings', <AdminSettings />],
  ['/admin/users', <AdminUsers />],
  ['/admin/residents', <AdminResidents />],
  ['/admin/schedules', <AdminSchedules />],
  ['/admin/announcements', <AdminAnnouncements />],
  ['/admin/barangay', <AdminBarangay />],
  ['/admin/barangays', <AdminBarangay />],
  ['/admin/map', <AdminMap />],
  ['/admin/reports', <AdminReports />],
])

// What each section renders when no exact page matches (portal home).
const sectionHome = {
  community: <ResidentHome />,
  staff: <StaffHome />,
  admin: <AdminDashboard />,
}

// Resident report detail pages (one reference per path segment).
const reportDetailPattern = /^\/(?:community|resident)\/reports\/([^/]+)$/

// Pick the page element for a path: exact match, report detail, portal home,
// or the public landing page.
export const resolvePage = (pathname, section) => {
  const page = pageRoutes.get(pathname)
  if (page) return page

  const reportDetailMatch = pathname.match(reportDetailPattern)
  if (reportDetailMatch) {
    return <ResidentReportDetail reportId={decodeURIComponent(reportDetailMatch[1])} />
  }

  return sectionHome[section] ?? <LandingPage />
}
