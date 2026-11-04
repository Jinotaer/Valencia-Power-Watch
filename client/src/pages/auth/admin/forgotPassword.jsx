import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, Zap } from 'lucide-react'
import { useState } from 'react'
import { AdminAuthLayout } from '../../../components/auth/AdminAuthLayout'
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
    if (!supabase) {
      setLoading(false)
      setStatus({
        type: 'error',
        message: 'Password recovery is not configured in this environment.',
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
      <div className="w-full rounded-[28px] sm:rounded-[32px] border border-[#dbe2f4] bg-white p-6 sm:p-8 md:p-10 shadow-[0_16px_40px_rgba(27,48,119,0.07)]">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-center gap-2.5 select-none">
          <span className="grid size-9 place-items-center rounded-xl bg-[#ffdc00] text-[#101b4f] shadow-xs">
            <Zap className="size-5 fill-current" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight text-[#101b4f]">
            PowerWatch
          </span>
        </div>

        {/* Title */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101b4f]">
            Reset Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
            Enter your email to receive a password recovery link
          </p>
        </div>

        {status.type === 'success' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 text-center">
            <CheckCircle2 className="mx-auto mb-2 text-emerald-600 size-8" />
            <h3 className="text-sm font-bold">Check your inbox</h3>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-emerald-900">{status.message}</p>
            <a
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#24449a] px-5 py-2.5 text-xs font-semibold text-white no-underline hover:bg-[#1a3375] transition-colors"
              href="/admin/login"
            >
              <ArrowLeft size={14} /> Return to sign in
            </a>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 select-none" htmlFor="reset-email">
                EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  className="h-12 w-full rounded-xl border border-[#d8dff1] bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#24449a] focus:outline-none focus:ring-2 focus:ring-[#24449a]/20"
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setStatus({ type: '', message: '' })
                  }}
                />
              </div>
            </div>

            {status.message && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                {status.message}
              </div>
            )}

            <div className="pt-2">
              <button
                className="h-12 w-full rounded-xl bg-[#24449a] hover:bg-[#1a3375] active:bg-[#122452] text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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

            <p className="text-center text-xs text-slate-500 pt-2">
              <a
                className="inline-flex items-center gap-1.5 font-semibold text-[#24449a] hover:underline"
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
