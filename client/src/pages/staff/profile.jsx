import {
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  History,
  Lock,
  LogOut,
  MapPin,
  Phone,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { loadAssignedReports } from '../../lib/reports'
import { supabase } from '../../lib/supabase'
import { StaffNotificationsButton } from '../../components/staff/notificationsModal'

const STAFF_PREF_DEFAULTS = {
  onDuty: true,
  shareLocation: true,
  newAssignments: true,
  dispatchUpdates: true,
}

const initialsOf = (name) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST'

export default function StaffProfile() {
  const [userId, setUserId] = useState(null)
  const [staff, setStaff] = useState({
    name: '',
    role: '',
    staffId: '',
    phone: '',
    email: '',
  })
  const [prefs, setPrefs] = useState(STAFF_PREF_DEFAULTS)
  const [savedPrefs, setSavedPrefs] = useState({})
  const [reports, setReports] = useState([])

  // Load the real profile row from public.users (auth metadata as fallback)
  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user
      if (!user || !active) return
      const meta = user.user_metadata || {}
      setUserId(user.id)

      const { data: row } = await supabase
        .from('users')
        .select('full_name, id_number, position, contact_number, email, notification_preferences')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      setStaff({
        name: row?.full_name || meta.full_name || user.email?.split('@')[0] || '',
        role: row?.position || meta.position || 'Field staff',
        staffId: row?.id_number || meta.id_number ? `Staff ID ${row?.id_number || meta.id_number}` : '',
        phone: row?.contact_number || meta.contact_number || '',
        email: row?.email || user.email || '',
      })
      const stored = row?.notification_preferences || {}
      setSavedPrefs(stored)
      setPrefs({ ...STAFF_PREF_DEFAULTS, ...(stored.staff || {}) })
    })

    loadAssignedReports()
      .then((rows) => {
        if (active) setReports(rows)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const history = useMemo(() => {
    const done = reports.filter((r) => r.tone === 'resolved')
    return {
      completed: done.length,
      active: reports.filter((r) => r.tone !== 'resolved').length,
      recent: done.slice(0, 3),
    }
  }, [reports])

  const onDuty = prefs.onDuty
  const shareLocation = prefs.shareLocation
  const newAssignments = prefs.newAssignments
  const dispatchUpdates = prefs.dispatchUpdates

  const updatePref = async (key, value, message) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    showToast(message)
    if (!supabase || !userId) return
    const merged = { ...savedPrefs, staff: next }
    const { error } = await supabase.from('users').update({ notification_preferences: merged }).eq('id', userId)
    if (error) {
      showToast('Saved on this device only — could not sync settings.')
      return
    }
    setSavedPrefs(merged)
  }

  const setOnDuty = (v) => updatePref('onDuty', v, v ? 'Marked ON DUTY' : 'Marked OFF DUTY')
  const setShareLocation = (v) => updatePref('shareLocation', v, v ? 'Location sharing active' : 'Location sharing paused')
  const setNewAssignments = (v) => updatePref('newAssignments', v, v ? 'New assignment alerts on' : 'New assignment alerts off')
  const setDispatchUpdates = (v) => updatePref('dispatchUpdates', v, v ? 'Dispatch updates on' : 'Dispatch updates off')

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showSignoutModal, setShowSignoutModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast('Passwords do not match')
      return
    }
    if (passwordForm.newPass.length < 8) {
      showToast('Password must be at least 8 characters')
      return
    }
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
      if (error) {
        showToast('Failed to change password: ' + error.message)
        return
      }
    }
    setPasswordForm({ current: '', newPass: '', confirm: '' })
    setShowPasswordModal(false)
    showToast('Password changed successfully')
  }

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy flex flex-col justify-between">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-brand-yellow" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {/* Logo & Portal Branding */}
          <a href="/staff" className="flex items-center gap-2.5 no-underline">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-ink shadow-xs">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-brand-muted">
                STAFF PORTAL
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-brand-navy">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <StaffNotificationsButton assignedReports={reports} />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Title */}
        <h1 className="text-3xl font-black tracking-tight text-brand-navy mb-5">Profile</h1>

        {/* STAFF IDENTITY CARD */}
        <section
          className="rounded-3xl border border-brand-line bg-white p-4 shadow-[0_4px_20px_rgba(23,43,104,0.04)] flex items-center gap-4"
          aria-label="Staff identity card"
        >
          {/* Avatar Circle with Yellow Accent Ring */}
          <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-blue ring-[3.5px] ring-brand-yellow shadow-sm">
            <span className="text-lg font-black text-white tracking-wider">{initialsOf(staff.name)}</span>
          </div>

          {/* Staff Meta */}
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-brand-navy leading-tight truncate">
              {staff.name}
            </h2>
            <p className="text-xs text-brand-muted font-medium truncate mt-0.5">{staff.role}</p>
            <p className="text-xs text-brand-muted font-medium truncate">{staff.staffId}</p>
            {staff.email && <p className="text-xs text-brand-muted font-medium truncate">{staff.email}</p>}
            {staff.phone && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted font-medium truncate">
                <Phone className="size-3" /> {staff.phone}
              </p>
            )}
          </div>
        </section>

        {/* WORK HISTORY SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Work History
          </h2>
          <div className="rounded-2xl border border-brand-line bg-white p-3.5 shadow-[0_4px_20px_rgba(23,43,104,0.04)]">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-brand-paper p-3">
                <span className="block text-[10px] font-bold uppercase text-brand-muted">Completed</span>
                <span className="text-xl font-black text-brand-navy">{history.completed}</span>
              </div>
              <div className="rounded-xl bg-brand-paper p-3">
                <span className="block text-[10px] font-bold uppercase text-brand-muted">Active</span>
                <span className="text-xl font-black text-brand-navy">{history.active}</span>
              </div>
            </div>
            {history.recent.length > 0 && (
              <ul className="mt-3 divide-y divide-brand-paper">
                {history.recent.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-brand-navy">{job.outageType}</p>
                      <p className="truncate text-[11px] text-brand-muted">
                        {job.id} · Brgy. {job.barangay}
                        {job.resolvedAt ? ` · ${new Date(job.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                      </p>
                    </div>
                    <Check className="size-4 shrink-0 text-emerald-500" />
                  </li>
                ))}
              </ul>
            )}
            <a
              href="/staff/jobs"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-brand-line py-2 text-xs font-bold text-brand-blue no-underline hover:bg-brand-paper"
            >
              <History className="size-3.5" /> View all completed jobs
            </a>
          </div>
        </section>

        {/* DUTY AND LOCATION SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Duty and Location
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-brand-paper">
            {/* On duty */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Zap className="size-4.5 fill-current" />
                </span>
                <span className="text-sm font-bold text-brand-navy">On duty</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={onDuty}
                onClick={() => setOnDuty(!onDuty)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  onDuty ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    onDuty ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Share live location */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <MapPin className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Share live location</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={shareLocation}
                onClick={() => setShareLocation(!shareLocation)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  shareLocation ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    shareLocation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Notifications
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-brand-paper">
            {/* New assignments */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <ClipboardList className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">New assignments</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={newAssignments}
                onClick={() => setNewAssignments(!newAssignments)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  newAssignments ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    newAssignments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Dispatch updates */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Bell className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Dispatch updates</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dispatchUpdates}
                onClick={() => setDispatchUpdates(!dispatchUpdates)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dispatchUpdates ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    dispatchUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ACCOUNT SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Account
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)]">
            <button
              type="button"
              onClick={() => {
                setPasswordForm({ current: '', newPass: '', confirm: '' })
                setShowPasswordModal(true)
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-brand-paper cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Lock className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Change password</span>
              </div>
              <ChevronRight className="size-4 text-brand-muted" />
            </button>
          </div>
        </section>

        {/* SIGN OUT BUTTON */}
        <button
          type="button"
          onClick={() => setShowSignoutModal(true)}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#ffccd2] bg-white text-sm font-bold text-[#d92d20] shadow-[0_2px_8px_rgba(217,45,32,0.04)] transition-all hover:bg-[#fff5f5] hover:border-[#fda29b] active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="size-4.5" />
          <span>Sign out</span>
        </button>
      </main>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h3 className="text-base font-bold text-brand-navy">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Current password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">New password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1">Confirm new password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-muted hover:bg-brand-paper cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-blue py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-navy cursor-pointer"
                >
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showSignoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="space-y-4">
              <h3 className="text-base font-bold text-brand-navy">Sign Out</h3>
              <p className="text-sm text-brand-muted">
                Are you sure you want to sign out of your field workspace? Your live dispatch location will be paused.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignoutModal(false)}
                  className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-muted hover:bg-brand-paper cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 cursor-pointer"
                >
                  Yes, sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="staff" />
    </div>
  )
}

