import { Bell, CheckCircle2, ChevronRight, CloudSun, FilePlus2, MapPinned, ShieldCheck } from 'lucide-react'
import { PortalMobileNav, PortalMark } from './PortalMobileNav'

export function PortalHome({ role }) {
  const isStaff = role === 'staff'
  const copy = isStaff
    ? {
        title: 'Today’s response desk',
        place: 'Valencia City operations',
        statusTitle: 'All assigned work is on track',
        statusText: 'You have 3 scheduled tasks today. Review the queue before heading out.',
        primaryLabel: 'Open response queue',
        primaryPath: '/staff/jobs',
        secondaryLabel: 'Open field map',
        secondaryPath: '/staff/map',
      }
    : {
        title: 'Your area',
        place: 'Brgy. Guinyoran',
        statusTitle: 'No active outage incidents recorded',
        statusText: 'Walay active outage incident nga naa sa system para sa imong barangay karon.',
        primaryLabel: 'Report an outage',
        primaryPath: '/community/reports/new',
        secondaryLabel: 'View outage map',
        secondaryPath: '/community/map',
      }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#172b3f]">
      <header className="sticky top-0 z-20 border-b border-[#dbe4ef] bg-white/95 px-5 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href={isStaff ? '/staff' : '/community'} className="no-underline">
            <PortalMark role={role} />
          </a>
          <div className="flex items-center gap-2">
            <button type="button" className="grid size-10 place-items-center rounded-xl border border-[#d7e1ed] bg-white text-[#3d5874] transition-colors hover:bg-[#f4f7fb]" aria-label="Notifications">
              <Bell className="size-[19px]" aria-hidden="true" />
            </button>
            <span className="grid size-10 place-items-center rounded-full bg-[#d9eafa] text-sm font-bold text-[#1769c2]" aria-label="Signed in as J">J</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-8 md:pb-10">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#68809b]">{copy.title}</p>
            <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-[#172b68]">{copy.place}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#d7e4f0] bg-white px-3 py-2 text-xs font-semibold text-[#405873]">
            <CloudSun className="size-4 text-[#1769c2]" aria-hidden="true" />
            <span>28°C</span>
          </div>
        </div>

        <section className={`relative overflow-hidden rounded-2xl border p-5 shadow-[0_10px_28px_rgba(23,43,104,0.06)] ${isStaff ? 'border-[#cbdaf0] bg-[#edf5ff]' : 'border-[#a9e3cb] bg-[#ecfbf4]'}`} aria-labelledby="portal-status">
          <div className="relative z-10">
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[.08em] ${isStaff ? 'bg-[#dcecff] text-[#1769c2]' : 'bg-[#d9f9e8] text-[#11834b]'}`}>
              {isStaff ? <ShieldCheck className="size-4" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
              {isStaff ? 'Response desk ready' : 'Grid normal'}
            </div>
            <h2 id="portal-status" className="max-w-[24ch] text-xl font-extrabold leading-tight text-[#1d5d39]">{copy.statusTitle}</h2>
            <p className="mt-2 max-w-[48ch] text-sm leading-6 text-[#4c6782]">{copy.statusText}</p>
          </div>
          <span className="absolute -right-10 -top-14 size-40 rounded-full border border-current opacity-10" aria-hidden="true" />
          <span className="absolute -bottom-16 right-10 size-32 rounded-full border border-current opacity-10" aria-hidden="true" />
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-[-.02em] text-[#172b68]">{isStaff ? 'Your next move' : 'Quick actions'}</h2>
            <span className="text-xs font-semibold text-[#70839a]">{isStaff ? '3 tasks today' : 'Stay informed'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href={copy.primaryPath} className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl bg-[#24449a] p-5 text-white no-underline shadow-[0_10px_24px_rgba(36,68,154,0.18)] transition-transform hover:-translate-y-0.5">
              <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><FilePlus2 className="size-5" aria-hidden="true" /></span><span className="text-sm font-bold">{copy.primaryLabel}</span></span>
              <ChevronRight className="size-5 opacity-80" aria-hidden="true" />
            </a>
            <a href={copy.secondaryPath} className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-[#d4dfeb] bg-white p-5 text-[#172b68] no-underline transition-colors hover:border-[#9db9d8] hover:bg-[#fbfdff]">
              <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf4ff] text-[#1769c2]"><MapPinned className="size-5" aria-hidden="true" /></span><span className="text-sm font-bold">{copy.secondaryLabel}</span></span>
              <ChevronRight className="size-5 text-[#7890aa] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <PortalMobileNav role={role} />
    </div>
  )
}
