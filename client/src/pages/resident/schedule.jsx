import { CalendarClock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'
import { BellLink } from '../../components/layout/BellLink'
import { loadActiveSchedules } from '../../lib/schedules'

export function ScheduleCard({ schedule }) {
  const date = new Date(`${schedule.date}T00:00:00`)
  const month = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = Number.isNaN(date.getTime()) ? schedule.date : String(date.getDate())

  return (
    <article className="flex items-center gap-3 rounded-xl border border-brand-line bg-white p-2.5 shadow-[0_5px_14px_rgba(23,43,104,0.04)] sm:p-3.5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e5e9f6] text-center text-brand-blue sm:size-12">
        <span className="block text-[8px] font-extrabold leading-none tracking-[.08em]">{month}</span>
        <strong className="block text-base font-extrabold leading-4">{day}</strong>
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-[11px] font-extrabold text-brand-navy sm:text-sm">{schedule.title || 'Scheduled outage'}</h3>
        <p className="mt-0.5 truncate text-[10px] text-brand-muted sm:text-xs">{schedule.barangay ? `Brgy. ${schedule.barangay}` : 'Multiple barangays'} · {schedule.timeLabel}</p>
        <p className="mt-0.5 truncate text-[10px] text-brand-muted sm:text-xs">{schedule.type}</p>
        {schedule.description && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-brand-muted sm:text-xs">{schedule.description}</p>
        )}
      </div>
    </article>
  )
}

export default function ResidentSchedules() {
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    loadActiveSchedules()
      .then((rows) => {
        if (active) {
          setSchedules(rows)
          setLoadError('')
        }
      })
      .catch(() => {
        if (active) {
          setSchedules([])
          setLoadError('We could not load the outage schedule. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community" className="no-underline"><PortalMark role="resident" /></a>
          <BellLink />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        <div className="mb-4">
          <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-brand-navy">Scheduled outages</h1>
          <p className="mt-1 text-[11px] leading-4 text-brand-muted sm:mt-2 sm:text-sm sm:leading-6">Planned maintenance published by the utility in your area.</p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {isLoading && (
            <div className="rounded-2xl border border-brand-line bg-white px-5 py-10 text-center text-sm font-semibold text-brand-muted">
              Loading the outage schedule…
            </div>
          )}
          {!isLoading && loadError && (
            <div className="rounded-2xl border border-[#f3c7c3] bg-white px-5 py-10 text-center">
              <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
            </div>
          )}
          {!isLoading && !loadError && schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} />)}
          {!isLoading && !loadError && schedules.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-line bg-white px-5 py-10 text-center">
              <CalendarClock className="mx-auto size-8 text-brand-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-brand-muted">No scheduled outages right now.</p>
              <p className="mt-1 text-xs leading-5 text-brand-muted">When the utility plans work in your area, it will appear here first.</p>
              <a href="/community/reports/new" className="mt-2 inline-block text-xs font-bold text-brand-blue underline underline-offset-4">Report an interruption</a>
            </div>
          )}
        </div>
      </main>

      <PortalMobileNav role="resident" />
    </div>
  )
}
