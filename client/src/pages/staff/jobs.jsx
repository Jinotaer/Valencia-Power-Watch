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

const initialJobs = [
  {
    id: 'WO-2026-0418',
    title: 'Power interruption near Guinyoran',
    location: 'Brgy. Guinuyoran',
    distance: '2.4 km away',
    assignedTime: '8:42 AM',
    status: 'In progress',
    statusType: 'in-progress',
    step: 2,
    stepLabel: 'Step 2 of 4 · En route',
    hasHazard: false,
  },
  {
    id: 'WO-2026-0421',
    title: 'Flickering lights',
    location: 'Brgy. Lurogan',
    distance: '5.1 km away',
    assignedTime: '9:15 AM',
    status: 'New',
    statusType: 'new',
    step: 0,
    stepLabel: 'Not started · Acknowledge to begin',
    hasHazard: false,
  },
  {
    id: 'WO-2026-0415',
    title: 'Damaged line near chapel',
    location: 'Brgy. Poblacion',
    distance: '3.8 km away',
    assignedTime: '8:50 AM',
    status: 'Acknowledged',
    statusType: 'acknowledged',
    step: 1,
    stepLabel: 'Step 1 of 4 · Acknowledged',
    hasHazard: true,
  },
  {
    id: 'WO-2026-0410',
    title: 'Blown fuse replacement',
    location: 'Brgy. Catumbalon',
    distance: '6.2 km away',
    assignedTime: '7:10 AM',
    status: 'Done',
    statusType: 'done',
    step: 4,
    stepLabel: 'Step 4 of 4 · Resolved at 8:05 AM',
    hasHazard: false,
  },
  {
    id: 'WO-2026-0408',
    title: 'Meter box inspection',
    location: 'Brgy. Batangan',
    distance: '4.5 km away',
    assignedTime: 'Yesterday',
    status: 'Done',
    statusType: 'done',
    step: 4,
    stepLabel: 'Step 4 of 4 · Resolved yesterday',
    hasHazard: false,
  },
]

const stageNames = [
  { id: 1, label: 'Acknowledged' },
  { id: 2, label: 'En route' },
  { id: 3, label: 'On site' },
  { id: 4, label: 'Resolved' },
]

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
    <div className="min-h-screen bg-[#f4f7fb] text-[#172b68] flex flex-col justify-between">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-[#172b68] px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-[#ffd500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#e2eaf4] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {/* Logo & Portal Branding */}
          <a href="/staff" className="flex items-center gap-2.5 no-underline">
            <span className="grid size-9 place-items-center rounded-xl bg-[#ffd500] text-[#101114] shadow-xs">
              <Zap className="size-5 fill-current" />
            </span>
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-[#60748e]">
                STAFF PORTAL
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-[#172b68]">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-2xl border border-[#dbe4ef] bg-white text-[#172b68] shadow-xs transition-colors hover:bg-[#f4f7fb] cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-[#24449a]" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#ffd500] ring-2 ring-white" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Heading */}
        <section className="mb-4">
          <h1 className="text-3xl font-black tracking-tight text-[#172b68]">Jobs</h1>
          <p className="text-xs font-semibold text-[#58708a] mt-0.5">Your assigned work orders.</p>
        </section>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#1b3d8f] text-white'
                : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
            }`}
          >
            All {counts.all}
          </button>

          <button
            type="button"
            onClick={() => setFilter('new')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'new'
                ? 'bg-[#1b3d8f] text-white'
                : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
            }`}
          >
            New {counts.new}
          </button>

          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'active'
                ? 'bg-[#1b3d8f] text-white'
                : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
            }`}
          >
            Active {counts.active}
          </button>

          <button
            type="button"
            onClick={() => setFilter('done')}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              filter === 'done'
                ? 'bg-[#1b3d8f] text-white'
                : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
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
                className="rounded-3xl border border-[#e2eaf4] bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(23,43,104,0.04)]"
              >
                {/* Header: Title + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-extrabold text-[#172b68] leading-snug">
                    {job.title}
                  </h2>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      isInProgress
                        ? 'bg-[#dce7ff] text-[#1e40af]'
                        : isNew
                        ? 'bg-[#fff3c4] text-[#9a6700]'
                        : isAcknowledged
                        ? 'bg-[#dce7ff] text-[#1e40af]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                {/* Location Line */}
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#58708a]">
                  <MapPin className="size-3.5 text-[#24449a] shrink-0" />
                  <span>
                    {job.location} · {job.distance}
                  </span>
                </div>

                {/* Order ID & Assignment Time + Optional Hazard Tag */}
                <div className="mt-1 flex items-center justify-between text-xs font-medium text-[#58708a]">
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
                        job.step >= seg ? 'bg-[#1b3d8f]' : 'bg-[#e2eaf4]'
                      }`}
                    />
                  ))}
                </div>

                {/* Step Subtitle Caption */}
                <p className="mt-1.5 text-[11px] font-semibold text-[#58708a]">{job.stepLabel}</p>

                {/* Action Buttons Row */}
                <div className="mt-4">
                  {/* If Job is NEW: Big Yellow "Acknowledge job" Button */}
                  {isNew && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(job.id)}
                      className="flex h-11 w-full items-center justify-center rounded-2xl bg-[#ffd500] text-xs sm:text-sm font-black text-[#172b68] shadow-xs hover:bg-[#ffdc00] active:scale-[0.99] transition-all cursor-pointer"
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
                        className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#d2dde8] bg-white text-xs sm:text-sm font-bold text-[#1b3d8f] shadow-xs hover:bg-[#f6f9fc] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Navigation className="size-4 rotate-45" />
                        <span>Navigate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedJobForStatus(job)}
                        className="flex h-11 items-center justify-center rounded-2xl bg-[#1b3d8f] text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#142e6d] active:scale-[0.98] transition-all cursor-pointer"
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
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      View resolution summary
                    </button>
                  )}
                </div>
              </article>
            )
          })}

          {filteredJobs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#cbd5e1] p-8 text-center text-xs text-slate-400">
              No jobs found under this filter.
            </div>
          )}
        </div>
      </main>

      {/* UPDATE STATUS MODAL */}
      {selectedJobForStatus && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedJobForStatus.id}
                </span>
                <h3 className="text-base font-extrabold text-[#172b68]">Update Job Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForStatus(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                      ? 'border-[#1b3d8f] bg-[#e7effc] text-[#1b3d8f]'
                      : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
                        selectedJobForStatus.step === stg.id
                          ? 'bg-[#1b3d8f] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {stg.id}
                    </span>
                    <span>{stg.label}</span>
                  </span>
                  {selectedJobForStatus.step === stg.id && (
                    <Check className="size-4 text-[#1b3d8f]" />
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
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#172b68]">Directions to Site</h3>
              <button
                type="button"
                onClick={() => setNavJob(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-slate-100 bg-[#f4f7fb] p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Destination</span>
                <p className="font-extrabold text-[#172b68] text-sm mt-0.5">{navJob.location}</p>
                <p className="text-slate-500 mt-1 font-medium">{navJob.distance} from your location</p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=Valencia+City+${encodeURIComponent(
                    navJob.location
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#1b3d8f] py-2.5 font-bold text-white shadow-xs hover:bg-[#142e6d]"
                >
                  <Navigation className="size-3.5" />
                  <span>Open Google Maps</span>
                </a>
                <a
                  href="/staff/map"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
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

