import {
  Bell,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'

const valenciaBarangays = [
  'Guinoyuran',
  'Poblacion',
  'Bagontapay',
  'Bantuanon',
  'Barobo',
  'Batangan',
  'Catumbalon',
  'Colonia',
  'Concepcion',
  'Dagat-Kidavao',
  'Dampas',
  'Datu Salumay',
  'Kahaponan',
  'Laligan',
  'Lilingayon',
  'Lourdes',
  'Lumbayao',
  'Lumbo',
  'Lurugan',
  'Mabuhay',
  'Mailag',
  'Mt. Nebo',
  'Musuan',
  'Pinatilan',
  'San Carlos',
  'San Isidro',
  'Sinayawan',
  'Sugod',
  'Tongantongan',
  'Tugaya',
  'Vintar',
]

export default function ResidentProfile() {
  const [user, setUser] = useState({
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    barangay: 'Guinuyoran',
    phone: '+63 917 123 4567',
  })

  // Notification toggle states matching reference image
  const [outageAlerts, setOutageAlerts] = useState(true)
  const [reportStatusUpdates, setReportStatusUpdates] = useState(true)
  const [scheduledOutageReminders, setScheduledOutageReminders] = useState(false)

  // Interactive Modals
  const [activeModal, setActiveModal] = useState(null) // 'personal' | 'barangay' | 'password' | 'signout'
  const [personalForm, setPersonalForm] = useState({ name: user.name, email: user.email, phone: user.phone })
  const [selectedBarangay, setSelectedBarangay] = useState(user.barangay)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSavePersonal = (e) => {
    e.preventDefault()
    setUser((prev) => ({
      ...prev,
      name: personalForm.name,
      email: personalForm.email,
      phone: personalForm.phone,
    }))
    setActiveModal(null)
    showToast('Personal information updated')
  }

  const handleSaveBarangay = (e) => {
    e.preventDefault()
    setUser((prev) => ({ ...prev, barangay: selectedBarangay }))
    setActiveModal(null)
    showToast(`Home barangay updated to Brgy. ${selectedBarangay}`)
  }

  const handleSavePassword = (e) => {
    e.preventDefault()
    if (passwordForm.newPass !== passwordForm.confirm) {
      alert('Passwords do not match')
      return
    }
    setPasswordForm({ current: '', newPass: '', confirm: '' })
    setActiveModal(null)
    showToast('Password changed successfully')
  }

  const handleSignOut = () => {
    window.location.href = '/community/login'
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
          <a href="/community" className="flex items-center gap-2.5 no-underline">
            <span className="grid size-9 place-items-center rounded-xl bg-[#ffd500] text-[#101114] shadow-xs">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-[#60748e]">
                COMMUNITY PORTAL
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-[#172b68]">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-2xl border border-[#dbe4ef] bg-white text-[#172b68] shadow-xs transition-colors hover:bg-[#f4f7fb]"
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

        {/* USER PROFILE CARD */}
        <section
          className="rounded-3xl border border-[#e2eaf4] bg-white p-4 shadow-[0_4px_20px_rgba(23,43,104,0.04)] flex items-center justify-between"
          aria-label="User profile card"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Circle with Yellow Ring */}
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-[#1b3d8f] ring-[3.5px] ring-[#ffd500] shadow-sm">
              <span className="text-lg font-black text-white tracking-wider">JD</span>
            </div>

            {/* User Meta Information */}
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[#172b68] leading-tight truncate">
                {user.name}
              </h2>
              <p className="text-xs text-[#58708a] font-medium truncate mt-0.5">{user.email}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#58708a]">
                <MapPin className="size-3 text-[#24449a] shrink-0" />
                <span className="truncate">Brgy. {user.barangay}</span>
              </div>
            </div>
          </div>

          {/* Quick Edit Pencil Button */}
          <button
            type="button"
            onClick={() => {
              setPersonalForm({ name: user.name, email: user.email, phone: user.phone })
              setActiveModal('personal')
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e5edff] text-[#24449a] transition-all hover:bg-[#d8e6ff] active:scale-95 cursor-pointer ml-2"
            aria-label="Edit profile"
          >
            <Pencil className="size-4.5" />
          </button>
        </section>

        {/* ACCOUNT SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#60748e]">
            Account
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-[#edf2f8]">
            {/* Personal Information */}
            <button
              type="button"
              onClick={() => {
                setPersonalForm({ name: user.name, email: user.email, phone: user.phone })
                setActiveModal('personal')
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-[#f8fbff] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <UserRound className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Personal information</span>
              </div>
              <ChevronRight className="size-4 text-[#8a9fb7]" />
            </button>

            {/* Home Barangay */}
            <button
              type="button"
              onClick={() => {
                setSelectedBarangay(user.barangay)
                setActiveModal('barangay')
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-[#f8fbff] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <MapPin className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Home barangay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#627b97]">{user.barangay}</span>
                <ChevronRight className="size-4 text-[#8a9fb7]" />
              </div>
            </button>

            {/* Change Password */}
            <button
              type="button"
              onClick={() => {
                setPasswordForm({ current: '', newPass: '', confirm: '' })
                setActiveModal('password')
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

        {/* NOTIFICATIONS SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#60748e]">
            Notifications
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-[#edf2f8]">
            {/* Outage Alerts Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <Zap className="size-4.5 fill-current" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Outage alerts</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={outageAlerts}
                onClick={() => {
                  const next = !outageAlerts
                  setOutageAlerts(next)
                  showToast(next ? 'Outage alerts enabled' : 'Outage alerts disabled')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  outageAlerts ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    outageAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Report Status Updates Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <ClipboardList className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Report status updates</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reportStatusUpdates}
                onClick={() => {
                  const next = !reportStatusUpdates
                  setReportStatusUpdates(next)
                  showToast(next ? 'Status updates enabled' : 'Status updates disabled')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reportStatusUpdates ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    reportStatusUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Scheduled Outage Reminders Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                  <Calendar className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-[#172b68]">Scheduled outage reminders</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={scheduledOutageReminders}
                onClick={() => {
                  const next = !scheduledOutageReminders
                  setScheduledOutageReminders(next)
                  showToast(next ? 'Scheduled reminders enabled' : 'Scheduled reminders disabled')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  scheduledOutageReminders ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    scheduledOutageReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* SIGN OUT BUTTON */}
        <button
          type="button"
          onClick={() => setActiveModal('signout')}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#ffccd2] bg-white text-sm font-bold text-[#d92d20] shadow-[0_2px_8px_rgba(217,45,32,0.04)] transition-all hover:bg-[#fff5f5] hover:border-[#fda29b] active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="size-4.5" />
          <span>Sign out</span>
        </button>
      </main>

      {/* INTERACTIVE MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#172b68]">
                {activeModal === 'personal' && 'Personal Information'}
                {activeModal === 'barangay' && 'Select Home Barangay'}
                {activeModal === 'password' && 'Change Password'}
                {activeModal === 'signout' && 'Sign Out Confirmation'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="pt-4">
              {activeModal === 'personal' && (
                <form onSubmit={handleSavePersonal} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      value={personalForm.name}
                      onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#24449a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={personalForm.email}
                      onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#24449a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact number</label>
                    <input
                      type="tel"
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-[#24449a] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#1b3d8f] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#142e6d]"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'barangay' && (
                <form onSubmit={handleSaveBarangay} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Choose your primary barangay in Valencia City to prioritize relevant power interruption advisories.
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {valenciaBarangays.map((brgy) => (
                      <label
                        key={brgy}
                        className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold cursor-pointer border transition-colors ${
                          selectedBarangay === brgy
                            ? 'border-[#24449a] bg-[#edf4ff] text-[#172b68]'
                            : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-[#24449a]" />
                          Brgy. {brgy}
                        </span>
                        <input
                          type="radio"
                          name="barangay"
                          checked={selectedBarangay === brgy}
                          onChange={() => setSelectedBarangay(brgy)}
                          className="text-[#24449a] accent-[#24449a]"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#1b3d8f] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#142e6d]"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'password' && (
                <form onSubmit={handleSavePassword} className="space-y-3.5">
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
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#1b3d8f] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#142e6d]"
                    >
                      Update password
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'signout' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Are you sure you want to sign out of the Valencia PowerWatch Community Portal?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="resident" />
    </div>
  )
}
