import { Bell, ChevronRight, ClipboardList, FilePlus2, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'
import { loadReports } from '../../lib/reports'
import { ReportStatusBadge, ReportTimeline } from './reportView'

const filters = [
  { label: 'All', matches: () => true },
  { label: 'Pending', matches: (report) => report.status === 'Pending' },
  { label: 'Verified', matches: (report) => report.status === 'Verified' },
  { label: 'Resolved', matches: (report) => report.status === 'Resolved' },
]

function ReportCard({ report }) {
  return (
    <article className="rounded-2xl border border-brand-line bg-white p-3.5 shadow-[0_6px_18px_rgba(23,43,104,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="max-w-[22ch] text-[13px] font-extrabold leading-tight text-brand-navy sm:text-sm">{report.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-brand-muted sm:text-xs">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-brand-blue" aria-hidden="true" />{report.location}</span>
            <span>·</span>
            <span>{report.date}</span>
          </div>
        </div>
        <ReportStatusBadge tone={report.tone} status={report.status} />
      </div>
      <p className="mt-3 max-w-[48ch] text-[11px] leading-4 text-brand-muted sm:text-sm sm:leading-6">{report.description}</p>
      <ReportTimeline progress={report.progress} />
      <div className="mt-3 flex items-center justify-between border-t border-brand-line pt-2.5">
        <span className="text-[9px] font-semibold tracking-[.04em] text-brand-muted sm:text-[11px]">{report.id}</span>
        <a href={`/community/reports/${report.id}`} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-blue no-underline hover:text-brand-navy sm:text-xs">
          View details <ChevronRight className="size-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  )
}

export default function ResidentReports() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true

    loadReports()
      .then((savedReports) => {
        if (active) setReports(savedReports)
      })
      .catch(() => {
        if (active) {
          setReports([])
          setLoadError('We could not load your reports. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const retryLoad = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  const visibleReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const selectedFilter = filters.find((option) => option.label === filter)
    return reports.filter((report) => {
      const matchesFilter = selectedFilter?.matches(report)
      const matchesQuery = !normalizedQuery || [report.id, report.title, report.location, report.status].some((value) => value.toLowerCase().includes(normalizedQuery))
      return matchesFilter && matchesQuery
    })
  }, [filter, query, reports])
  const activeCount = reports.filter((report) => report.status !== 'Resolved').length
  const resolvedCount = reports.filter((report) => report.status === 'Resolved').length

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community" className="no-underline"><PortalMark role="resident" /></a>
          <button type="button" className="grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper sm:size-10" aria-label="Notifications">
            <Bell className="size-[17px] sm:size-[19px]" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        <div className="mb-4">
          <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-brand-navy">My Reports</h1>
          <p className="mt-1 text-[11px] leading-4 text-brand-muted sm:mt-2 sm:text-sm sm:leading-6">Track your submitted reports and their status.</p>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
          {[
            [String(reports.length), 'Total', 'text-brand-navy'],
            [String(activeCount), 'Active', 'text-brand-blue'],
            [String(resolvedCount), 'Resolved', 'text-[#137a48]'],
          ].map(([value, label, color]) => (
            <div key={label} className="rounded-xl border border-brand-line bg-white px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
              <strong className={`block text-lg font-extrabold leading-none ${color}`}>{value}</strong>
              <span className="mt-1 block text-[9px] font-semibold text-brand-muted sm:text-[11px]">{label}</span>
            </div>
          ))}
        </div>

        <a href="/community/reports/new" className="group mb-3 flex min-h-9 items-center justify-between gap-3 rounded-xl bg-brand-blue px-3 text-white no-underline shadow-[0_7px_16px_rgba(36,68,154,0.2)] transition-transform hover:-translate-y-0.5 sm:mb-5 sm:min-h-12 sm:rounded-2xl sm:px-4">
          <span className="flex items-center gap-2 text-[11px] font-bold sm:text-sm"><span className="grid size-5 place-items-center rounded-md bg-brand-yellow text-brand-navy sm:size-7 sm:rounded-lg"><FilePlus2 className="size-3 sm:size-4" strokeWidth={2.5} aria-hidden="true" /></span>Report an interruption</span>
          <ChevronRight className="size-4 opacity-90" aria-hidden="true" />
        </a>

        <section aria-labelledby="report-history-heading">
          <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
            <h2 id="report-history-heading" className="text-base font-extrabold tracking-[-.02em] text-brand-navy sm:text-lg">Report history</h2>
            <span className="text-[10px] font-semibold text-brand-muted sm:text-xs">{isLoading ? 'Loading…' : loadError ? 'Unavailable' : `${visibleReports.length} reports`}</span>
          </div>
          <label className="mb-2 flex h-9 items-center gap-2 rounded-xl border border-brand-line bg-white px-3 text-[11px] text-brand-muted focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-[e5e9f6] sm:mb-3 sm:h-11 sm:text-sm">
            <Search className="size-3.5 sm:size-4" aria-hidden="true" />
            <span className="sr-only">Search reports</span>
            <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-brand-muted" type="search" placeholder="Search by place or report ID" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
            {filters.map(({ label }) => {
              const count = label === 'All' ? reports.length : reports.filter((report) => report.status === label).length
              return <button key={label} type="button" onClick={() => setFilter(label)} className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-colors sm:px-3 sm:text-xs ${filter === label ? 'bg-brand-blue text-white' : 'border border-brand-line bg-white text-brand-muted hover:border-brand-line'}`}>{label} <span className="opacity-80">{count}</span></button>
            })}
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {isLoading && <div className="rounded-2xl border border-brand-line bg-white px-5 py-10 text-center text-sm font-semibold text-brand-muted">Loading your reports…</div>}
            {!isLoading && loadError && (
              <div className="rounded-2xl border border-[#f3c7c3] bg-white px-5 py-10 text-center">
                <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                <button type="button" className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4" onClick={retryLoad}>Try again</button>
              </div>
            )}
            {!isLoading && !loadError && visibleReports.map((report) => <ReportCard key={report.id} report={report} />)}
            {!isLoading && !loadError && visibleReports.length === 0 && (
              <div className="rounded-2xl border border-dashed border-brand-line bg-white px-5 py-10 text-center">
                <ClipboardList className="mx-auto size-8 text-brand-muted" aria-hidden="true" />
                {reports.length === 0 ? (
                  <>
                    <p className="mt-3 text-sm font-bold text-brand-muted">You haven&apos;t submitted any reports yet.</p>
                    <a href="/community/reports/new" className="mt-2 inline-block text-xs font-bold text-brand-blue underline underline-offset-4">Report an interruption</a>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-bold text-brand-muted">No reports match this filter.</p>
                    <button type="button" className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4" onClick={() => { setFilter('All'); setQuery('') }}>Show all reports</button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <PortalMobileNav role="resident" />
    </div>
  )
}
