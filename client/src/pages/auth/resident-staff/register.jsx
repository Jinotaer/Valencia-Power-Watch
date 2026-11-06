import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  User,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'
import { supabase } from '../../../lib/supabase'
import { valenciaBarangays, passwordRules } from './registerData'

export default function ResidentRegister() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    barangay: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setStatus({ type: '', message: '' })
  }

  const passwordStrength = passwordRules.filter((r) => r.test(form.password)).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][passwordStrength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][passwordStrength]

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.fullName.trim()) {
      setStatus({ type: 'error', message: 'Enter your full name.' })
      return
    }
    if (!form.email.trim()) {
      setStatus({ type: 'error', message: 'Enter your email address.' })
      return
    }
    if (!form.barangay) {
      setStatus({ type: 'error', message: 'Select your home barangay.' })
      return
    }
    if (passwordStrength < 3) {
      setStatus({ type: 'error', message: 'Your password does not meet all requirements.' })
      return
    }
    if (form.password !== form.confirmPassword) {
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

    const cleanEmail = form.email.trim().toLowerCase()
    const cleanName = form.fullName.trim()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: form.password,
      options: {
        data: {
          full_name: cleanName,
          barangay: form.barangay,
          address: form.barangay,
          role: 'resident',
        },
      },
    })

    if (error) {
      setLoading(false)
      setStatus({ type: 'error', message: error.message || 'Registration failed. Please try again.' })
      return
    }

    // Attempt direct insert/upsert into public.users if the DB trigger is not active
    if (data?.user) {
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          id_number: `RES-${String(Date.now() % 10000).padStart(4, '0')}`,
          email: cleanEmail,
          full_name: cleanName,
          role: 'resident',
          address: form.barangay,
        })
      } catch (err) {
        // Non-blocking: trigger or RLS might handle it
        console.warn('Could not insert directly to public.users:', err)
      }
    }

    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <PortalAuthLayout>
        <div className="w-full rounded-lg border border-brand-line bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:rounded-xl sm:p-8 md:p-10">
          <div className="mb-6 flex items-center justify-center gap-2.5 select-none">
            <span className="grid size-8 place-items-center rounded-xl bg-brand-yellow text-brand-navy sm:size-9">
              <Zap className="size-4.5 fill-current sm:size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">PowerWatch</span>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
              <Check className="size-7 text-emerald-500 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-brand-navy sm:text-2xl">Account created!</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              We sent a confirmation link to{' '}
              <span className="font-semibold text-brand-blue">{form.email}</span>.
              Check your inbox and click the link to activate your account.
            </p>
            <a
              href="/community/login"
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-semibold text-white transition-all hover:bg-brand-navy active:bg-brand-navy sm:h-12"
            >
              Go to sign in <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </PortalAuthLayout>
    )
  }

  return (
    <PortalAuthLayout>
      <div className="w-full rounded-lg border border-brand-line bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:rounded-xl sm:p-8 md:p-10">
        {/* Brand */}
        <div className="mb-5 flex items-center justify-center gap-2.5 select-none sm:mb-6">
          <span className="grid size-8 place-items-center rounded-xl bg-brand-yellow text-brand-navy sm:size-9">
            <Zap className="size-4.5 fill-current sm:size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">PowerWatch</span>
        </div>

        {/* Title */}
        <div className="mb-6 text-center sm:mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Create account</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
            Join the community portal to report outages in Valencia City
          </p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="reg-name"
            >
              FULL NAME
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <input
                className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                id="reg-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Juan Dela Cruz"
                value={form.fullName}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="reg-email"
            >
              EMAIL
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <input
                className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Barangay */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="reg-barangay"
            >
              HOME BARANGAY
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <select
                className="h-11 w-full appearance-none rounded-xl border border-brand-line bg-white pl-10 pr-9 text-sm text-brand-ink transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                id="reg-barangay"
                name="barangay"
                value={form.barangay}
                onChange={updateField}
              >
                <option value="" disabled>Select your barangay</option>
                {valenciaBarangays.map((brgy) => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="reg-password"
            >
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <input
                className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={updateField}
              />
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue z-10"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength indicator */}
            {form.password && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-1 flex-1 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: passwordStrength >= n ? strengthColor : '#d8dce6' }}
                    />
                  ))}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {passwordRules.map((rule) => (
                      <span
                        key={rule.label}
                        className="flex items-center gap-1 text-[10px] font-medium transition-colors"
                        style={{ color: rule.test(form.password) ? '#22c55e' : '#555b66' }}
                      >
                        <Check size={10} className="shrink-0" />
                        {rule.label}
                      </span>
                    ))}
                  </div>
                  {strengthLabel && (
                    <span className="shrink-0 text-[10px] font-bold" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
              htmlFor="reg-confirm"
            >
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
              <input
                className={[
                  'h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:outline-none focus:ring-2 sm:h-12',
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50'
                    : form.confirmPassword && form.password === form.confirmPassword
                    ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200/50'
                    : 'border-brand-line focus:border-brand-blue focus:ring-brand-blue/20',
                ].join(' ')}
                id="reg-confirm"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={updateField}
              />
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-brand-muted transition-colors hover:text-brand-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue z-10"
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-[11px] font-medium text-red-500">Passwords do not match</p>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && (
              <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                <Check size={11} /> Passwords match
              </p>
            )}
          </div>

          {/* Error message */}
          {status.message && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
              {status.message}
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <button
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-semibold text-white transition-all hover:bg-brand-navy active:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-70 sm:h-12"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><LoaderCircle className="size-4 animate-spin" /><span>Creating account...</span></>
              ) : (
                <><span>Create account</span><ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Sign in link */}
          <p className="pt-1 text-center text-xs text-brand-muted sm:pt-2">
            Already have an account?{' '}
            <a
              href="/community/login"
              className="font-semibold text-brand-blue transition-colors hover:text-brand-navy hover:underline"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </PortalAuthLayout>
  )
}

