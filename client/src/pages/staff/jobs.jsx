import {
  AlertTriangle,
  Bell,
  Check,
  Compass,
  MapPin,
  Navigation,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { initialJobs, stageNames } from './jobsData'

export default function StaffJobs() {
  const [jobs, setJobs] = useState(initialJobs)
  const [filter, setFilter] = useState('all') // 'all' | 'new' | 'active' | 'done'
  const [selectedJobForStatus, setSelectedJobForStatus] = useState(null)
  const [navJob, setNavJob] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Count calculations
  const counts = useMemo(() => {
    const newCount = jobs.filter((j) => j.statusType === 'new').length
    const activeCount = jobs.filter((j) => j.statusType === 'in-progress' || j.statusType === 'acknowledged').length
    const doneCount = jobs.filter((j) => j.statusType === 'done').length
    const allAssigned = jobs.filter((j) => j.statusType !== 'done').length
    return { all: allAssigned, new: newCount, active: activeCount, done: doneCount }
  }, [jobs])

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs.filter((j) => j.statusType !== 'done')
    if (filter === 'new') return jobs.filter((j) => j.statusType === 'new')
    if (filter === 'active') return jobs.filter((j) => j.statusType === 'in-progress' || j.statusType === 'acknowledged')
    if (filter === 'done') return jobs.filter((j) => j.statusType === 'done')
    return jobs
  }, [jobs, filter])

  // Acknowledge a new job
  const handleAcknowledge = (jobId) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'Acknowledged',
              statusType: 'acknowledged',
              step: 1,
              stepLabel: 'Step 1 of 4 · Acknowledged',
            }
          : j
      )
    )
    showToast('Job acknowledged! Ready to begin route.')
  }

  // Update status stage
  const handleSetStage = (jobId, stageId) => {
    const stageObj = stageNames.find((s) => s.id === stageId)
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const isDone = stageId === 4
          return {
            ...j,
            step: stageId,
            status: isDone ? 'Done' : stageId === 1 ? 'Acknowledged' : 'In progress',
            statusType: isDone ? 'done' : stageId === 1 ? 'acknowledged' : 'in-progress',
            stepLabel: isDone ? 'Step 4 of 4 · Resolved' : `Step ${stageId} of 4 · ${stageObj?.label}`,
          }
        }
        return j
      })
    )
    setSelectedJobForStatus(null)
    showToast(`Status updated to: ${stageObj?.label}`)
  }

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy flex flex-col justify-between">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-brand-yellow" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {/* Logo & Portal Branding */}
          <a href="/staff" className="flex items-center gap-2.5 no-underline">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-ink shadow-xs">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-brand-muted">
                STAFF PORTAL
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-brand-navy">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-2xl border border-brand-line bg-white text-brand-navy shadow-xs transition-colors hover:bg-brand-paper cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-brand-blue" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-brand-yellow ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Heading */}
        <section className="mb-4">
          <h1 className="text-3xl font-black tracking-tight text-brand-navy">Jobs</h1>
          <p className="text-xs font-semibold text-brand-muted mt-0.5">Your assigned work orders.</p>
        </section>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
            }`}
          >
            All {counts.all}
          </button>

          <button
            type="button"
            onClick={() => setFilter('new')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'new'
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
            }`}
          >
            New {counts.new}
          </button>

          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'active'
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
            }`}
          >
            Active {counts.active}
          </button>

          <button
            type="button"
            onClick={() => setFilter('done')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'done'
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
            }`}
          >
            Done {counts.done}
          </button>
        </div>

        {/* JOBS LIST */}
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const isInProgress = job.statusType === 'in-progress'
            const isNew = job.statusType === 'new'
            const isAcknowledged = job.statusType === 'acknowledged'
            const isDone = job.statusType === 'done'

            return (
              <article
                key={job.id}
                className="rounded-3xl border border-brand-line bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(23,43,104,0.04)]"
              >
                {/* Header: Title + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-extrabold text-brand-navy leading-snug">
                    {job.title}
                  </h2>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      isInProgress
                        ? 'bg-[e5e9f6] text-brand-blue'
                        : isNew
                        ? 'bg-[fff1a8] text-[#9a6700]'
                        : isAcknowledged
                        ? 'bg-[e5e9f6] text-brand-blue'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                {/* Location Line */}
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                  <MapPin className="size-3.5 text-brand-blue shrink-0" />
                  <span>
                    {job.location} · {job.distance}
                  </span>
                </div>

                {/* Order ID & Assignment Time + Optional Hazard Tag */}
                <div className="mt-1 flex items-center justify-between text-xs font-medium text-brand-muted">
                  <span>
                    {job.id} · Assigned {job.assignedTime}
                  </span>
                  {job.hasHazard && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10px] font-extrabold text-[#b91c1c]">
                      <AlertTriangle className="size-3" />
                      <span>Hazard</span>
                    </span>
                  )}
                </div>

                {/* 4-Segment Progress Bar */}
                <div className="mt-3 flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        job.step >= seg ? 'bg-brand-blue' : 'bg-brand-line'
                      }`}
                    />
                  ))}
                </div>

                {/* Step Subtitle Caption */}
                <p className="mt-1.5 text-[11px] font-semibold text-brand-muted">{job.stepLabel}</p>

                {/* Action Buttons Row */}
                <div className="mt-4">
                  {/* If Job is NEW: Big Yellow "Acknowledge job" Button */}
                  {isNew && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(job.id)}
                      className="flex h-11 w-full items-center justify-center rounded-2xl bg-brand-yellow text-xs sm:text-sm font-black text-brand-navy shadow-xs hover:bg-brand-yellow active:scale-[0.99] transition-all cursor-pointer"
                    >
                      Acknowledge job
                    </button>
                  )}

                  {/* If Job is IN PROGRESS or ACKNOWLEDGED: "Navigate" + "Update status" */}
                  {(isInProgress || isAcknowledged) && (
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setNavJob(job)}
                        className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-brand-line bg-white text-xs sm:text-sm font-bold text-brand-blue shadow-xs hover:bg-brand-paper active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Navigation className="size-4 rotate-45" />
                        <span>Navigate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedJobForStatus(job)}
                        className="flex h-11 items-center justify-center rounded-2xl bg-brand-blue text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-navy active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Update status
                      </button>
                    </div>
                  )}

                  {/* If Job is DONE: "View Summary" */}
                  {isDone && (
                    <button
                      type="button"
                      onClick={() => setSelectedJobForStatus(job)}
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-brand-line bg-white text-xs font-bold text-brand-muted hover:bg-brand-paper transition-all cursor-pointer"
                    >
                      View resolution summary
                    </button>
                  )}
                </div>
              </article>
            )
          })}

          {filteredJobs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-brand-line p-8 text-center text-xs text-brand-muted">
              No jobs found under this filter.
            </div>
          )}
        </div>
      </main>

      {/* UPDATE STATUS MODAL */}
      {selectedJobForStatus && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  {selectedJobForStatus.id}
                </span>
                <h3 className="text-base font-extrabold text-brand-navy">Update Job Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForStatus(null)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 pt-4">
              {stageNames.map((stg) => (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => handleSetStage(selectedJobForStatus.id, stg.id)}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-bold transition-all cursor-pointer border ${
                    selectedJobForStatus.step === stg.id
                      ? 'border-brand-blue bg-[e5e9f6] text-brand-blue'
                      : 'border-brand-line bg-white text-brand-ink hover:bg-brand-paper'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
                        selectedJobForStatus.step === stg.id
                          ? 'bg-brand-blue text-white'
                          : 'bg-[#e5e9f6] text-brand-muted'
                      }`}
                    >
                      {stg.id}
                    </span>
                    <span>{stg.label}</span>
                  </span>
                  {selectedJobForStatus.step === stg.id && (
                    <Check className="size-4 text-brand-blue" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION MODAL */}
      {navJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h3 className="text-base font-extrabold text-brand-navy">Directions to Site</h3>
              <button
                type="button"
                onClick={() => setNavJob(null)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-brand-line bg-brand-paper p-3.5">
                <span className="text-[10px] font-bold uppercase text-brand-muted">Destination</span>
                <p className="font-extrabold text-brand-navy text-sm mt-0.5">{navJob.location}</p>
                <p className="text-brand-muted mt-1 font-medium">{navJob.distance} from your location</p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=Valencia+City+${encodeURIComponent(
                    navJob.location
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 font-bold text-white shadow-xs hover:bg-brand-navy"
                >
                  <Navigation className="size-3.5" />
                  <span>Open Google Maps</span>
                </a>
                <a
                  href="/staff/map"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-brand-line py-2.5 font-bold text-brand-ink hover:bg-brand-paper"
                >
                  <Compass className="size-3.5" />
                  <span>View in Field Map</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="staff" />
    </div>
  )
}

