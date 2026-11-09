import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from 'lucide-react'
import { useState } from 'react'
import powerWatchLogo from '../../../assets/logo.svg'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'
import { Input } from '../../../components/ui/input'
import { supabase } from '../../../lib/supabase'

export default function PortalForgotPassword({ role = 'resident' }) {
  const isResident = role === 'resident'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const portal = isResident ? 'community' : 'staff'

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Enter your email address to continue.' })
      return
    }
    if (!supabase) {
      setStatus({ type: 'error', message: 'Password recovery is not configured in this environment.' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/${portal}/reset-password`,
    })
    setLoading(false)
    setStatus(
      error
        ? { type: 'error', message: error.message || 'We could not send the reset email. Try again.' }
        : { type: 'success', message: 'If that email belongs to an account, a reset link is on its way.' }
    )
  }

  return (
    <PortalAuthLayout>
      <div className="w-full rounded-2xl border border-brand-line bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:p-8 md:p-10">
        {/* Brand Header */}
        <div className="mb-5 flex items-center justify-center gap-2.5 select-none sm:mb-6">
          <img
            src={powerWatchLogo}
            alt="Valencia PowerWatch"
            className="size-8 rounded-xl object-contain sm:size-9"
          />
          <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">
            PowerWatch
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6 text-center sm:mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
            Reset password
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
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
              href="/login"
            >
              <ArrowLeft size={14} /> Back to sign in
            </a>
          </div>
        ) : (
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-brand-muted select-none"
                htmlFor={`${role}-reset-email`}
              >
                EMAIL
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted z-10" />
                <Input
                  className="h-11 w-full rounded-xl border border-brand-line bg-white pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:h-12"
                  id={`${role}-reset-email`}
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
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-blue text-sm font-semibold text-white transition-all hover:bg-brand-navy active:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-70 sm:h-12"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>

            <p className="pt-2 text-center text-xs text-brand-muted sm:pt-3">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 font-semibold text-brand-blue transition-colors hover:text-brand-navy hover:underline"
              >
                <ArrowLeft size={14} /> Back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </PortalAuthLayout>
  )
}
