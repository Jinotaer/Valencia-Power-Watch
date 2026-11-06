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
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import ResidentProfileModals from './profileModals'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { supabase } from '../../lib/supabase'

export default function ResidentProfile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    barangay: '',
    phone: '',
  })

  // Load the real user data from the Supabase session
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata || {}
        setUser({
          name: meta.full_name || data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          barangay: meta.barangay || meta.address || 'Not set',
          phone: meta.contact_number || '',
        })
      }
    })
  }, [])

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

  const handleSavePersonal = async (e) => {
    e.preventDefault()
    if (supabase) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: personalForm.name,
          contact_number: personalForm.phone,
        },
      })
      if (error) {
        showToast('Failed to save: ' + error.message)
        return
      }
    }
    setUser((prev) => ({
      ...prev,
      name: personalForm.name,
      phone: personalForm.phone,
    }))
    setActiveModal(null)
    showToast('Personal information updated')
  }

  const handleSaveBarangay = async (e) => {
    e.preventDefault()
    if (supabase) {
      const { error } = await supabase.auth.updateUser({
        data: { barangay: selectedBarangay, address: selectedBarangay },
      })
      if (error) {
        showToast('Failed to save: ' + error.message)
        return
      }
    }
    setUser((prev) => ({ ...prev, barangay: selectedBarangay }))
    setActiveModal(null)
    showToast(`Home barangay updated to Brgy. ${selectedBarangay}`)
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
    setActiveModal(null)
    showToast('Password changed successfully')
  }

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/community/login'
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
          <a href="/community" className="flex items-center gap-2.5 no-underline">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-ink shadow-xs">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-brand-muted">
                COMMUNITY PORTAL
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-brand-navy">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-2xl border border-brand-line bg-white text-brand-navy shadow-xs transition-colors hover:bg-brand-paper"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-brand-blue" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-brand-yellow ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Title */}
        <h1 className="text-3xl font-black tracking-tight text-brand-navy mb-5">Profile</h1>

        {/* USER PROFILE CARD */}
        <section
          className="rounded-3xl border border-brand-line bg-white p-4 shadow-[0_4px_20px_rgba(23,43,104,0.04)] flex items-center justify-between"
          aria-label="User profile card"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Circle with Yellow Ring */}
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-blue ring-[3.5px] ring-brand-yellow shadow-sm">
              <span className="text-lg font-black text-white tracking-wider">JD</span>
            </div>

            {/* User Meta Information */}
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-brand-navy leading-tight truncate">
                {user.name}
              </h2>
              <p className="text-xs text-brand-muted font-medium truncate mt-0.5">{user.email}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-muted">
                <MapPin className="size-3 text-brand-blue shrink-0" />
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
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[e5e9f6] text-brand-blue transition-all hover:bg-[e5e9f6] active:scale-95 cursor-pointer ml-2"
            aria-label="Edit profile"
          >
            <Pencil className="size-4.5" />
          </button>
        </section>

        {/* ACCOUNT SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Account
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-brand-paper">
            {/* Personal Information */}
            <button
              type="button"
              onClick={() => {
                setPersonalForm({ name: user.name, email: user.email, phone: user.phone })
                setActiveModal('personal')
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-brand-paper cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <UserRound className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Personal information</span>
              </div>
              <ChevronRight className="size-4 text-brand-muted" />
            </button>

            {/* Home Barangay */}
            <button
              type="button"
              onClick={() => {
                setSelectedBarangay(user.barangay)
                setActiveModal('barangay')
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-brand-paper cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <MapPin className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Home barangay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-brand-muted">{user.barangay}</span>
                <ChevronRight className="size-4 text-brand-muted" />
              </div>
            </button>

            {/* Change Password */}
            <button
              type="button"
              onClick={() => {
                setPasswordForm({ current: '', newPass: '', confirm: '' })
                setActiveModal('password')
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

        {/* NOTIFICATIONS SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Notifications
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-brand-paper">
            {/* Outage Alerts Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Zap className="size-4.5 fill-current" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Outage alerts</span>
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
                  outageAlerts ? 'bg-brand-blue' : 'bg-brand-line'
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
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <ClipboardList className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Report status updates</span>
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
                  reportStatusUpdates ? 'bg-brand-blue' : 'bg-brand-line'
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
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Calendar className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">Scheduled outage reminders</span>
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
                  scheduledOutageReminders ? 'bg-brand-blue' : 'bg-brand-line'
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
      <ResidentProfileModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        personalForm={personalForm}
        setPersonalForm={setPersonalForm}
        selectedBarangay={selectedBarangay}
        setSelectedBarangay={setSelectedBarangay}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        handleSavePersonal={handleSavePersonal}
        handleSaveBarangay={handleSaveBarangay}
        handleSavePassword={handleSavePassword}
        handleSignOut={handleSignOut}
      />

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="resident" />
    </div>
  )
}

