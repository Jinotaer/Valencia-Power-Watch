import { CalendarDays, ClipboardList, Map, Megaphone, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'
import { BellLink } from '../../components/layout/BellLink'
import { loadActiveSchedules } from '../../lib/schedules'
import { loadAnnouncements } from '../../lib/announcements'
import { ScheduleCard } from './schedule'

const quickActions = [
  { label: 'Outage map', path: '/community/map', icon: Map },
  { label: 'Scheduled', path: '/community/schedule', icon: CalendarDays },
  { label: 'My reports', path: '/community/reports', icon: ClipboardList },
  { label: 'Advisories', path: '/community/announcements', icon: Megaphone },
]

function RelativeTime({ value }) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  const label = minutes < 1
    ? 'just now'
    : minutes < 60
      ? `${minutes} min ago`
      : minutes < 1440
        ? `${Math.round(minutes / 60)} h ago`
        : `${Math.round(minutes / 1440)} d ago`
  return <span>{label}</span>
}

export default function ResidentHome() {
  const [schedules, setSchedules] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([loadActiveSchedules().catch(() => []), loadAnnouncements(3).catch(() => [])])
      .then(([rows, notices]) => {
        if (!active) return
        setSchedules(rows)
        setAnnouncements(notices)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const firstAnnouncement = announcements[0]

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community" className="no-underline"><PortalMark role="resident" /></a>
          <BellLink />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
          <div>
            <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-brand-navy">Power updates</h1>
            <p className="mt-1 text-[10px] text-brand-muted sm:text-xs">⌖ Brgy. Guinyoran</p>
          </div>
          <a href="/community/profile" className="text-[10px] font-bold text-brand-blue no-underline sm:text-xs">Change</a>
        </div>

        {isLoading && (
          <section className="mb-3 rounded-2xl bg-brand-blue p-3.5 text-white sm:mb-5 sm:p-5">
            <p className="text-xs font-semibold text-[e5e9f6]">Loading advisories…</p>
          </section>
        )}

        {!isLoading && firstAnnouncement && (
          <section className="relative mb-3 overflow-hidden rounded-2xl bg-brand-blue p-3.5 text-white shadow-[0_9px_22px_rgba(36,68,154,0.2)] sm:mb-5 sm:p-5" aria-labelledby="active-update">
            <div className="relative z-10">
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2 py-1 text-[9px] font-extrabold text-brand-navy sm:text-[10px]">
                <span className="size-1.5 rounded-full bg-brand-navy" aria-hidden="true" /> Advisory
              </span>
              <h2 id="active-update" className="max-w-[18ch] text-base font-extrabold leading-tight sm:text-xl">{firstAnnouncement.title}</h2>
              <p className="mt-1.5 max-w-[34ch] text-[10px] leading-4 text-[e5e9f6] sm:text-xs sm:leading-5">
                {firstAnnouncement.body}
              </p>
              <a href="/community/announcements" className="mt-3 inline-flex min-h-8 items-center rounded-lg bg-white px-3 text-[10px] font-bold text-brand-blue no-underline sm:min-h-9 sm:text-xs">Read advisories</a>
            </div>
            <span className="absolute -right-7 -top-8 size-28 rounded-full border border-white/20" aria-hidden="true" />
            <span className="absolute -right-10 top-4 size-28 rounded-full border border-white/15" aria-hidden="true" />
            <span className="absolute bottom-1 right-3 text-[9px] text-[e5e9f6] sm:text-[10px]"><RelativeTime value={firstAnnouncement.publishedAt} /></span>
          </section>
        )}

        {!isLoading && !firstAnnouncement && (
          <section className="mb-3 rounded-2xl border border-brand-line bg-white p-3.5 sm:mb-5 sm:p-5">
            <p className="text-xs font-semibold text-brand-muted">No advisories yet. When the utility posts one, it will appear here.</p>
          </section>
        )}

        <a href="/community/reports/new" className="mb-3 flex min-h-9 items-center justify-center gap-2 rounded-xl bg-brand-yellow text-[11px] font-extrabold text-brand-navy no-underline transition-colors hover:bg-brand-yellow sm:mb-5 sm:min-h-12 sm:text-sm">
          <Plus className="size-4" strokeWidth={3} aria-hidden="true" /> Report an interruption
        </a>

        <section className="mb-5 grid grid-cols-4 gap-2 sm:gap-3" aria-label="Community shortcuts">
          {quickActions.map(({ label, path, icon: Icon }) => (
            <a key={path} href={path} className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl border border-brand-line bg-white px-1 text-center text-[9px] font-semibold leading-tight text-brand-navy no-underline transition-colors hover:border-brand-line hover:bg-brand-paper sm:min-h-20 sm:rounded-2xl sm:text-[11px]">
              <span className="grid size-7 place-items-center rounded-lg bg-[e5e9f6] text-brand-blue sm:size-8"><Icon className="size-4 sm:size-[18px]" aria-hidden="true" /></span>
              <span>{label}</span>
            </a>
          ))}
        </section>

        {schedules.length > 0 && (
          <section aria-labelledby="scheduled-heading">
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <h2 id="scheduled-heading" className="text-sm font-extrabold tracking-[-.02em] text-brand-navy sm:text-base">Scheduled outages</h2>
              <a href="/community/schedule" className="text-[10px] font-bold text-brand-blue no-underline sm:text-xs">See all</a>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {schedules.slice(0, 3).map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} />)}
            </div>
          </section>
        )}
      </main>

      <PortalMobileNav role="resident" />
    </div>
  )
}
