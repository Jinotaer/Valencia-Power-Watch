import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from 'lucide-react'
import { useState } from 'react'
import powerWatchLogo from '../../../assets/logo.svg'
import { AdminAuthLayout } from '../../../components/auth/AdminAuthLayout'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'

function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Enter your email address to continue.' })
      return
    }

    setLoading(true)
    setStatus({ type: '', message: '' })

    if (!supabase) {
      setLoading(false)
      setStatus({
        type: 'error',
        message: 'Authentication is not configured in this environment.',
      })
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    setLoading(false)
    setStatus(
      error
        ? { type: 'error', message: error.message || 'We could not send the reset email. Try again.' }
        : { type: 'success', message: 'If that email belongs to an account, a reset link is on its way.' }
    )
  }

  return (
    <AdminAuthLayout>
      <div className="w-full rounded-lg sm:rounded-xl border border-brand-line bg-white p-6 sm:p-8 md:p-10 transition-all">
        {/* Brand Header */}
        <div className="mb-5 sm:mb-6 flex items-center justify-center gap-2.5 select-none">
          <img
            src={powerWatchLogo}
            alt="Valencia PowerWatch"
            className="size-8 sm:size-9 rounded-xl object-contain"
          />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-brand-navy">
            PowerWatch
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6 sm:mb-7 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">
            Reset Password
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-brand-muted">
            Enter your email to receive a password recovery link
          </p>
        </div>

        {status.type === 'success' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-950">
            <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-600" />
            <h3 className="text-sm font-bold sm:text-base">Check your inbox</h3>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900 sm:text-sm">
              {status.message}
            </p>
            <a
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white no-underline transition-colors hover:bg-brand-navy sm:text-sm"
              href="/admin/login"
            >
              <ArrowLeft size={14} /> Back to sign in
            </a>
          </div>
        ) : (
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
                htmlFor="admin-reset-email"
              >
                EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-brand-muted pointer-events-none z-10" />
                <Input
                  className="h-11 sm:h-12 w-full rounded-xl border border-brand-line bg-white pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  id="admin-reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setStatus({ type: '', message: '' })
                  }}
                  aria-invalid={status.type === 'error'}
                />
              </div>
            </div>

            {status.message && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                role="alert"
              >
                {status.message}
              </div>
            )}

            <div className="pt-2">
              <button
                className="flex h-11 sm:h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-semibold text-white transition-all hover:bg-brand-navy active:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin size-4" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>

            <p className="pt-2 text-center text-xs text-brand-muted sm:pt-3">
              <a
                className="inline-flex items-center gap-1.5 font-semibold text-brand-blue transition-colors hover:text-brand-navy hover:underline"
                href="/admin/login"
              >
                <ArrowLeft size={14} /> Back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </AdminAuthLayout>
  )
}

export default AdminForgotPassword
