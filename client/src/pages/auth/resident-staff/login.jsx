import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, Zap } from 'lucide-react'
import { useState } from 'react'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'

// Staff and residents install the same PWA, so one login serves both:
// after sign-in every account is sent to its own portal.
const portalForRole = (role) => (role === 'staff' ? '/staff' : role === 'admin' ? '/admin' : '/community')

function PortalLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setStatus({ type: '', message: '' })
    setResendStatus('')
  }

  async function handleResendConfirmation() {
    if (!form.email.trim() || !supabase) return
    setResending(true)
    setResendStatus('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email.trim(),
    })
    setResending(false)
    if (error) {
      setResendStatus('Could not resend: ' + error.message)
    } else {
      setResendStatus('Confirmation email sent! Please check your inbox and spam folder.')
    }
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)
    if (error) {
      setStatus({ type: 'error', message: error.message || 'We could not sign you in. Check your credentials and try again.' })
      return
    }

    // Residents land in the community portal, staff in theirs, admins in the
    // console; section guards in App.jsx keep each portal role-exclusive.
    window.location.assign(portalForRole(data.user?.user_metadata?.role || data.user?.app_metadata?.role))
  }

  return (
    <PortalAuthLayout>
      <div className="w-full rounded-lg border border-brand-line bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:rounded-xl sm:p-8 md:p-10">
        <div className="mb-5 flex items-center justify-center gap-2.5 select-none sm:mb-6">
          <span className="grid size-8 place-items-center rounded-xl bg-brand-yellow text-brand-navy sm:size-9">
            <Zap className="size-4.5 fill-current sm:size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">PowerWatch</span>
        </div>

        <div className="mb-6 text-center sm:mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Sign in to PowerWatch</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
            Residents report interruptions — field staff manage their assigned response work
          </p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none" htmlFor="login-email">EMAIL</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <Input className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12" id="login-email" name="email" type="email" autoComplete="email" placeholder="Enter your email" value={form.email} onChange={updateField} aria-invalid={status.type === 'error'} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none" htmlFor="login-password">PASSWORD</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <Input className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12" id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={updateField} aria-invalid={status.type === 'error'} />
              <button className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue z-10" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {status.message && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1.5" role="alert">
              <div>{status.message}</div>
              {status.message.toLowerCase().includes('email not confirmed') && (
                <div className="pt-1 border-t border-red-200/60">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="font-bold underline text-brand-blue hover:text-brand-navy cursor-pointer"
                  >
                    {resending ? 'Sending email...' : 'Resend confirmation link'}
                  </button>
                  {resendStatus && (
                    <div className="mt-1 text-[11px] font-medium text-brand-ink">{resendStatus}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-0.5">
            <a href="/community/forgot-password" className="text-xs font-semibold text-brand-blue transition-colors hover:text-brand-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Forgot password?</a>
          </div>

          <div className="pt-2">
            <button className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-semibold text-white transition-all hover:bg-brand-navy active:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-70 sm:h-12" type="submit" disabled={loading}>
              {loading ? <><LoaderCircle className="size-4 animate-spin" /><span>Signing in...</span></> : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </div>

          <p className="pt-2 text-center text-xs text-brand-muted sm:pt-3">
            New to PowerWatch?{' '}
            <a
              href="/community/register"
              className="font-semibold text-brand-blue transition-colors hover:text-brand-navy hover:underline"
            >
              Create an account
            </a>
          </p>
        </form>
      </div>
    </PortalAuthLayout>
  )
}

export default PortalLogin
