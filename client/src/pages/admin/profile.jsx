import { Check, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import { supabase } from '../../lib/supabase'

const emptyProfile = {
  name: '',
  email: '',
  role: '',
  isActive: true,
  contactNumber: '',
  address: '',
  idNumber: '',
  position: '',
}

export default function AdminProfile() {
  const [profile, setProfile] = useState(emptyProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [toast, setToast] = useState('')
  const [formError, setFormError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    let active = true

    async function load() {
      if (!supabase) {
        if (active) {
          setLoadError('Authentication is not configured in this environment.')
          setIsLoading(false)
        }
        return
      }

      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        const user = data.user
        const { data: row } = await supabase
          .from('users')
          .select('email, full_name, role, contact_number, address, id_number, position, is_active')
          .eq('id', user.id)
          .maybeSingle()

        if (!active) return
        setProfile({
          name: row?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: row?.email || user.email || '',
          role: row?.role || user.user_metadata?.role || 'admin',
          isActive: row?.is_active !== false,
          contactNumber: row?.contact_number || user.user_metadata?.contact_number || '',
          address: row?.address || user.user_metadata?.address || '',
          idNumber: row?.id_number || user.user_metadata?.id_number || '',
          position: row?.position || user.user_metadata?.position || '',
        })
      } catch {
        if (active) setLoadError('We could not load your admin profile. Try again.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    if (!supabase || isSaving) return

    setIsSaving(true)
    setFormError('')
    try {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      const metadata = {
        full_name: profile.name.trim(),
        contact_number: profile.contactNumber.trim() || null,
        address: profile.address.trim() || null,
        id_number: profile.idNumber.trim() || null,
        position: profile.position.trim() || null,
      }

      const { error } = await supabase.auth.updateUser({ data: metadata })
      if (error) throw error

      if (userId) {
        const { error: rowError } = await supabase
          .from('users')
          .update({
            full_name: metadata.full_name || null,
            contact_number: metadata.contact_number,
            address: metadata.address,
            id_number: metadata.id_number,
            position: metadata.position,
          })
          .eq('id', userId)
        if (rowError) throw rowError
      }

      showToast('Admin profile updated.')
    } catch (error) {
      setFormError(error.message || 'Could not save your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  async function changeEmail(event) {
    event.preventDefault()
    if (!supabase || isChangingEmail) return

    setIsChangingEmail(true)
    setFormError('')
    try {
      const email = profile.email.trim()
      if (!email) throw new Error('Enter an email address.')
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      showToast('Check your inbox to confirm the new email address.')
    } catch (error) {
      setFormError(error.message || 'Could not change your email.')
    } finally {
      setIsChangingEmail(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    if (!supabase || isChangingPassword) return
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setIsChangingPassword(true)
    setFormError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword('')
      setConfirmPassword('')
      showToast('Password changed successfully.')
    } catch (error) {
      setFormError(error.message || 'Could not change your password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/profile" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Administration" section="Admin profile" />

        {toast && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl">
            <Check className="size-4 text-brand-yellow" />
            <span>{toast}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl">
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-[-.03em] text-brand-navy">Admin profile</h1>
              <p className="mt-1 text-sm text-brand-muted">Manage your administrator details and account security.</p>
            </header>

            {isLoading ? (
              <p className="rounded-2xl border border-brand-line bg-white p-10 text-center text-sm font-semibold text-brand-muted">Loading profile…</p>
            ) : loadError ? (
              <div className="rounded-2xl border border-[#f3c7c3] bg-white p-10 text-center">
                <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-blue text-lg font-black text-white ring-4 ring-brand-yellow">
                      <UserRound className="size-7" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-brand-navy">{profile.name || 'Administrator'}</h2>
                      <p className="truncate text-sm text-brand-muted">{profile.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5e9f6] px-2.5 py-1 text-xs font-bold text-brand-blue">
                          <ShieldCheck className="size-3.5" />
                          {profile.role || 'admin'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${profile.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {profile.isActive ? 'Active' : 'Deactivated'}
                        </span>
                        {profile.position && <span className="rounded-full bg-brand-paper px-2.5 py-1 text-xs font-bold text-brand-muted">{profile.position}</span>}
                      </div>
                    </div>
                  </div>
                </section>

                {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[#b42318]">{formError}</p>}

                <form onSubmit={saveProfile} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-brand-navy">Profile details</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                      Full name
                      <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                      Contact number
                      <input value={profile.contactNumber} onChange={(event) => setProfile((current) => ({ ...current, contactNumber: event.target.value }))} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                      ID number
                      <input value={profile.idNumber} onChange={(event) => setProfile((current) => ({ ...current, idNumber: event.target.value }))} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                      Position
                      <input value={profile.position} onChange={(event) => setProfile((current) => ({ ...current, position: event.target.value }))} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-brand-muted sm:col-span-2">
                      Address
                      <input value={profile.address} onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    </label>
                  </div>
                  <button type="submit" disabled={isSaving} className="mt-5 h-10 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-60">
                    {isSaving ? 'Saving…' : 'Save profile'}
                  </button>
                </form>

                <section className="grid gap-5 md:grid-cols-2">
                  <form onSubmit={changeEmail} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold text-brand-navy">
                      <Mail className="size-4 text-brand-blue" />
                      Change email
                    </h2>
                    <input value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} type="email" className="mt-4 h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    <button type="submit" disabled={isChangingEmail} className="mt-4 h-10 rounded-lg bg-brand-navy px-4 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-60">
                      {isChangingEmail ? 'Updating…' : 'Update email'}
                    </button>
                  </form>

                  <form onSubmit={changePassword} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-bold text-brand-navy">
                      <Lock className="size-4 text-brand-blue" />
                      Change password
                    </h2>
                    <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="New password" className="mt-4 h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="Confirm password" className="mt-3 h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                    <button type="submit" disabled={isChangingPassword} className="mt-4 h-10 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-60">
                      {isChangingPassword ? 'Changing…' : 'Change password'}
                    </button>
                  </form>
                </section>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
