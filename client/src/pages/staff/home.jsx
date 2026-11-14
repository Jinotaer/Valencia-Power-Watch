import {
  Check,
  ClipboardList,
  ExternalLink,
  MapPin,
  Navigation,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import powerWatchLogo from '../../assets/logo.svg'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import {
  loadAssignedReports,
  updateReportStatus,
} from '../../lib/reports'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../lib/i18n'
import { ReportPriorityBadge, ReportStatusBadge } from '../../components/resident/reportView'
import { ResolutionEvidenceInput } from '../../components/staff/evidenceInput'
import { StaffNotificationsButton } from '../../components/staff/notificationsModal'
import { StaffUpdateFields } from '../../components/staff/updateFields'

// Real report statuses power the stepper (see supabase/report.sql):
// pending = assigned and awaiting start, verified = work started, resolved = done.
const TONE_STEP = { pending: 1, verified: 2, resolved: 3 }
const STATUS_OPTIONS = [{ key: 'verified', label: 'In progress' }, { key: 'resolved', label: 'Resolved' }]
const steps = [
  { id: 1, label: 'Assigned' },
  { id: 2, label: 'In progress' },
  { id: 3, label: 'Resolved' },
]

export default function StaffHome() {
  const { t } = useLanguage()
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [staffName, setStaffName] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [isOnDuty, setIsOnDuty] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showNavModal, setShowNavModal] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [updateForm, setUpdateForm] = useState({ remarks: '', eta: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    loadAssignedReports()
      .then((rows) => {
        if (active) setReports(rows)
      })
      .catch(() => {
        if (active) {
          setReports([])
          setLoadError('We could not load your assigned reports. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    if (supabase) {
      supabase.auth.getUser().then(async ({ data: authData }) => {
        const user = authData?.user
        if (!user || !active) return
        const metaName = user.user_metadata?.full_name || ''
        setStaffName(metaName)
        const { data } = await supabase
          .from('users')
          .select('id, full_name, team_id, teams:team_id(id, name)')
          .eq('id', user.id)
          .maybeSingle()
        if (data && active) {
          const resolvedName = data.full_name || metaName
          setStaffName(resolvedName)
          setUserProfile({
            id: data.id,
            fullName: resolvedName,
            teamId: data.team_id,
            teamName: data.teams?.name || '',
          })
        }
      })
    }

    return () => {
      active = false
    }
  }, [reloadKey])

  // Hero card: the first started job, else the newest assignment awaiting start.
  const currentJob = useMemo(
    () => reports.find((r) => r.tone === 'verified') ?? reports.find((r) => r.tone === 'pending') ?? null,
    [reports],
  )
  const otherJobs = useMemo(
    () => reports.filter((r) => r.id !== currentJob?.id),
    [reports, currentJob],
  )
  const step = currentJob ? (TONE_STEP[currentJob.tone] ?? 1) : 0

  const handleSetStatus = async (statusKey) => {
    if (isSubmitting || !currentJob) return
    setIsSubmitting(true)

    try {
      // Keep the job on this account (the RLS policy requires it anyway).
      await updateReportStatus(
        currentJob.id,
        statusKey,
        currentJob.assignedStaffId,
        statusKey === 'resolved' && evidenceFiles.length > 0
          ? evidenceFiles.map((file) => ({ file, label: 'Resolution evidence', type: file.type }))
          : [],
        {
          staffRemarks: updateForm.remarks.trim(),
          restorationEta: updateForm.eta.trim(),
          staffName: userProfile?.fullName || staffName,
          teamName: userProfile?.teamName,
          assignedTeamId: currentJob.assignedTeamId,
        },
      )
      setEvidenceFiles([])
      setUpdateForm({ remarks: '', eta: '' })
      setShowStatusModal(false)
      reload()
      showToast(statusKey === 'resolved' ? t('Marked as resolved. Great work!') : t('Status updated: In progress.'))
    } catch {
      showToast(t('We could not update this report. Check your connection and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentDestination = currentJob
    ? currentJob.coordinates
      ? `${currentJob.coordinates.latitude},${currentJob.coordinates.longitude}`
      : `Valencia City Bukidnon Brgy. ${currentJob.barangay}`
    : ''

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
            <img src={powerWatchLogo} alt="" className="size-9 shrink-0 rounded-xl shadow-xs" aria-hidden="true" />
            <div>
              <span className="block text-[9.5px] font-extrabold uppercase tracking-[.14em] text-brand-muted">
                {t('STAFF PORTAL')}
              </span>
              <span className="block text-base font-black tracking-[-.03em] text-brand-navy">
                PowerWatch
              </span>
            </div>
          </a>

          {/* Notification Button */}
          <StaffNotificationsButton assignedReports={reports} />
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* USER GREETING */}
        <section className="mb-4">
          <h1 className="text-3xl font-black tracking-tight text-brand-navy">
            {t('Hello, {name}', { name: staffName || t('Crew') })}
          </h1>
          <p className="text-xs font-semibold text-brand-muted mt-0.5">Valencia City</p>
        </section>

        {/* ON DUTY STATUS CARD */}
        <section className="mb-5 rounded-2xl border border-brand-line bg-white p-3.5 shadow-[0_4px_16px_rgba(23,43,104,0.04)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  isOnDuty
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.5)]'
                    : 'bg-brand-line'
                }`}
              />
              <span className="text-sm font-extrabold text-brand-navy">
                {isOnDuty ? t('On duty') : t('Off duty')}
              </span>
            </div>
            <p className="text-xs text-brand-muted font-medium mt-0.5">
              {isOnDuty ? t('Sharing location with dispatch') : t('Location sharing paused')}
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
              showToast(next ? t('You are now marked ON DUTY') : t('You are now marked OFF DUTY'))
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOnDuty ? 'bg-brand-blue' : 'bg-brand-line'
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
        {isLoading && (
          <section className="mb-6 rounded-3xl border border-brand-line bg-white p-8 text-center">
            <p className="text-sm font-semibold text-brand-muted">{t('Loading your current job…')}</p>
          </section>
        )}

        {!isLoading && loadError && (
          <section className="mb-6 rounded-3xl border border-brand-line bg-white p-8 text-center">
            <p className="text-sm font-bold text-[#b42318]">{t(loadError)}</p>
            <button type="button" onClick={reload} className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer">
              {t('Try again')}
            </button>
          </section>
        )}

        {!isLoading && !loadError && currentJob && (
          <section className="relative mb-6 overflow-hidden rounded-3xl bg-brand-blue p-5 text-white shadow-[0_10px_25px_rgba(27,61,143,0.25)]">
            {/* Subtle Decorative Curves */}
            <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-4 -top-4 size-32 rounded-full border border-white/10" />

            {/* Top Badge & Reference Code */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-black text-brand-navy shadow-xs">
                <Zap className="size-3 fill-current" />
                <span>{t('Current job')}</span>
              </span>
              <span className="font-mono text-xs font-bold text-brand-line tracking-wide">
                {currentJob.id}
              </span>
            </div>

            {/* Job Title */}
            <h2 className="relative z-10 mt-3 text-xl font-black leading-snug tracking-tight text-white max-w-[20ch]">
              {currentJob.outageType}
            </h2>

            {/* Location line */}
            <div className="relative z-10 mt-2 flex items-center gap-1.5 text-xs font-medium text-[#e5e9f6]">
              <MapPin className="size-3.5 text-brand-yellow shrink-0" />
              <span className="truncate">
                {currentJob.barangay ? t('Brgy. {barangay}', { barangay: currentJob.barangay }) : currentJob.location}
                {currentJob.pinnedLocation ? ` · ${currentJob.pinnedLocation}` : currentJob.landmark ? ` · ${currentJob.landmark}` : ''}
              </span>
            </div>

            {/* Priority + Status badges */}
            <div className="relative z-10 mt-3 flex items-center gap-1.5">
              <ReportPriorityBadge priority={currentJob.priority} />
              <ReportStatusBadge tone={currentJob.tone} status={currentJob.status} />
            </div>

            {/* 3-Stage Progress Tracker */}
            <div className="relative z-10 mt-5 pt-1">
              <div className="relative flex items-center justify-between">
                {/* Background Line */}
                <div className="absolute left-3 right-3 top-3.5 h-[2px] bg-white/20 -z-0" />
                {/* Active Progress Line */}
                <div
                  className="absolute left-3 top-3.5 h-[2px] bg-brand-yellow transition-all duration-300 -z-0"
                  style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((stg) => {
                  const isPassed = step > stg.id
                  const isCurrent = step === stg.id

                  return (
                    <div key={stg.id} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`grid size-7 place-items-center rounded-full text-xs font-black transition-all ${
                          isPassed
                            ? 'bg-brand-yellow text-brand-navy'
                            : isCurrent
                            ? 'bg-white text-brand-navy ring-2 ring-brand-yellow shadow-sm'
                            : 'bg-brand-blue border border-white/40 text-white/70'
                        }`}
                      >
                        {isPassed ? <Check className="size-3.5 stroke-[3]" /> : stg.id}
                      </div>
                      <span
                        className={`mt-1.5 text-[10px] font-extrabold whitespace-nowrap ${
                          isCurrent ? 'text-white' : isPassed ? 'text-brand-yellow' : 'text-white/60'
                        }`}
                      >
                        {t(stg.label)}
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
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-xs sm:text-sm font-bold text-brand-blue shadow-xs hover:bg-brand-paper active:scale-[0.98] transition-all cursor-pointer"
              >
                <Navigation className="size-4 rotate-45" />
                <span>{t('Navigate')}</span>
              </button>

              {/* Update Status Button */}
              <button
                type="button"
                onClick={() => {
                  setUpdateForm({ remarks: currentJob.staffRemarks || '', eta: currentJob.restorationEta || '' })
                  setShowStatusModal(true)
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-brand-yellow text-xs sm:text-sm font-black text-brand-navy shadow-xs hover:bg-brand-yellow active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{t('Update status')}</span>
              </button>
            </div>
          </section>
        )}

        {!isLoading && !loadError && !currentJob && (
          <section className="mb-6 rounded-3xl border border-dashed border-brand-line bg-white p-8 text-center">
            <p className="text-sm font-bold text-brand-navy">{t('No active job right now')}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {t('Assignments appear here the moment an administrator assigns a report to you.')}
            </p>
          </section>
        )}

        {/* ASSIGNED TO YOU SECTION */}
        <section>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="text-base font-black text-brand-navy">{t('Assigned to you')}</h2>
            <span className="text-xs font-bold text-brand-muted">{t('{count} jobs', { count: reports.length })}</span>
          </div>

          <div className="space-y-3">
            {otherJobs.map((report) => (
              <a
                key={report.id}
                href="/staff/jobs"
                className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-3.5 shadow-xs hover:border-brand-line active:scale-[0.99] transition-all no-underline"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e5e9f6] text-brand-blue">
                    <ClipboardList className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-brand-navy truncate leading-tight">
                      {report.outageType}
                    </h3>
                    <p className="text-xs text-brand-muted font-medium truncate mt-0.5">
                      {report.barangay ? t('Brgy. {barangay}', { barangay: report.barangay }) : report.location} · {t('Noticed {time}', { time: report.startedTime || report.date })}
                    </p>
                  </div>
                </div>

                <div className="ml-2 flex shrink-0 items-center gap-1.5">
                  <ReportPriorityBadge priority={report.priority} />
                  <ReportStatusBadge tone={report.tone} status={report.status} />
                </div>
              </a>
            ))}

            {!isLoading && !loadError && otherJobs.length === 0 && reports.length > 0 && (
              <p className="px-1 text-xs text-brand-muted">{t("That's everything — your current job is the only one assigned to you.")}</p>
            )}

            {!isLoading && !loadError && reports.length === 0 && (
              <div className="rounded-3xl border border-dashed border-brand-line p-6 text-center text-xs text-brand-muted">
                {t('No jobs assigned to you yet.')}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && currentJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  {currentJob.id}
                </span>
                <h3 className="text-base font-extrabold text-brand-navy">{t('Update Job Status')}</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowStatusModal(false); setEvidenceFiles([]) }}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 pt-4">
              <StaffUpdateFields value={updateForm} onChange={setUpdateForm} disabled={isSubmitting} />
              {STATUS_OPTIONS.map((option) => {
                const current = currentJob.tone === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSetStatus(option.key)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-bold transition-all cursor-pointer border disabled:opacity-60 ${
                      current
                        ? 'border-brand-blue bg-[#e5e9f6] text-brand-blue'
                        : 'border-brand-line bg-white text-brand-ink hover:bg-brand-paper'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
                          current ? 'bg-brand-blue text-white' : 'bg-[#e5e9f6] text-brand-muted'
                        }`}
                      >
                        {option.key === 'resolved' ? 3 : 2}
                      </span>
                      <span>{t(option.label)}</span>
                    </span>
                    {current && <Check className="size-4 text-brand-blue" />}
                  </button>
                )
              })}
              <ResolutionEvidenceInput files={evidenceFiles} onChange={setEvidenceFiles} disabled={isSubmitting} />
              {isSubmitting && (
                <p className="pt-1 text-center text-[11px] font-semibold text-brand-muted">{t('Updating…')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION MODAL */}
      {showNavModal && currentJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h3 className="text-base font-extrabold text-brand-navy">{t('Directions to Site')}</h3>
              <button
                type="button"
                onClick={() => setShowNavModal(false)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-brand-line bg-brand-paper p-3.5">
                <span className="text-[10px] font-bold uppercase text-brand-muted">{t('Destination')}</span>
                <p className="font-extrabold text-brand-navy text-sm mt-0.5">
                  {currentJob.barangay ? t('Brgy. {barangay}', { barangay: currentJob.barangay }) : currentJob.location}
                  {currentJob.pinnedLocation ? ` · ${currentJob.pinnedLocation}` : ''}
                </p>
                <p className="text-brand-muted mt-1 font-medium">
                  {currentJob.coordinates
                    ? t('Using the GPS pin the resident captured{accuracy}.', {
                        accuracy: currentJob.coordinates.accuracy ? ` (±${Math.round(currentJob.coordinates.accuracy)} m)` : '',
                      })
                    : t('No GPS pin — directions search the barangay name.')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/staff/map?job=${encodeURIComponent(currentJob.id)}`}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-blue font-bold text-white shadow-xs hover:bg-brand-navy"
                >
                  <Navigation className="size-3.5" />
                  <span>{t('Navigate in app')}</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentDestination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-brand-line font-bold text-brand-ink hover:bg-brand-paper"
                >
                  <ExternalLink className="size-3.5" />
                  <span>{t('Google Maps')}</span>
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
