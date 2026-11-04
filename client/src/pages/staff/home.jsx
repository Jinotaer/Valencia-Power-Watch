import {
  AlertTriangle,
  Bell,
  Check,
  ClipboardList,
  Compass,
  MapPin,
  Navigation,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'

export default function StaffHome() {
  // Duty toggle state
  const [isOnDuty, setIsOnDuty] = useState(true)

  // Current active job status tracking (1: Acknowledged, 2: En route, 3: On site, 4: Resolved)
  const [jobStage, setJobStage] = useState(2)

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showNavModal, setShowNavModal] = useState(false)
  const [selectedAssignedJob, setSelectedAssignedJob] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Work stages definition
  const stages = [
    { id: 1, label: 'Acknowledged' },
    { id: 2, label: 'En route' },
    { id: 3, label: 'On site' },
    { id: 4, label: 'Resolved' },
  ]

  const currentJob = {
    orderNo: 'WO-2026-0418',
    title: 'Power interruption near Guinyoran',
    location: 'Brgy. Guinuyoran',
    distance: '2.4 km away',
    duration: 'about 8 min',
    cause: 'Fallen acacia branch on secondary line',
    assignedTo: 'Line Crew 2',
    priority: 'High',
    customerReports: 3,
  }

  const assignedJobs = [
    {
      id: 'job-1',
      title: 'Flickering lights',
      location: 'Brgy. Lurogan',
      time: 'Assigned 9:15 AM',
      status: 'New',
      statusColor: 'bg-[#fff3c4] text-[#9a6700]',
      icon: ClipboardList,
    },
    {
      id: 'job-2',
      title: 'Damaged line near chapel',
      location: 'Brgy. Poblacion',
      time: 'Assigned 8:50 AM',
      status: 'Acknowledged',
      statusColor: 'bg-[#e7effc] text-[#24449a]',
      icon: AlertTriangle,
    },
  ]

  const handleUpdateStage = (newStage) => {
    setJobStage(newStage)
    setShowStatusModal(false)
    showToast(`Status updated to: ${stages.find((s) => s.id === newStage)?.label}`)
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

      {/* MAIN CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* USER GREETING */}
        <section className="mb-4">
          <h1 className="text-3xl font-black tracking-tight text-[#172b68]">Hello, Ramon</h1>
          <p className="text-xs font-semibold text-[#58708a] mt-0.5">Line Crew 2 · Valencia City</p>
        </section>

        {/* ON DUTY STATUS CARD */}
        <section className="mb-5 rounded-2xl border border-[#e2eaf4] bg-white p-3.5 shadow-[0_4px_16px_rgba(23,43,104,0.04)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  isOnDuty
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.5)]'
                    : 'bg-slate-300'
                }`}
              />
              <span className="text-sm font-extrabold text-[#172b68]">
                {isOnDuty ? 'On duty' : 'Off duty'}
              </span>
            </div>
            <p className="text-xs text-[#58708a] font-medium mt-0.5">
              {isOnDuty ? 'Sharing location with dispatch' : 'Location sharing paused'}
            </p>
          </div>

          {/* Switch Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isOnDuty}
            onClick={() => {
              const next = !isOnDuty
              setIsOnDuty(next)
              showToast(next ? 'You are now marked ON DUTY' : 'You are now marked OFF DUTY')
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOnDuty ? 'bg-[#1b3d8f]' : 'bg-[#cbd5e1]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isOnDuty ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* CURRENT JOB HERO CARD */}
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-[#1b3d8f] p-5 text-white shadow-[0_10px_25px_rgba(27,61,143,0.25)]">
          {/* Subtle Decorative Curves */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 -top-4 size-32 rounded-full border border-white/10" />

          {/* Top Badge & WO Code */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ffdc00] px-2.5 py-1 text-xs font-black text-[#172b68] shadow-xs">
              <Zap className="size-3 fill-current" />
              <span>Current job</span>
            </span>
            <span className="font-mono text-xs font-bold text-[#b8ccf0] tracking-wide">
              {currentJob.orderNo}
            </span>
          </div>

          {/* Job Title */}
          <h2 className="relative z-10 mt-3 text-xl font-black leading-snug tracking-tight text-white max-w-[20ch]">
            {currentJob.title}
          </h2>

          {/* Location line */}
          <div className="relative z-10 mt-2 flex items-center gap-1.5 text-xs font-medium text-[#dbe7ff]">
            <MapPin className="size-3.5 text-[#ffd500] shrink-0" />
            <span>
              {currentJob.location} · {currentJob.distance} · {currentJob.duration}
            </span>
          </div>

          {/* 4-Stage Progress Tracker */}
          <div className="relative z-10 mt-5 pt-1">
            <div className="relative flex items-center justify-between">
              {/* Background Line */}
              <div className="absolute left-3 right-3 top-3.5 h-[2px] bg-white/20 -z-0" />
              {/* Active Progress Line */}
              <div
                className="absolute left-3 top-3.5 h-[2px] bg-[#ffd500] transition-all duration-300 -z-0"
                style={{ width: `${((jobStage - 1) / 3) * 100}%` }}
              />

              {stages.map((stg) => {
                const isPassed = jobStage > stg.id
                const isCurrent = jobStage === stg.id

                return (
                  <div key={stg.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`grid size-7 place-items-center rounded-full text-xs font-black transition-all ${
                        isPassed
                          ? 'bg-[#ffd500] text-[#172b68]'
                          : isCurrent
                          ? 'bg-white text-[#172b68] ring-2 ring-[#ffd500] shadow-sm'
                          : 'bg-[#1b3d8f] border border-white/40 text-white/70'
                      }`}
                    >
                      {isPassed ? <Check className="size-3.5 stroke-[3]" /> : stg.id}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] font-extrabold whitespace-nowrap ${
                        isCurrent ? 'text-white' : isPassed ? 'text-[#ffd500]' : 'text-white/60'
                      }`}
                    >
                      {stg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
            {/* Navigate Button */}
            <button
              type="button"
              onClick={() => setShowNavModal(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-xs sm:text-sm font-bold text-[#1b3d8f] shadow-xs hover:bg-[#f6f9fc] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Navigation className="size-4 rotate-45" />
              <span>Navigate</span>
            </button>

            {/* Update Status Button */}
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#ffd500] text-xs sm:text-sm font-black text-[#172b68] shadow-xs hover:bg-[#ffdc00] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Update status</span>
            </button>
          </div>
        </section>

        {/* ASSIGNED TO YOU SECTION */}
        <section>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="text-base font-black text-[#172b68]">Assigned to you</h2>
            <span className="text-xs font-bold text-[#58708a]">{assignedJobs.length + 1} jobs</span>
          </div>

          <div className="space-y-3">
            {assignedJobs.map((job) => {
              const Icon = job.icon
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedAssignedJob(job)}
                  className="flex items-center justify-between rounded-2xl border border-[#e2eaf4] bg-white p-3.5 shadow-xs hover:border-[#b8cde6] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0fe] text-[#24449a]">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-[#172b68] truncate leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-xs text-[#58708a] font-medium truncate mt-0.5">
                        {job.location} · {job.time}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${job.statusColor}`}
                  >
                    {job.status}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {currentJob.orderNo}
                </span>
                <h3 className="text-base font-extrabold text-[#172b68]">Update Job Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 pt-4">
              {stages.map((stg) => (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => handleUpdateStage(stg.id)}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-bold transition-all cursor-pointer border ${
                    jobStage === stg.id
                      ? 'border-[#1b3d8f] bg-[#e7effc] text-[#1b3d8f]'
                      : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
                        jobStage === stg.id ? 'bg-[#1b3d8f] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {stg.id}
                    </span>
                    <span>{stg.label}</span>
                  </span>
                  {jobStage === stg.id && <Check className="size-4 text-[#1b3d8f]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION MODAL */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#172b68]">Directions to Site</h3>
              <button
                type="button"
                onClick={() => setShowNavModal(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-slate-100 bg-[#f4f7fb] p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Destination</span>
                <p className="font-extrabold text-[#172b68] text-sm mt-0.5">{currentJob.location}</p>
                <p className="text-slate-500 mt-1 font-medium">
                  {currentJob.distance} · Estimated arrival: {currentJob.duration}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=Valencia+City+Guinoyuran`}
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

      {/* ASSIGNED JOB QUICK VIEW MODAL */}
      {selectedAssignedJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#172b68]">
                {selectedAssignedJob.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAssignedJob(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center rounded-xl bg-[#f4f7fb] p-3 border border-slate-100">
                <span className="text-slate-500 font-medium">Location</span>
                <strong className="text-[#172b68]">{selectedAssignedJob.location}</strong>
              </div>
              <div className="flex justify-between items-center rounded-xl bg-[#f4f7fb] p-3 border border-slate-100">
                <span className="text-slate-500 font-medium">Assignment time</span>
                <strong className="text-[#172b68]">{selectedAssignedJob.time}</strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast('Set as active work order')
                    setSelectedAssignedJob(null)
                  }}
                  className="flex-1 rounded-xl bg-[#1b3d8f] py-2.5 font-bold text-white shadow-xs hover:bg-[#142e6d]"
                >
                  Switch to this job
                </button>
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
