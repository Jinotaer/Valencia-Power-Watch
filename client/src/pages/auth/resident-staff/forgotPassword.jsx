import { ArrowLeft, LoaderCircle, Mail, ShieldCheck, Users, Zap } from 'lucide-react'
import { useState } from 'react'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'
import { supabase } from '../../../lib/supabase'

export default function PortalForgotPassword({ role = 'resident' }) {
  const isResident = role === 'resident'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const Icon = isResident ? Users : ShieldCheck
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/${portal}/reset-password` })
    setLoading(false)
    setStatus(error ? { type: 'error', message: error.message || 'We could not send the reset email. Try again.' } : { type: 'success', message: 'If that email belongs to an account, a reset link is on its way.' })
  }

  return (
    <PortalAuthLayout>
      <div className="w-full rounded-xl border border-[#e1e6f4] bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:p-7">
        <div className="mb-5 flex items-center justify-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#ffdc00] text-[#101b4f]"><Zap className="size-4 fill-current" /></span><span className="text-[15px] font-bold text-[#101b4f]">PowerWatch</span></div>
        <div className="mb-6 text-center"><div className="mx-auto mb-3 grid size-9 place-items-center rounded-full bg-[#eef2ff] text-[#24449a]"><Icon className="size-4" /></div><h1 className="text-[22px] font-bold text-[#101b4f]">Reset password</h1><p className="mt-1 text-[10px] text-slate-500">Enter your email to receive a recovery link</p></div>
        {status.type === 'success' ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-xs text-emerald-800" role="status">{status.message}</div> : <form className="space-y-4" onSubmit={handleSubmit}><label className="block text-[9px] font-bold uppercase tracking-[0.08em] text-slate-600" htmlFor={`${role}-reset-email`}>EMAIL</label><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-lg border border-[#d8dff1] pl-10 pr-4 text-xs focus:border-[#24449a] focus:outline-none focus:ring-2 focus:ring-[#24449a]/20" id={`${role}-reset-email`} type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>{status.message && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{status.message}</div>}<button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2949a3] text-xs font-semibold text-white" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="size-4 animate-spin" />Sending link...</> : 'Send reset link'}</button></form>}
        <a href={`/${portal}/login`} className="mt-5 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#24449a] hover:underline"><ArrowLeft className="size-3" /> Back to sign in</a>
      </div>
    </PortalAuthLayout>
  )
}