import { useEffect } from 'react'
import LandingPage from './pages/landingPage'
import AdminLogin from './pages/auth/admin/login'
import AdminForgotPassword from './pages/auth/admin/forgotPassword'
import AdminDashboard from './pages/admin/dashboard'
import AdminUsers from './pages/admin/users'
import AdminSchedules from './pages/admin/schedules'
import AdminBarangay from './pages/admin/barangay'
import AdminMap from './pages/admin/map'
import { ResidentLogin, StaffLogin } from './pages/auth/resident-staff/login'
import PortalForgotPassword from './pages/auth/resident-staff/forgotPassword'
import ResidentHome from './pages/resident/home'
import ResidentReports from './pages/resident/reports'
import ResidentProfile from './pages/resident/profile'
import ResidentMap from './pages/resident/map'
import SubmitReport from './pages/resident/submitReport'
import StaffHome from './pages/staff/home'
import StaffJobs from './pages/staff/jobs'
import StaffMap from './pages/staff/map'
import StaffProfile from './pages/staff/profile'

const privateRoutes = ['/admin', '/staff', '/community']

function App() {
  useEffect(() => {
    const isPrivateRoute = privateRoutes.some((route) => window.location.pathname.startsWith(route))
    document.title = isPrivateRoute
      ? 'Valencia PowerWatch portal'
      : 'Power Outage Report Valencia City | Valencia PowerWatch'

    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = isPrivateRoute ? 'noindex, nofollow' : 'index, follow'

    document.querySelector('link[rel="manifest"]')?.remove()
    const manifestPath = window.location.pathname.startsWith('/community')
      ? '/community-manifest.webmanifest'
      : window.location.pathname.startsWith('/staff')
        ? '/staff-manifest.webmanifest'
        : null
    if (manifestPath) {
      const manifest = document.createElement('link')
      manifest.rel = 'manifest'
      manifest.href = manifestPath
      document.head.appendChild(manifest)
    }
  }, [])

  if (window.location.pathname === '/admin/login') return <AdminLogin />
  if (window.location.pathname === '/community/login') return <ResidentLogin />
  if (window.location.pathname === '/staff/login') return <StaffLogin />
  if (window.location.pathname === '/community/forgot-password') return <PortalForgotPassword role="resident" />
  if (window.location.pathname === '/staff/forgot-password') return <PortalForgotPassword role="staff" />
  if (window.location.pathname === '/admin/forgot-password') return <AdminForgotPassword />
  if (window.location.pathname === '/community/profile' || window.location.pathname === '/resident/profile') return <ResidentProfile />
  if (window.location.pathname === '/community/map' || window.location.pathname === '/resident/map') return <ResidentMap />
  if (window.location.pathname === '/community/reports/new' || window.location.pathname === '/resident/reports/new' || window.location.pathname === '/community/submit-report') return <SubmitReport />
  if (window.location.pathname === '/community/reports') return <ResidentReports />
  if (window.location.pathname.startsWith('/community')) return <ResidentHome />
  if (window.location.pathname === '/staff/jobs') return <StaffJobs />
  if (window.location.pathname === '/staff/map') return <StaffMap />
  if (window.location.pathname === '/staff/profile') return <StaffProfile />
  if (window.location.pathname.startsWith('/staff')) return <StaffHome />
  if (window.location.pathname === '/admin/users') return <AdminUsers />
  if (window.location.pathname === '/admin/schedules') return <AdminSchedules />
  if (window.location.pathname === '/admin/barangay' || window.location.pathname === '/admin/barangays') return <AdminBarangay />
  if (window.location.pathname === '/admin/map') return <AdminMap />
  if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) return <AdminDashboard />
  return <LandingPage />
}

export default App
