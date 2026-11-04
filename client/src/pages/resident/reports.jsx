import { Bell, Check, ChevronRight, ClipboardList, FilePlus2, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'

const reports = [
  {
    id: 'PW-2026-0418',
    title: 'Power interruption near Guinyoran',
    location: 'Brgy. Guinyoran',
    date: 'Apr 18, 2026',
    status: 'Verified',
    tone: 'verified',
    description: 'Reported at 8:42 AM. Related reports were grouped for response.',
    progress: 2,
  },
  {
    id: 'PW-2026-0327',
    title: 'Flickering lights in Purok 3',
    location: 'Brgy. Lilingayon',
    date: 'Apr 12, 2026',
    status: 'Pending',
    tone: 'pending',
    description: 'Our team is checking the details and comparing nearby reports.',
    progress: 1,
  },
  {
    id: 'PW-2026-0211',
    title: 'Scheduled outage confirmation',
    location: 'Brgy. Guinuyoran',
    date: 'Feb 11, 2026',
    status: 'Resolved',
    tone: 'resolved',
    description: 'The service interruption has ended and this report is now closed.',
    progress: 4,
  },
]

const filters = [
  { label: 'All', matches: () => true },
  { label: 'Pending', matches: (report) => report.status === 'Pending' },
  { label: 'Verified', matches: (report) => report.status === 'Verified' },
  { label: 'Resolved', matches: (report) => report.status === 'Resolved' },
]

function statusClasses(tone) {
  return {
    verified: 'bg-[#d9f9e8] text-[#137a48]',
    pending: 'bg-[#fff0c7] text-[#9a6500]',
    resolved: 'bg-[#e7f1ff] text-[#245da8]',
  }[tone]
}

function ReportTimeline({ progress }) {
  const steps = ['Submitted', 'Verified', 'Dispatched', 'Resolved']
  return (
    <div className="mt-4 border-t border-[#edf1f5] pt-3">
      <div className="relative grid grid-cols-4">
        <span className="absolute left-[12%] right-[12%] top-2 h-px bg-[#b7c8df]" aria-hidden="true" />
        {steps.map((step, index) => {
          const complete = index < progress
          const current = index === progress
          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-1 text-center">
              <span className={`grid size-4 place-items-center rounded-full border-2 ${complete ? 'border-[#24449a] bg-[#24449a] text-white' : current ? 'border-[#9db3d0] bg-white' : 'border-[#9db3d0] bg-white'}`}>
                {complete && <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />}
              </span>
              <span className={`text-[9px] font-semibold ${complete ? 'text-[#405873]' : 'text-[#9aaabd]'}`}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReportCard({ report }) {
  return (
    <article className="rounded-2xl border border-[#d6e0eb] bg-white p-3.5 shadow-[0_6px_18px_rgba(23,43,104,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="max-w-[22ch] text-[13px] font-extrabold leading-tight text-[#172b68] sm:text-sm">{report.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-[#71869e] sm:text-xs">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-[#245da8]" aria-hidden="true" />{report.location}</span>
            <span>·</span>
            <span>{report.date}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusClasses(report.tone)}`}>
          {report.tone === 'verified' && <Check className="mr-0.5 inline size-3" strokeWidth={3} aria-hidden="true" />}
          {report.status}
        </span>
      </div>
      <p className="mt-3 max-w-[48ch] text-[11px] leading-4 text-[#58708a] sm:text-sm sm:leading-6">{report.description}</p>
      <ReportTimeline progress={report.progress} />
      <div className="mt-3 flex items-center justify-between border-t border-[#edf1f5] pt-2.5">
        <span className="text-[9px] font-semibold tracking-[.04em] text-[#71869e] sm:text-[11px]">{report.id}</span>
        <a href={`/community/reports/${report.id}`} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#245da8] no-underline hover:text-[#172b68] sm:text-xs">
          View details <ChevronRight className="size-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  )
}

export default function ResidentReports() {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const visibleReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const selectedFilter = filters.find((option) => option.label === filter)
    return reports.filter((report) => {
      const matchesFilter = selectedFilter?.matches(report)
      const matchesQuery = !normalizedQuery || [report.id, report.title, report.location, report.status].some((value) => value.toLowerCase().includes(normalizedQuery))
      return matchesFilter && matchesQuery
    })
  }, [filter, query])
  const activeCount = reports.filter((report) => report.status !== 'Resolved').length

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#172b3f]">
      <header className="sticky top-0 z-20 border-b border-[#dbe4ef] bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community" className="no-underline"><PortalMark role="resident" /></a>
          <button type="button" className="grid size-9 place-items-center rounded-xl border border-[#d7e1ed] bg-white text-[#3d5874] transition-colors hover:bg-[#f4f7fb] sm:size-10" aria-label="Notifications">
            <Bell className="size-[17px] sm:size-[19px]" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        <div className="mb-4">
          <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-[#172b68]">My Reports</h1>
          <p className="mt-1 text-[11px] leading-4 text-[#58708a] sm:mt-2 sm:text-sm sm:leading-6">Track your submitted reports and their status.</p>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
          {[
            ['3', 'Total', 'text-[#172b68]'],
            [String(activeCount), 'Active', 'text-[#245da8]'],
            ['1', 'Resolved', 'text-[#137a48]'],
          ].map(([value, label, color]) => (
            <div key={label} className="rounded-xl border border-[#dce5ef] bg-white px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
              <strong className={`block text-lg font-extrabold leading-none ${color}`}>{value}</strong>
              <span className="mt-1 block text-[9px] font-semibold text-[#71869e] sm:text-[11px]">{label}</span>
            </div>
          ))}
        </div>

        <a href="/community/reports/new" className="group mb-3 flex min-h-9 items-center justify-between gap-3 rounded-xl bg-[#2947a1] px-3 text-white no-underline shadow-[0_7px_16px_rgba(36,68,154,0.2)] transition-transform hover:-translate-y-0.5 sm:mb-5 sm:min-h-12 sm:rounded-2xl sm:px-4">
          <span className="flex items-center gap-2 text-[11px] font-bold sm:text-sm"><span className="grid size-5 place-items-center rounded-md bg-[#ffd500] text-[#172b68] sm:size-7 sm:rounded-lg"><FilePlus2 className="size-3 sm:size-4" strokeWidth={2.5} aria-hidden="true" /></span>Report an interruption</span>
          <ChevronRight className="size-4 opacity-90" aria-hidden="true" />
        </a>

        <section aria-labelledby="report-history-heading">
          <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
            <h2 id="report-history-heading" className="text-base font-extrabold tracking-[-.02em] text-[#172b68] sm:text-lg">Report history</h2>
            <span className="text-[10px] font-semibold text-[#70839a] sm:text-xs">{visibleReports.length} reports</span>
          </div>
          <label className="mb-2 flex h-9 items-center gap-2 rounded-xl border border-[#d4dfeb] bg-white px-3 text-[11px] text-[#7890aa] focus-within:border-[#6f96c3] focus-within:ring-2 focus-within:ring-[#dceaff] sm:mb-3 sm:h-11 sm:text-sm">
            <Search className="size-3.5 sm:size-4" aria-hidden="true" />
            <span className="sr-only">Search reports</span>
            <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#8a9caf]" type="search" placeholder="Search by place or report ID" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
            {filters.map(({ label }) => {
              const count = label === 'All' ? reports.length : reports.filter((report) => report.status === label).length
              return <button key={label} type="button" onClick={() => setFilter(label)} className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-colors sm:px-3 sm:text-xs ${filter === label ? 'bg-[#2947a1] text-white' : 'border border-[#d4dfeb] bg-white text-[#405873] hover:border-[#9db9d8]'}`}>{label} <span className="opacity-80">{count}</span></button>
            })}
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {visibleReports.map((report) => <ReportCard key={report.id} report={report} />)}
            {visibleReports.length === 0 && <div className="rounded-2xl border border-dashed border-[#c7d4e2] bg-white px-5 py-10 text-center"><ClipboardList className="mx-auto size-8 text-[#8aa0b8]" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-[#405873]">No reports match this filter.</p><button type="button" className="mt-2 text-xs font-bold text-[#245da8] underline underline-offset-4" onClick={() => { setFilter('All'); setQuery('') }}>Show all reports</button></div>}
          </div>
        </section>
      </main>
      <PortalMobileNav role="resident" />
    </div>
  )
}
