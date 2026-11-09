import { useEffect, useState } from 'react'
import powerWatchLogo from '../assets/logo.svg'
import { supabase } from '../lib/supabase'
import {
  authRoutes,
  isAllowedSection,
  matchesAny,
  portalForRole,
  privateRoutes,
  resetRoutes,
  sectionLogin,
} from './routes'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper">
      <div className="flex flex-col items-center gap-3">
        <img src={powerWatchLogo} alt="Loading PowerWatch" className="size-11 rounded-2xl animate-pulse" />
        <span className="text-sm font-medium text-brand-muted">Loading PowerWatch...</span>
      </div>
    </div>
  )
}

/**
 * Handles authentication for every page:
 *  - loads the Supabase session and keeps it in sync
 *  - resolves the account's role from public.users (metadata as fallback)
 *  - redirects signed-out users to their section's login, and signed-in users
 *    away from login pages or sections their role can't access
 *  - renders `children` only when the user is allowed to see them
 */
function Guard({ pathname, section, children }) {
  const isAuthRoute = matchesAny(pathname, authRoutes)
  const isResetRoute = matchesAny(pathname, resetRoutes)
  const isPrivateRoute = matchesAny(pathname, privateRoutes) && !isAuthRoute

  const [session, setSession] = useState(null)
  // The signed-in account's role, resolved from public.users (metadata as
  // fallback), remembered with the user it belongs to.
  const [resolvedRole, setResolvedRole] = useState(null)
  // If Supabase isn't configured there is nothing to wait for.
  const [authChecked, setAuthChecked] = useState(!supabase)

  // Primitive values so effects don't re-run when Supabase hands us a new
  // (but equivalent) session object, e.g. on tab refocus or token refresh.
  const userId = session?.user?.id
  const metadataRole = session?.user?.user_metadata?.role

  // A different user signed in: wait for their own role instead of inheriting
  // the previous user's.
  const role = resolvedRole && resolvedRole.userId === userId ? resolvedRole.role : null
  const isActive = resolvedRole && resolvedRole.userId === userId ? resolvedRole.isActive !== false : true

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

  // Resolve the account's real role from public.users — SQL promotions (e.g.
  // making an admin) land there, not in auth metadata. Metadata is only the
  // fallback so gating still works before the schema exists.
  useEffect(() => {
    if (!supabase || !userId) return

    let active = true
    supabase
      .from('users')
      .select('role, is_active')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setResolvedRole({ userId, role: data?.role || metadataRole || 'resident', isActive: data?.is_active !== false })
      })
      .catch(() => {
        if (active) setResolvedRole({ userId, role: metadataRole || 'resident', isActive: true })
      })

    return () => {
      active = false
    }
  }, [userId, metadataRole])

  // Redirect rules (also run on section-less routes like /login, which
  // must not wait for a section to exist to bounce signed-in users home)
  useEffect(() => {
    if (!authChecked) return
    // A signed-in session still awaits its role lookup — hold redirects.
    if (session && !role) return

    if (!isActive) {
      supabase.auth.signOut().finally(() => {
        window.location.replace(sectionLogin[section] || '/login')
      })
      return
    }

    if (isAuthRoute) {
      // Users resetting their password stay on the reset page.
      if (isResetRoute) return
      if (session && role) window.location.replace(portalForRole(role))
      return
    }

    if (isPrivateRoute) {
      if (!session) {
        window.location.replace(sectionLogin[section])
      } else if (role && !isAllowedSection(section, role)) {
        window.location.replace(portalForRole(role))
      }
    }
  }, [session, role, authChecked, isActive, section, isAuthRoute, isResetRoute, isPrivateRoute])

  // Show loading screen while checking authentication or waiting for user role
  if (!authChecked || (session && !role)) return <LoadingScreen />

  // Don't render protected pages until we know the user is signed in and allowed
  if (isPrivateRoute && (!session || !role || !isActive || !isAllowedSection(section, role))) return null
  // Don't flash the login form for a signed-in user who is about to be redirected
  if (isAuthRoute && !isResetRoute && session) return null

  // Mobile PWA restriction temporarily disabled for laptop testing:
  // (Both resident and staff can access their portals on any device)

  return children
}

export default Guard
