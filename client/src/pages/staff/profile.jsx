import {
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  Lock,
  LogOut,
  MapPin,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'

export default function StaffProfile() {
  const staff = {
    name: 'Ramon Santos',
    role: 'Line Crew 2 · Field staff',
    staffId: 'Staff ID ST-0142',
    phone: '+63 917 234 5678',
    email: 'ramon.santos@valenciapower.gov.ph',
  }

  // Toggles matching the screenshot
  const [onDuty, setOnDuty] = useState(true)
  const [shareLocation, setShareLocation] = useState(true)
  const [newAssignments, setNewAssignments] = useState(true)
  const [dispatchUpdates, setDispatchUpdates] = useState(true)

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showSignoutModal, setShowSignoutModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSavePassword = (e) => {
    e.preventDefault()
    if (passwordForm.newPass !== passwordForm.confirm) {
      alert('Passwords do not match')
      return
    }
    setPasswordForm({ current: '', newPass: '', confirm: '' })
    setShowPasswordModal(false)
    showToast('Password changed successfully')
  }

  const handleSignOut = () => {
    window.location.href = '/staff/login'
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#172b68] flex flex-col justify-between">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-[#172b68] px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-[#ffd500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#e2eaf4] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {/* Logo & Portal Branding */}
          <a href="/staff" className="flex items-center gap-2.5 no-underline">
            <span className="grid size-9 place-items-center rounded-xl bg-[#ffd500] text-[#101114] shadow-xs">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-[#60748e]">
                STAFF PORTAL
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-[#172b68]">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-2xl border border-[#dbe4ef] bg-white text-[#172b68] shadow-xs transition-colors hover:bg-[#f4f7fb] cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-[#24449a]" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#ffd500] ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Title */}
        <h1 className="text-3xl font-black tracking-tight text-[#172b68] mb-5">Profile</h1>

        {/* STAFF IDENTITY CARD */}
        <section
          className="rounded-3xl border border-[#e2eaf4] bg-white p-4 shadow-[0_4px_20px_rgba(23,43,104,0.04)] flex items-center gap-4"
          aria-label="Staff identity card"
        >
          {/* Avatar Circle with Yellow Accent Ring */}
          <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-[#1b3d8f] ring-[3.5px] ring-[#ffd500] shadow-sm">
            <span className="text-lg font-black text-white tracking-wider">RS</span>
          </div>

          {/* Staff Meta */}
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#172b68] leading-tight truncate">
              {staff.name}
            </h2>
            <p className="text-xs text-[#58708a] font-medium truncate mt-0.5">{staff.role}</p>
            <p className="text-xs text-[#58708a] font-medium truncate">{staff.staffId}</p>
          </div>
        </section>

        {/* DUTY AND LOCATION SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#60748e]">
            Duty and Location
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-[#edf2f8]">
            {/* On duty */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <Zap className="size-4.5 fill-current" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">On duty</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={onDuty}
                onClick={() => {
                  const next = !onDuty
                  setOnDuty(next)
                  showToast(next ? 'Marked ON DUTY' : 'Marked OFF DUTY')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  onDuty ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
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
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <MapPin className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Share live location</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={shareLocation}
                onClick={() => {
                  const next = !shareLocation
                  setShareLocation(next)
                  showToast(next ? 'Location sharing active' : 'Location sharing paused')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  shareLocation ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
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
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#60748e]">
            Notifications
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-[#edf2f8]">
            {/* New assignments */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <ClipboardList className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">New assignments</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={newAssignments}
                onClick={() => {
                  const next = !newAssignments
                  setNewAssignments(next)
                  showToast(next ? 'New assignment alerts on' : 'New assignment alerts off')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  newAssignments ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
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
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <Bell className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Dispatch updates</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dispatchUpdates}
                onClick={() => {
                  const next = !dispatchUpdates
                  setDispatchUpdates(next)
                  showToast(next ? 'Dispatch updates on' : 'Dispatch updates off')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dispatchUpdates ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
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
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#60748e]">
            Account
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)]">
            <button
              type="button"
              onClick={() => {
                setPasswordForm({ current: '', newPass: '', confirm: '' })
                setShowPasswordModal(true)
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-[#f8fbff] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <Lock className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Change password</span>
              </div>
              <ChevronRight className="size-4 text-[#8a9fb7]" />
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
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#172b68]">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#24449a] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#24449a] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm new password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#24449a] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#1b3d8f] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#142e6d] cursor-pointer"
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
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#172b68]">Sign Out</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to sign out of your field workspace? Your live dispatch location will be paused.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignoutModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
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

