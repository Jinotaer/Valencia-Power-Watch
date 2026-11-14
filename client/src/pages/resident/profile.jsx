import {
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Languages,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Pencil,
  Send,
  UserRound,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import powerWatchLogo from '../../assets/logo.svg'
import ResidentProfileModals from '../../components/resident/profileModals'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { BellLink } from '../../components/layout/BellLink'
import { useLanguage, translate, languages } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '../../lib/notifications'

export default function ResidentProfile() {
  const { language, setLanguage, t } = useLanguage()
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

  // Notification preferences, persisted on the public.users row.
  const [prefs, setPrefs] = useState(defaultNotificationPreferences)

  useEffect(() => {
    let active = true
    loadNotificationPreferences()
      .then((saved) => {
        if (active) setPrefs(saved)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const togglePref = (key, label) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    saveNotificationPreferences(next)
      .then(() => showToast(next[key] ? t('{label} enabled', { label: t(label) }) : t('{label} disabled', { label: t(label) })))
      .catch(() => showToast(t('Could not save that setting. Try again.')))
  }

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
    let emailChanged = false

    if (supabase) {
      const { data } = await supabase.auth.getUser()
      const updates = {
        data: {
          full_name: personalForm.name,
          contact_number: personalForm.phone,
        },
      }
      const email = personalForm.email.trim()
      if (email && email !== data?.user?.email) {
        updates.email = email
        emailChanged = true
      }

      const { error } = await supabase.auth.updateUser(updates)
      if (error) {
        showToast(t('Failed to save: {message}', { message: error.message }))
        return
      }

      // Keep the public profile row in sync (RLS allows own-row edits).
      if (data?.user) {
        await supabase
          .from('users')
          .update({ full_name: personalForm.name, contact_number: personalForm.phone || null })
          .eq('id', data.user.id)
      }
    }

    setUser((prev) => ({
      ...prev,
      name: personalForm.name,
      email: emailChanged ? personalForm.email.trim() : prev.email,
      phone: personalForm.phone,
    }))
    setActiveModal(null)
    showToast(emailChanged ? t('Check your inbox to confirm the new email') : t('Personal information updated'))
  }

  const handleSaveBarangay = async (e) => {
    e.preventDefault()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      const { error } = await supabase.auth.updateUser({
        data: { barangay: selectedBarangay, address: selectedBarangay },
      })
      if (error) {
        showToast(t('Failed to save: {message}', { message: error.message }))
        return
      }
      if (data?.user) {
        await supabase
          .from('users')
          .update({ address: selectedBarangay })
          .eq('id', data.user.id)
      }
    }
    setUser((prev) => ({ ...prev, barangay: selectedBarangay }))
    setActiveModal(null)
    showToast(t('Home barangay updated to Brgy. {barangay}', { barangay: selectedBarangay }))
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast(t('Passwords do not match'))
      return
    }
    if (passwordForm.newPass.length < 8) {
      showToast(t('Password must be at least 8 characters'))
      return
    }
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
      if (error) {
        showToast(t('Failed to change password: {message}', { message: error.message }))
        return
      }
    }
    setPasswordForm({ current: '', newPass: '', confirm: '' })
    setActiveModal(null)
    showToast(t('Password changed successfully'))
  }

  const handleSelectLanguage = (code, label) => {
    setLanguage(code)
    setActiveModal(null)
    showToast(translate(code, 'Language updated to {language}', { language: label }))
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
          <a href="/community" className="flex items-center gap-2.5 no-underline">
            <img src={powerWatchLogo} alt="" className="size-9 shrink-0 rounded-xl shadow-xs" aria-hidden="true" />
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-brand-muted">
                {t('Community portal')}
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-brand-navy">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <BellLink />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Title */}
        <h1 className="text-3xl font-black tracking-tight text-brand-navy mb-5">{t('Profile')}</h1>

        {/* USER PROFILE CARD */}
        <section
          className="rounded-3xl border border-brand-line bg-white p-4 shadow-[0_4px_20px_rgba(23,43,104,0.04)] flex items-center justify-between"
          aria-label={t('User profile card')}
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
            aria-label={t('Edit profile')}
          >
            <Pencil className="size-4.5" />
          </button>
        </section>

        {/* ACCOUNT SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            {t('Account')}
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
                <span className="text-sm font-bold text-brand-navy">{t('Personal information')}</span>
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
                <span className="text-sm font-bold text-brand-navy">{t('Home barangay')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-brand-muted">{user.barangay}</span>
                <ChevronRight className="size-4 text-brand-muted" />
              </div>
            </button>

            {/* Language */}
            <button
              type="button"
              onClick={() => setActiveModal('language')}
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-brand-paper cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Languages className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">{t('Language')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-brand-muted">{languages.find((item) => item.code === language)?.label}</span>
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
                <span className="text-sm font-bold text-brand-navy">{t('Change password')}</span>
              </div>
              <ChevronRight className="size-4 text-brand-muted" />
            </button>
          </div>
        </section>

        {/* NOTIFICATIONS SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            {t('Notifications')}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-brand-paper">
            {/* Outage Alerts Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Zap className="size-4.5 fill-current" />
                </span>
                <span className="text-sm font-bold text-brand-navy">{t('Outage alerts')}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.outageAlerts}
                onClick={() => togglePref('outageAlerts', 'Outage alerts')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prefs.outageAlerts ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    prefs.outageAlerts ? 'translate-x-5' : 'translate-x-0'
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
                <span className="text-sm font-bold text-brand-navy">{t('Report status updates')}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.reportStatusUpdates}
                onClick={() => togglePref('reportStatusUpdates', 'Report status updates')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prefs.reportStatusUpdates ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    prefs.reportStatusUpdates ? 'translate-x-5' : 'translate-x-0'
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
                <span className="text-sm font-bold text-brand-navy">{t('Scheduled outage reminders')}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.scheduledReminders}
                onClick={() => togglePref('scheduledReminders', 'Scheduled outage reminders')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prefs.scheduledReminders ? 'bg-brand-blue' : 'bg-brand-line'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    prefs.scheduledReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* COMMUNITY SECTION */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
            {t('Community')}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-[0_4px_20px_rgba(23,43,104,0.04)] divide-y divide-brand-paper">
            <a
              href="/community/announcements"
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-brand-paper no-underline"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Megaphone className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">{t('Advisories')}</span>
              </div>
              <ChevronRight className="size-4 text-brand-muted" />
            </a>

            <a
              href="/community/feedback"
              className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-brand-paper no-underline"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Send className="size-4.5" />
                </span>
                <span className="text-sm font-bold text-brand-navy">{t('Send feedback')}</span>
              </div>
              <ChevronRight className="size-4 text-brand-muted" />
            </a>
          </div>
        </section>

        {/* SIGN OUT BUTTON */}
        <button
          type="button"
          onClick={() => setActiveModal('signout')}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#ffccd2] bg-white text-sm font-bold text-[#d92d20] shadow-[0_2px_8px_rgba(217,45,32,0.04)] transition-all hover:bg-[#fff5f5] hover:border-[#fda29b] active:scale-[0.99] cursor-pointer"
        >
          <LogOut className="size-4.5" />
          <span>{t('Sign out')}</span>
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
        onSelectLanguage={handleSelectLanguage}
      />

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="resident" />
    </div>
  )
}

