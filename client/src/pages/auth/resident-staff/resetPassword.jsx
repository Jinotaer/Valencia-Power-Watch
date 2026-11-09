import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, Lock } from 'lucide-react'
import { useState } from 'react'
import powerWatchLogo from '../../../assets/logo.svg'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'

function PortalResetPassword({ role = 'resident' }) {
  const isResident = role === 'resident'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const loginPath = '/login'

  async function handleSubmit(event) {
    event.preventDefault()
    if (!password) {
      setStatus({ type: 'error', message: 'Enter a new password.' })
      return
    }
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' })
      return
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    setStatus({ type: '', message: '' })
    if (!supabase) {
      setLoading(false)
      setStatus({ type: 'error', message: 'Authentication is not configured in this environment.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: error.message || 'We could not reset your password. Please try again.' })
      return
    }

    setSuccess(true)
  }

  return (
    <PortalAuthLayout>
      <div className="w-full rounded-lg border border-brand-line bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:rounded-xl sm:p-8 md:p-10">
        <div className="mb-5 flex items-center justify-center gap-2.5 sm:mb-6 select-none">
          <img src={powerWatchLogo} alt="Valencia PowerWatch" className="size-8 sm:size-9 rounded-xl object-contain" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-brand-navy">PowerWatch</span>
        </div>

        {success ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-emerald-500" />
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Password updated</h1>
            <p className="mt-2 text-xs leading-relaxed text-brand-muted sm:text-sm">Your password has been reset. You can now sign in.</p>
            <a
              href={loginPath}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white no-underline hover:bg-brand-navy transition-colors"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center sm:mb-7">
              <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Reset password</h1>
              <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
                {isResident ? 'Enter a new password for your resident account' : 'Enter a new password for your staff account'}
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none" htmlFor={`${role}-reset-password`}>
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
                  <Input
                    className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                    id={`${role}-reset-password`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue z-10"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none" htmlFor={`${role}-reset-confirm`}>
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
                  <Input
                    className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                    id={`${role}-reset-confirm`}
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue z-10"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {status.message && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                  {status.message}
                </div>
              )}

              <div className="pt-1">
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-blue text-xs font-semibold text-white transition-colors hover:bg-brand-blue"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      <span>Reset password</span>
                    </>
                  ) : (
                    <span>Reset password</span>
                  )}
                </button>
              </div>

              <a href={loginPath} className="mt-5 flex items-center justify-center gap-1 text-[10px] font-semibold text-brand-blue hover:underline">
                <ArrowLeft className="size-3" /> Back to sign in
              </a>
            </form>
          </>
        )}
      </div>
    </PortalAuthLayout>
  )
}

export default PortalResetPassword

export function ResidentResetPassword() {
  return <PortalResetPassword role="resident" />
}

export function StaffResetPassword() {
  return <PortalResetPassword role="staff" />
}
