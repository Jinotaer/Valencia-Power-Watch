import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, Lock } from 'lucide-react'
import { useState } from 'react'
import powerWatchLogo from '../../../assets/logo.svg'
import { AdminAuthLayout } from '../../../components/auth/AdminAuthLayout'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'

function AdminResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    <AdminAuthLayout>
      <div className="w-full rounded-lg sm:rounded-xl border border-brand-line bg-white p-6 sm:p-8 md:p-10">
        <div className="mb-5 sm:mb-6 flex items-center justify-center gap-2.5 sm:gap-2.5 select-none">
          <img src={powerWatchLogo} alt="Valencia PowerWatch" className="size-8 sm:size-9 rounded-xl object-contain" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-brand-navy">PowerWatch</span>
        </div>

        {success ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-emerald-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">Password updated</h1>
            <p className="mt-2 text-xs sm:text-sm text-brand-muted">Your password has been reset. You can now sign in.</p>
            <a
              href="/admin/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white no-underline hover:bg-brand-navy transition-colors"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-7 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">Reset password</h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-brand-muted">
                Enter a new password for your admin account
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none" htmlFor="admin-reset-password">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted pointer-events-none z-10" />
                  <Input
                    className="h-11 sm:h-12 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    id="admin-reset-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer z-10"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none" htmlFor="admin-reset-confirm">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted pointer-events-none z-10" />
                  <Input
                    className="h-11 sm:h-12 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    id="admin-reset-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer z-10"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {status.message && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                  {status.message}
                </div>
              )}

              <div className="pt-2">
                <button
                  className="h-11 sm:h-12 w-full rounded-xl bg-brand-blue text-sm font-semibold text-white hover:bg-brand-navy active:bg-brand-navy transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin size-4" />
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    <span>Reset password</span>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-brand-muted pt-2 sm:pt-3">
                <a href="/admin/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline">
                  <ArrowLeft size={14} /> Back to sign in
                </a>
              </p>
            </form>
          </>
        )}
      </div>
    </AdminAuthLayout>
  )
}

export default AdminResetPassword
