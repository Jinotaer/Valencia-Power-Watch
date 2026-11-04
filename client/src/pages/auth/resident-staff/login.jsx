import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, Zap } from 'lucide-react'
import { useState } from 'react'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'
import { supabase } from '../../../lib/supabase'

const portalConfig = {
  resident: {
    title: 'Resident Login',
    description: 'Sign in to report outages and follow your updates',
    destination: '/community',
    accountPrompt: 'New to PowerWatch?',
    accountLink: 'Register from the Community Portal.',
    registerPath: null,
  },
  staff: {
    title: 'Staff Login',
    description: 'Sign in to manage assigned field response work',
    destination: '/staff',
    accountPrompt: 'Need access?',
    accountLink: 'Contact your system administrator',
    registerPath: null,
  },
}

function PortalLogin({ role = 'resident' }) {
  const config = portalConfig[role]
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.email.trim() || !form.password) {
      setStatus({ type: 'error', message: 'Enter your email and password to continue.' })
      return
    }

    setLoading(true)
    setStatus({ type: '', message: '' })
    if (!supabase) {
      setLoading(false)
      setStatus({ type: 'error', message: 'Authentication is not configured in this environment.' })
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', message: error.message || 'We could not sign you in. Check your credentials and try again.' })
      return
    }
    window.location.assign(config.destination)
  }

  return (
    <PortalAuthLayout>
      <div className="w-full rounded-lg border border-[#e1e6f4] bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:rounded-xl sm:p-8 md:p-10">
        <div className="mb-5 flex items-center justify-center gap-2.5 select-none sm:mb-6">
          <span className="grid size-8 place-items-center rounded-xl bg-[#ffdc00] text-[#101b4f] sm:size-9">
            <Zap className="size-4.5 fill-current sm:size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-[#101b4f] sm:text-xl">PowerWatch</span>
        </div>

        <div className="mb-6 text-center sm:mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#101b4f] sm:text-3xl">{config.title}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">{config.description}</p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 select-none" htmlFor={`${role}-email`}>EMAIL</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="h-11 w-full rounded-xl border border-[#d8dff1] bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#24449a] focus:outline-none focus:ring-2 focus:ring-[#24449a]/20 sm:h-12" id={`${role}-email`} name="email" type="email" autoComplete="email" placeholder="Enter your email" value={form.email} onChange={updateField} aria-invalid={status.type === 'error'} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 select-none" htmlFor={`${role}-password`}>PASSWORD</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="h-11 w-full rounded-xl border border-[#d8dff1] bg-white pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#24449a] focus:outline-none focus:ring-2 focus:ring-[#24449a]/20 sm:h-12" id={`${role}-password`} name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={updateField} aria-invalid={status.type === 'error'} />
              <button className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24449a]" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {status.message && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">{status.message}</div>}

          <div className="flex justify-end pt-0.5">
            <a href={`/${role === 'resident' ? 'community' : 'staff'}/forgot-password`} className="text-xs font-semibold text-[#24449a] transition-colors hover:text-[#172b68] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24449a]">Forgot password?</a>
          </div>

          <div className="pt-2">
            <button className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#24449a] text-sm font-semibold text-white transition-all hover:bg-[#1a3375] active:bg-[#122452] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12" type="submit" disabled={loading}>
              {loading ? <><LoaderCircle className="size-4 animate-spin" /><span>Signing in...</span></> : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </div>

          <p className="pt-2 text-center text-xs text-slate-500 sm:pt-3">
            {config.accountPrompt} <span>{config.accountLink}</span>
          </p>
        </form>
      </div>
    </PortalAuthLayout>
  )
}

export function ResidentLogin() {
  return <PortalLogin role="resident" />
}

export function StaffLogin() {
  return <PortalLogin role="staff" />
}
