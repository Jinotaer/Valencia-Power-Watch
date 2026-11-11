import {
  AlertTriangle,
  Check,
  ExternalLink,
  MapPin,
  Navigation,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { loadAssignedReports, priorityLabels, updateReportStatus } from '../../lib/reports'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../lib/i18n'
import { ResolutionEvidenceInput } from '../../components/staff/evidenceInput'
import { StaffNotificationsButton } from '../../components/staff/notificationsModal'
import { StaffUpdateFields } from '../../components/staff/updateFields'
import { EvidenceGallery, LinkedReports, StaffActivityRecord } from '../../components/staff/jobDetails'
import { ReportPriorityBadge, ReportStatusBadge } from '../../components/resident/reportView'

// Staff milestones map onto the shared report statuses (see supabase/report.sql):
// a pending assignment is still new, "verified" means work started, "resolved" is done.
const TONE_TYPE = { pending: 'new', verified: 'active', resolved: 'done' }
const TONE_STEP = { pending: 1, verified: 2, resolved: 3 }
const TONE_LABEL = {
  pending: 'Step 1 of 3 · Assigned — awaiting start',
  verified: 'Step 2 of 3 · In progress',
  resolved: 'Step 3 of 3 · Resolved',
}
const STATUS_OPTIONS = [{ key: 'verified', label: 'In progress' }, { key: 'resolved', label: 'Resolved' }]

// The stages the staff page offers, keyed to report statuses.
const stageKey = (tone) => (tone === 'resolved' ? 'resolved' : 'verified')

export default function StaffJobs() {
  const { t } = useLanguage()
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('all') // 'all' | 'new' | 'active' | 'done'
  const [reviewJob, setReviewJob] = useState(null)
  const [statusJob, setStatusJob] = useState(null)
  const [navJob, setNavJob] = useState(null)
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [updateForm, setUpdateForm] = useState({ remarks: '', eta: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [userProfile, setUserProfile] = useState(null)

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

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true

    supabase.auth.getUser().then(async ({ data: authData }) => {
      const user = authData?.user
      if (!user || !active) return
      const metaName = user.user_metadata?.full_name || ''
      const { data } = await supabase
        .from('users')
        .select('id, full_name, team_id, teams:team_id(id, name)')
        .eq('id', user.id)
        .maybeSingle()

      if (data && active) {
        setUserProfile({
          id: data.id,
          fullName: data.full_name || metaName,
          teamId: data.team_id,
          teamName: data.teams?.name || '',
        })
      }
    })

    return () => {
      active = false
    }
  }, [])

  const counts = useMemo(() => {
    const newCount = reports.filter((r) => r.tone === 'pending').length
    const activeCount = reports.filter((r) => r.tone === 'verified').length
    const doneCount = reports.filter((r) => r.tone === 'resolved').length
    return { all: newCount + activeCount, new: newCount, active: activeCount, done: doneCount }
  }, [reports])

  const filteredJobs = useMemo(() => {
    const byFilter = {
      all: reports.filter((r) => r.tone !== 'resolved'),
      new: reports.filter((r) => r.tone === 'pending'),
      active: reports.filter((r) => r.tone === 'verified'),
      done: reports.filter((r) => r.tone === 'resolved'),
    }
    return byFilter[filter] ?? reports
  }, [reports, filter])

  const handleSetStatus = async (report, statusKey) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Keep the job on this account (the RLS policy requires it anyway).
      await updateReportStatus(
        report.id,
        statusKey,
        report.assignedStaffId,
        statusKey === 'resolved' && evidenceFiles.length > 0
          ? evidenceFiles.map((file) => ({ file, label: 'Resolution evidence', type: file.type }))
          : [],
        {
          staffRemarks: updateForm.remarks.trim(),
          restorationEta: updateForm.eta.trim(),
          staffName: userProfile?.fullName,
          teamName: userProfile?.teamName,
          assignedTeamId: report.assignedTeamId,
        },
      )
      setEvidenceFiles([])
      setUpdateForm({ remarks: '', eta: '' })
      setStatusJob(null)
      reload()
      showToast(statusKey === 'resolved' ? t('Marked as resolved. Great work!') : t('Status updated: In progress.'))
    } catch {
      showToast(t('We could not update this report. Check your connection and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const jobs = filteredJobs
  const openStatus = (report) => {
    setUpdateForm({ remarks: report.staffRemarks || '', eta: report.restorationEta || '' })
    setStatusJob(report)
  }
  const destination = (report) =>
    report.coordinates
      ? `${report.coordinates.latitude},${report.coordinates.longitude}`
      : `Valencia City Bukidnon Brgy. ${report.barangay}`

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

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5 flex-1">
        {/* Page Heading */}
        <section className="mb-4">
          <h1 className="text-3xl font-black tracking-tight text-brand-navy">{t('Jobs')}</h1>
          <p className="text-xs font-semibold text-brand-muted mt-0.5">{t('Your assigned work orders.')}</p>
        </section>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'new', label: 'New', count: counts.new },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'done', label: 'Done', count: counts.done },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                filter === option.key
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
              }`}
            >
              {t(option.label)} {option.count}
            </button>
          ))}
        </div>

        {/* JOBS LIST */}
        <div className="space-y-4">
          {isLoading && (
            <div className="rounded-3xl border border-brand-line bg-white p-8 text-center">
              <p className="text-sm font-semibold text-brand-muted">{t('Loading your assigned jobs…')}</p>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="rounded-3xl border border-brand-line bg-white p-8 text-center">
              <p className="text-sm font-bold text-[#b42318]">{t(loadError)}</p>
              <button type="button" onClick={reload} className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer">
                {t('Try again')}
              </button>
            </div>
          )}

          {!isLoading && !loadError && jobs.map((report) => {
            const statusType = TONE_TYPE[report.tone] ?? 'active'
            const step = TONE_STEP[report.tone] ?? 1
            const isDone = statusType === 'done'

            return (
              <article
                key={report.id}
                className="rounded-3xl border border-brand-line bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(23,43,104,0.04)]"
              >
                {/* Header: Title + Priority + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-extrabold leading-snug text-brand-navy">
                    {report.outageType}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ReportPriorityBadge priority={report.priority} />
                    <ReportStatusBadge tone={report.tone} status={report.status} />
                  </div>
                </div>

                {/* Location Line */}
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                  <MapPin className="size-3.5 shrink-0 text-brand-blue" />
                  <span className="truncate">
                    {report.barangay ? t('Brgy. {barangay}', { barangay: report.barangay }) : report.location}
                    {report.pinnedLocation ? ` · ${report.pinnedLocation}` : report.landmark ? ` · ${report.landmark}` : ''}
                  </span>
                </div>

                {/* Order ID & Report Time */}
                <div className="mt-1 flex items-center text-xs font-medium text-brand-muted">
                  <span>
                    {report.id} · {t('Noticed {time}', { time: report.startedTime || report.date })}
                  </span>
                </div>

                {/* 3-Segment Progress Bar */}
                <div className="mt-3 flex items-center gap-1.5">
                  {[1, 2, 3].map((seg) => (
                    <div
                      key={seg}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        step >= seg ? 'bg-brand-blue' : 'bg-brand-line'
                      }`}
                    />
                  ))}
                </div>

                {/* Step Subtitle Caption */}
                <p className="mt-1.5 text-[11px] font-semibold text-brand-muted">{t(TONE_LABEL[report.tone])}</p>

                {/* Action Buttons Row */}
                {isDone ? (
                  <button
                    type="button"
                    onClick={() => setReviewJob(report)}
                    className="mt-4 flex h-10 w-full items-center justify-center rounded-xl border border-brand-line bg-white text-xs font-bold text-brand-muted hover:bg-brand-paper transition-all cursor-pointer"
                  >
                    {t('View resolution summary')}
                  </button>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewJob(report)}
                      className="flex h-11 items-center justify-center rounded-2xl border border-brand-line bg-white text-xs font-bold text-brand-ink shadow-xs hover:bg-brand-paper active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>{t('Details')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNavJob(report)}
                      className="flex h-11 items-center justify-center gap-1 rounded-2xl border border-brand-line bg-white text-xs font-bold text-brand-blue shadow-xs hover:bg-brand-paper active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Navigation className="size-3.5 rotate-45" />
                      <span>{t('Navigate')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openStatus(report)}
                      className="flex h-11 items-center justify-center rounded-2xl bg-brand-blue text-xs font-bold text-white shadow-xs hover:bg-brand-navy active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>{t('Status')}</span>
                    </button>
                  </div>
                )}
              </article>
            )
          })}

          {!isLoading && !loadError && jobs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-brand-line p-8 text-center text-xs text-brand-muted">
              {reports.length === 0
                ? t('Nothing assigned to you yet. Reports appear here once an administrator assigns them.')
                : t('No jobs found under this filter.')}
            </div>
          )}
        </div>
      </main>

      {/* REVIEW / DETAILS MODAL */}
      {reviewJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-start justify-between border-b border-brand-line pb-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  {reviewJob.id}
                </span>
                <h3 className="text-base font-extrabold text-brand-navy">{reviewJob.outageType}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <ReportPriorityBadge priority={reviewJob.priority} />
                  <ReportStatusBadge tone={reviewJob.tone} status={reviewJob.status} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewJob(null)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <dl className="grid gap-3 pt-4 text-xs">
              {[
                ['Reported by', reviewJob.residentName || t('Unknown resident')],
                ['Barangay', reviewJob.barangay ? t('Brgy. {barangay}', { barangay: reviewJob.barangay }) : '—'],
                ['Landmark', reviewJob.landmark || '—'],
                ['Pinned location', reviewJob.pinnedLocation || '—'],
                ['Priority', t(priorityLabels[reviewJob.priority] ?? 'Medium')],
                ['Noticed', reviewJob.startedTime || reviewJob.date || '—'],
                ['Submitted', reviewJob.date || '—'],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] gap-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-muted pt-0.5">{t(label)}</dt>
                  <dd className="font-semibold text-brand-muted break-words">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 border-t border-brand-line pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('Resident notes')}</span>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-brand-muted">
                {reviewJob.notes || t('No notes were added.')}
              </p>
            </div>

            {!reviewJob.coordinates && (
              <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-[#fff1a8] p-3 text-[11px] font-semibold text-[#9a6500]">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {t('No GPS pin was captured — navigate by the barangay and landmark.')}
              </p>
            )}

            <EvidenceGallery photos={reviewJob.photos} />
            <StaffActivityRecord report={reviewJob} />
            <LinkedReports report={reviewJob} reports={reports} />

            {reviewJob.tone !== 'resolved' && (
              <button
                type="button"
                onClick={() => {
                  openStatus(reviewJob)
                  setReviewJob(null)
                }}
                className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-brand-blue text-xs font-bold text-white hover:bg-brand-navy cursor-pointer"
              >
                {t('Update status')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {statusJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  {statusJob.id}
                </span>
                <h3 className="text-base font-extrabold text-brand-navy">{t('Update Job Status')}</h3>
              </div>
              <button
                type="button"
                onClick={() => { setStatusJob(null); setEvidenceFiles([]) }}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto space-y-2 pt-4">
              <StaffUpdateFields value={updateForm} onChange={setUpdateForm} disabled={isSubmitting} />
              {STATUS_OPTIONS.map((option) => {
                const current = option.key === stageKey(statusJob.tone)
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSetStatus(statusJob, option.key)}
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
      {navJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h3 className="text-base font-extrabold text-brand-navy">{t('Directions to Site')}</h3>
              <button
                type="button"
                onClick={() => setNavJob(null)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-brand-line bg-brand-paper p-3.5">
                <span className="text-[10px] font-bold uppercase text-brand-muted">{t('Destination')}</span>
                <p className="font-extrabold text-brand-navy text-sm mt-0.5">
                  {navJob.barangay ? t('Brgy. {barangay}', { barangay: navJob.barangay }) : navJob.location}
                  {navJob.pinnedLocation ? ` · ${navJob.pinnedLocation}` : ''}
                </p>
                <p className="text-brand-muted mt-1 font-medium">
                  {navJob.coordinates
                    ? t('Using the GPS pin the resident captured{accuracy}.', {
                        accuracy: navJob.coordinates.accuracy ? ` (±${Math.round(navJob.coordinates.accuracy)} m)` : '',
                      })
                    : t('No GPS pin — directions search the barangay name.')}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`/staff/map?job=${encodeURIComponent(navJob.id)}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 font-bold text-white shadow-xs hover:bg-brand-navy"
                >
                  <Navigation className="size-3.5" />
                  <span>{t('Navigate in app')}</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination(navJob))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-brand-line py-2.5 font-bold text-brand-ink hover:bg-brand-paper"
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
