import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import powerWatchLogo from '../../../assets/logo.svg'
import { AdminAuthLayout } from '../../../components/auth/AdminAuthLayout'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'

function AdminLogin() {
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
      setStatus({
        type: 'error',
        message: 'Authentication is not configured in this environment. Check environment variables.',
      })
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)
    if (error) {
      setStatus({
        type: 'error',
        message: error.message || 'We could not sign you in. Check your credentials and try again.',
      })
      return
    }

    const role = data.user?.user_metadata?.role ||
                 data.user?.app_metadata?.role ||
                 (data.user?.email?.startsWith('admin@') || data.user?.email?.includes('admin') ? 'admin' : null)
    if (role !== 'admin') {
      await supabase.auth.signOut()
      setStatus({
        type: 'error',
        message: 'This account does not have administrator privileges.',
      })
      return
    }

    window.location.assign('/admin')
  }

  return (
    <AdminAuthLayout>
      <div className="w-full rounded-lg sm:rounded-xl border border-brand-line bg-white p-6 sm:p-8 md:p-10  transition-all">
        {/* Brand Header */}
        <div className="mb-5 sm:mb-6 flex items-center justify-center gap-2.5 select-none">
          <img src={powerWatchLogo} alt="Valencia PowerWatch" className="size-8 sm:size-9 rounded-xl object-contain" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-brand-navy">
            PowerWatch
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6 sm:mb-7 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">
            Admin Login
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-brand-muted">
            Sign in with your administrator or utility credentials
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="admin-email"
            >
              EMAIL
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-brand-muted pointer-events-none z-10" />
              <Input
                className="h-11 sm:h-12 w-full rounded-xl border border-brand-line bg-white pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={updateField}
                aria-invalid={status.type === 'error'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="admin-password"
            >
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-brand-muted pointer-events-none z-10" />
              <Input
                className="h-11 sm:h-12 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={updateField}
                aria-invalid={status.type === 'error'}
              />
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer z-10"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end pt-0.5">
            <a
              href="/admin/forgot-password"
              className="text-xs font-semibold text-brand-blue hover:text-brand-navy hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Status Message */}
          {status.message && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              role="alert"
            >
              {status.message}
            </div>
          )}

          {/* Submit Button (No shadow, flat crisp modern style) */}
          <div className="pt-2">
            <button
              className="h-11 sm:h-12 w-full rounded-xl bg-brand-blue text-sm font-semibold text-white hover:bg-brand-navy active:bg-brand-navy transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin size-4" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Help Prompt */}
          <p className="text-center text-xs text-brand-muted pt-2 sm:pt-3">
            Need access?{' '}
            <a href="/" className="font-semibold text-brand-blue hover:underline">
              Contact your system administrator.
            </a>
          </p>
        </form>
      </div>
    </AdminAuthLayout>
  )
}

export default AdminLogin
