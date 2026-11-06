import { Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import LandingPage from './pages/landingPage'
import AdminLogin from './pages/auth/admin/login'
import AdminForgotPassword from './pages/auth/admin/forgotPassword'
import AdminResetPassword from './pages/auth/admin/resetPassword'
import AdminDashboard from './pages/admin/dashboard'
import AdminUsers from './pages/admin/users'
import AdminSchedules from './pages/admin/schedules'
import AdminBarangay from './pages/admin/barangay'
import AdminMap from './pages/admin/map'
import AdminReports from './pages/admin/reports'
import { ResidentLogin, StaffLogin } from './pages/auth/resident-staff/login'
import PortalForgotPassword from './pages/auth/resident-staff/forgotPassword'
import { ResidentResetPassword, StaffResetPassword } from './pages/auth/resident-staff/resetPassword'
import ResidentRegister from './pages/auth/resident-staff/register'
import RoleSelect from './pages/auth/resident-staff/roleSelect'
import ResidentHome from './pages/resident/home'
import ResidentSchedules from './pages/resident/schedule'
import ResidentReports from './pages/resident/reports'
import ResidentReportDetail from './pages/resident/reportDetail'
import ResidentProfile from './pages/resident/profile'
import ResidentMap from './pages/resident/map'
import SubmitReport from './pages/resident/submitReport'
import StaffHome from './pages/staff/home'
import StaffJobs from './pages/staff/jobs'
import StaffMap from './pages/staff/map'
import StaffProfile from './pages/staff/profile'
import { supabase } from './lib/supabase'

const privateRoutes = ['/admin', '/staff', '/community', '/resident']

const authRoutes = [
  '/admin/login',
  '/community/login',
  '/staff/login',
  '/community/register',
  '/community/forgot-password',
  '/staff/forgot-password',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/community/reset-password',
  '/staff/reset-password',
]

// Users arriving from a password-recovery email hold a temporary session.
// They must be allowed to stay on these pages to set a new password.
const resetRoutes = ['/admin/reset-password', '/community/reset-password', '/staff/reset-password']

// Strip trailing slashes so "/admin/login/" behaves like "/admin/login".
const normalizePath = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

// Exact match or a true sub-path ("/admin" matches "/admin/users", not "/administrator").
const matches = (path, route) => path === route || path.startsWith(`${route}/`)
const matchesAny = (path, routes) => routes.some((route) => matches(path, route))

const getSection = (path) => {
  if (matches(path, '/admin')) return 'admin'
  if (matches(path, '/staff')) return 'staff'
  if (matches(path, '/community') || matches(path, '/resident')) return 'community'
  return null
}

const sectionLogin = { admin: '/admin/login', staff: '/staff/login', community: '/community/login' }

function getUserRole(session) {
  if (!session?.user) return null
  const metaRole = session.user.user_metadata?.role || session.user.app_metadata?.role
  if (metaRole) return metaRole
  if (session.user.email?.startsWith('admin@') || session.user.email?.includes('admin')) {
    return 'admin'
  }
  return 'resident'
}

function portalForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/community'
}

function isAllowedSection(section, role) {
  if (section === 'admin') return role === 'admin'
  if (section === 'staff') return role === 'staff'
  if (section === 'community') return role === 'resident'
  return true
}

function App() {
  const pathname = normalizePath(window.location.pathname)
  const section = getSection(pathname)
  const isAuthRoute = matchesAny(pathname, authRoutes)
  const isResetRoute = matchesAny(pathname, resetRoutes)
  const isPrivateRoute = matchesAny(pathname, privateRoutes) && !isAuthRoute

  const [session, setSession] = useState(null)
  // If Supabase isn't configured there is nothing to wait for.
  const [authChecked, setAuthChecked] = useState(!supabase)

  // Page title, robots meta and PWA manifest
  useEffect(() => {
    document.title = section
      ? 'Valencia PowerWatch portal'
      : 'Power Outage Report Valencia City | Valencia PowerWatch'

    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = section ? 'noindex, nofollow' : 'index, follow'

    document.querySelector('link[rel="manifest"]')?.remove()
    const manifestPath =
      section === 'community'
        ? '/community-manifest.webmanifest'
        : section === 'staff'
          ? '/staff-manifest.webmanifest'
          : null
    if (manifestPath) {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = manifestPath
      document.head.appendChild(link)
    }
  }, [section])

  // Load the session and keep it in sync
  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthChecked(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthChecked(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  // Redirect rules
  useEffect(() => {
    if (!authChecked || !section) return

    const role = getUserRole(session)

    if (isAuthRoute) {
      if (isResetRoute) {
        // Users resetting password stay on reset page
        return
      }
      if (session) {
        const destination = portalForRole(role)
        window.location.replace(destination)
      }
      return
    }

    if (isPrivateRoute) {
      if (!session) {
        window.location.replace(sectionLogin[section])
      } else if (!isAllowedSection(section, role)) {
        window.location.replace(portalForRole(role))
      }
    }
  }, [session, authChecked, section, isAuthRoute, isResetRoute, isPrivateRoute])

  // Show loading screen while checking authentication
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-yellow text-brand-navy">
            <Zap className="size-5 fill-current animate-pulse" />
          </span>
          <span className="text-sm font-medium text-brand-muted">Loading PowerWatch...</span>
        </div>
      </div>
    )
  }

  // Don't render protected pages until we know the user is signed in and allowed
  if (isPrivateRoute && (!session || !isAllowedSection(section, getUserRole(session)))) return null
  // Don't flash the login form for a signed-in user who is about to be redirected
  if (isAuthRoute && !isResetRoute && session) return null

  // Role picker (public): sends people to the resident or staff login
  if (pathname === '/login') return <RoleSelect />

  // Auth pages
  if (pathname === '/admin/login') return <AdminLogin />
  if (pathname === '/community/login') return <ResidentLogin />
  if (pathname === '/community/register') return <ResidentRegister />
  if (pathname === '/staff/login') return <StaffLogin />
  if (pathname === '/community/forgot-password') return <PortalForgotPassword role="resident" />
  if (pathname === '/staff/forgot-password') return <PortalForgotPassword role="staff" />
  if (pathname === '/admin/forgot-password') return <AdminForgotPassword />
  if (pathname === '/admin/reset-password') return <AdminResetPassword />
  if (pathname === '/community/reset-password') return <ResidentResetPassword />
  if (pathname === '/staff/reset-password') return <StaffResetPassword />

  // Resident
  if (pathname === '/community/profile' || pathname === '/resident/profile') return <ResidentProfile />
  if (pathname === '/community/map' || pathname === '/resident/map') return <ResidentMap />
  if (
    pathname === '/community/reports/new' ||
    pathname === '/resident/reports/new' ||
    pathname === '/community/submit-report'
  ) {
    return <SubmitReport />
  }
  if (pathname === '/community/reports' || pathname === '/resident/reports') return <ResidentReports />
  if (pathname === '/community/schedule' || pathname === '/resident/schedule') return <ResidentSchedules />
  const reportDetailMatch = pathname.match(/^\/(?:community|resident)\/reports\/([^/]+)$/)
  if (reportDetailMatch) return <ResidentReportDetail reportId={decodeURIComponent(reportDetailMatch[1])} />
  if (section === 'community') return <ResidentHome />

  // Staff
  if (pathname === '/staff/jobs') return <StaffJobs />
  if (pathname === '/staff/map') return <StaffMap />
  if (pathname === '/staff/profile') return <StaffProfile />
  if (section === 'staff') return <StaffHome />

  // Admin
  if (pathname === '/admin/users') return <AdminUsers />
  if (pathname === '/admin/schedules') return <AdminSchedules />
  if (pathname === '/admin/barangay' || pathname === '/admin/barangays') return <AdminBarangay />
  if (pathname === '/admin/map') return <AdminMap />
  if (pathname === '/admin/reports') return <AdminReports />
  if (section === 'admin') return <AdminDashboard />

  return <LandingPage />
}

export default App