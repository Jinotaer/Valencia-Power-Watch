import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import {
  ReportPriorityBadge,
  ReportStatusBadge,
  ReportTimeline,
} from '../../resident/reportView'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../ui/dialog'
import { Separator } from '../../ui/separator'
import { ReportEvidenceGallery } from './ReportEvidenceGallery'
import { ReportLocationMap } from './ReportLocationMap'
import { recommendDispatchAndEta } from '../../../lib/adminAiAssistant'

function formatShortDateTime(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ReportDetailsGrid({
  report,
  assignedStaffName,
  assignedTeamName,
  resolvedByName,
}) {
  const submittedFormatted = formatShortDateTime(report.createdAt, report.date || 'Unknown')
  const noticedText = report.startedTime || report.date || 'Not specified'
  const statusKey = String(report.status ?? '').toLowerCase()
  const resolvedFormatted =
    statusKey === 'resolved' && report.resolvedAt
      ? formatShortDateTime(report.resolvedAt, null)
      : null

  const isGps = report.pinSource === 'gps'
  const gpsAccuracy = report.coordinates?.accuracy ? Math.round(report.coordinates.accuracy) : null
  const responderLabel = resolvedByName || assignedStaffName

  return (
    <div className="@container overflow-hidden rounded-xl border border-brand-line/80 bg-brand-paper/35 divide-y divide-brand-line/60">
      {/* Row 1: Reporter & Timeline */}
      <div className="grid grid-cols-1 gap-3 p-3.5 @[400px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] @[400px]:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            <User className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
            <span>Reported By</span>
          </div>
          <p className="mt-1 text-sm font-bold text-brand-navy break-words">
            {report.residentName || 'Unknown resident'}
          </p>
        </div>

        <dl className="space-y-1.5 text-xs">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 font-medium text-brand-muted">First noticed</dt>
            <dd className="text-right font-semibold tabular-nums text-brand-ink">
              {noticedText}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 font-medium text-brand-muted">Submitted</dt>
            <dd className="text-right font-semibold tabular-nums text-brand-ink">
              {submittedFormatted}
            </dd>
          </div>
          {resolvedFormatted && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 font-medium text-emerald-700">Resolved</dt>
              <dd className="text-right font-semibold tabular-nums text-emerald-800">
                {resolvedFormatted}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Row 2: Location & Geotag */}
      <div className="space-y-2.5 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
              Location
            </span>
            <span className="text-brand-line" aria-hidden="true">·</span>
            <span className="truncate text-sm font-bold text-brand-navy">
              {report.barangay ? `Brgy. ${report.barangay}` : 'Barangay not specified'}
            </span>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isGps
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span className={`size-1.5 shrink-0 rounded-full ${isGps ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isGps ? (gpsAccuracy ? `GPS Verified (±${gpsAccuracy}m)` : 'GPS Verified') : 'Manual Pin'}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-2.5 text-xs @[400px]:grid-cols-[minmax(0,0.75fr)_minmax(0,1.45fr)]">
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Nearest Landmark
            </dt>
            <dd className="mt-0.5 font-medium text-brand-ink break-words">
              {report.landmark || 'None provided'}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Pinned Address
            </dt>
            <dd className="mt-0.5 font-medium leading-snug text-brand-ink break-words">
              {report.pinnedLocation || 'Not provided'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Row 3: Field Assignment & Responder */}
      <div className="grid grid-cols-1 gap-3 p-3.5 @[400px]:grid-cols-2 @[400px]:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            <Truck className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
            <span>Field Team</span>
          </div>
          <div className="mt-1.5">
            {assignedTeamName ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue/25 bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue">
                <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{assignedTeamName}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {statusKey === 'rejected'
                  ? 'Not dispatched'
                  : statusKey === 'pending'
                  ? 'Pending verification'
                  : 'Awaiting Team Dispatch'}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            {resolvedByName ? 'Resolved By' : 'Assigned Lineman'}
          </div>
          <p className="mt-1.5 text-xs font-semibold text-brand-navy break-words">
            {responderLabel ||
              (assignedTeamName
                ? 'Team-wide dispatch'
                : statusKey === 'rejected'
                ? 'Closed'
                : 'Unassigned')}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ReportReviewDialog({
  selectedReport,
  onClose,
  staff,
  staffNames,
  staffId,
  setStaffId,
  teams = [],
  teamNames = {},
  teamId = '',
  setTeamId,
  isSubmitting,
  actionError,
  confirmingReject,
  setConfirmingReject,
  detectedClusters = [],
  onVerify,
  onReject,
  onAssignStaff,
  onDispatchTeam,
  onToggleDuplicateFlag,
}) {
  const [isGeneratingDispatch, setIsGeneratingDispatch] = useState(false)
  const [dispatchRecommendation, setDispatchRecommendation] = useState(null)

  if (!selectedReport) return null

  const statusKey = String(selectedReport.status ?? 'pending').toLowerCase()
  const matchedCluster = detectedClusters.find(
    (c) => c.masterReportId === selectedReport.id || c.duplicateIds?.includes(selectedReport.id),
  )
  const isMaster = matchedCluster?.masterReportId === selectedReport.id

  const resolvedByName =
    (selectedReport.resolvedByStaffId && staffNames[selectedReport.resolvedByStaffId]) ||
    selectedReport.photos?.find((photo) => photo.uploadedBy === 'staff' && photo.uploadedByName)
      ?.uploadedByName ||
    null

  const handleGetAiDispatch = async () => {
    if (isGeneratingDispatch || !selectedReport) return
    setIsGeneratingDispatch(true)
    try {
      const rec = await recommendDispatchAndEta({ report: selectedReport, availableStaff: staff })
      if (rec) {
        setDispatchRecommendation(rec)
        if (rec.recommendedStaffId && !staffId) {
          setStaffId(rec.recommendedStaffId)
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsGeneratingDispatch(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[94vw] md:max-w-[1240px] lg:max-w-[1300px] h-[min(820px,90vh)] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-2xl ring-0 flex flex-col">
        <div className="grid h-full min-h-0 w-full flex-1 grid-cols-1 md:grid-cols-[55%_45%] lg:grid-cols-[60%_40%] overflow-hidden">
          {/* Left Column: Interactive Map & Incident Geolocation */}
          <div className="relative z-0 h-64 md:h-full min-h-0 w-full overflow-hidden border-b border-brand-line bg-[#e5e9f6] md:border-b-0 md:border-r">
            <ReportLocationMap report={selectedReport} fill />
          </div>

          {/* Right Column: Incident Dossier, Operations & Dispatch Console */}
          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
            {/* Header: Core Ticket Identity & Status Lifecycle */}
            <header className="shrink-0 border-b border-brand-line bg-brand-paper/40 px-5 py-3.5 pr-12">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-auto rounded-md border-brand-line bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-brand-navy"
                  >
                    {selectedReport.id}
                  </Badge>
                  <ReportPriorityBadge priority={selectedReport.priority} />
                  <ReportStatusBadge
                    tone={selectedReport.tone}
                    status={selectedReport.status}
                  />
                  {selectedReport.isDuplicate && (
                    <Badge
                      variant="outline"
                      className="h-auto gap-1 rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                    >
                      <Flag className="size-2.5" aria-hidden="true" />
                      Duplicate
                    </Badge>
                  )}
                </div>

                <DialogTitle className="mt-2 text-xl font-bold leading-tight tracking-[-0.02em] text-brand-navy">
                  {selectedReport.outageType}
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                  <MapPin className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
                  <span className="truncate">
                    {selectedReport.location} · First noticed{' '}
                    {selectedReport.startedTime || selectedReport.date}
                  </span>
                </DialogDescription>

                {statusKey !== 'rejected' && (
                  <div className="mt-1">
                    <ReportTimeline progress={selectedReport.progress ?? 1} />
                  </div>
                )}
              </div>
            </header>

            {/* Scrollable Dossier Body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Duplicate Cluster Banner */}
              {matchedCluster && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                      <Sparkles className="size-3.5 text-amber-600" aria-hidden="true" />
                      AI Auto-Detected Duplicate Cluster ({Math.round(matchedCluster.confidence * 100)}% match)
                    </span>
                    <Badge className="bg-amber-200 text-amber-900 border-0 text-[10px] font-bold">
                      {isMaster ? 'Master Incident' : 'Duplicate Candidate'}
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {matchedCluster.reason}
                  </p>
                  {!selectedReport.isDuplicate && !isMaster && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/60">
                      <span className="font-mono text-[10px] text-amber-700">
                        Primary Incident: #{matchedCluster.masterReportId}
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        onClick={onToggleDuplicateFlag}
                        disabled={isSubmitting}
                        className="h-6 rounded-md bg-amber-600 px-2.5 text-[10px] font-bold text-white hover:bg-amber-700 cursor-pointer"
                      >
                        Flag as Duplicate
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Section 1: Incident Dossier Metadata */}
              <section>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                    Incident Dossier
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={onToggleDuplicateFlag}
                    disabled={isSubmitting}
                    className={`gap-1 rounded-lg px-2.5 text-[11px] font-bold cursor-pointer ${
                      selectedReport.isDuplicate
                        ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-ink'
                    }`}
                  >
                    <Flag className="size-3" aria-hidden="true" />
                    {selectedReport.isDuplicate
                      ? 'Remove duplicate flag'
                      : 'Flag as duplicate'}
                  </Button>
                </div>
                <div className="mt-2.5">
                  <ReportDetailsGrid
                    report={selectedReport}
                    assignedStaffName={staffNames[selectedReport.assignedStaffId]}
                    assignedTeamName={teamNames[selectedReport.assignedTeamId]}
                    resolvedByName={resolvedByName}
                  />
                </div>
              </section>

              <Separator className="bg-brand-line" />

              {/* Section 2: Resident Description & Notes */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                  Resident Description & Notes
                </h3>
                {selectedReport.notes ? (
                  <div className="mt-2 rounded-xl border border-brand-line/80 bg-brand-paper/35 p-3.5 text-xs font-medium leading-relaxed text-brand-ink whitespace-pre-wrap">
                    {selectedReport.notes}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-brand-muted italic">
                    No additional notes or description were provided by the resident.
                  </p>
                )}
              </section>

              {/* Section 3: Field Staff Updates (If Present) */}
              {(selectedReport.staffRemarks || selectedReport.restorationEta) && (
                <>
                  <Separator className="bg-brand-line" />
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      Field Staff Updates
                    </h3>
                    <div className="mt-2.5 rounded-xl border border-brand-blue/20 bg-[#e5e9f6]/50 p-3.5 space-y-1.5 text-xs">
                      {selectedReport.restorationEta && (
                        <p className="font-bold text-brand-navy">
                          Estimated Restoration: {selectedReport.restorationEta}
                        </p>
                      )}
                      {selectedReport.staffRemarks && (
                        <p className="whitespace-pre-wrap font-medium leading-relaxed text-brand-ink">
                          {selectedReport.staffRemarks}
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Section 4: Field Operations & Dispatch Command (When Verified) */}
              {statusKey === 'verified' && (
                <>
                  <Separator className="bg-brand-line" />
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        <Truck className="size-3.5 text-brand-blue" aria-hidden="true" />
                        Field Operations & Dispatch Command
                      </h3>
                      {selectedReport.assignedTeamId && teamNames[selectedReport.assignedTeamId] && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue">
                          <span className="size-2 rounded-full bg-brand-blue animate-pulse" />
                          Assigned to {teamNames[selectedReport.assignedTeamId]}
                        </span>
                      )}
                    </div>

                    {/* AI Smart Dispatch & Repair Guidance */}
                    <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 text-xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-bold text-brand-navy text-xs">
                          <Sparkles className="size-3.5 text-amber-600" aria-hidden="true" />
                          AI Smart Dispatch & Repair Guidance
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={handleGetAiDispatch}
                          disabled={isGeneratingDispatch}
                          className="h-6.5 gap-1 rounded-md border-amber-300 bg-white px-2.5 text-[10px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer shadow-2xs"
                        >
                          <Sparkles className={`size-3 ${isGeneratingDispatch ? 'animate-spin' : ''}`} aria-hidden="true" />
                          {isGeneratingDispatch ? 'Analyzing…' : dispatchRecommendation ? 'Re-analyze' : 'Analyze Dispatch'}
                        </Button>
                      </div>

                      {dispatchRecommendation ? (
                        <div className="space-y-2 pt-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-brand-navy">
                            <Clock className="size-3.5 text-brand-blue" aria-hidden="true" />
                            <span>Suggested Repair ETA: <strong className="text-amber-900">{dispatchRecommendation.suggestedEta}</strong></span>
                          </div>
                          <div className="rounded-lg border border-amber-200/60 bg-white/80 p-2.5 text-brand-ink leading-relaxed">
                            <p className="font-semibold text-brand-navy text-[11px]">Recommended Lineman Instructions:</p>
                            <p className="mt-0.5 text-xs text-brand-ink">{dispatchRecommendation.suggestedRemarks}</p>
                          </div>
                          <p className="text-[11px] text-brand-muted italic">
                            {dispatchRecommendation.reasoning}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-brand-muted leading-relaxed">
                          Click &ldquo;Analyze Dispatch&rdquo; to predict realistic restoration hours and generate technical instructions for the field team.
                        </p>
                      )}

                      <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-brand-muted">Need to notify residents?</span>
                        <a
                          href={`/admin/announcements?barangay=${encodeURIComponent(selectedReport.barangay || '')}&cause=${encodeURIComponent(selectedReport.outageType || '')}`}
                          className="inline-flex items-center gap-1 font-bold text-brand-blue hover:underline"
                        >
                          <Megaphone className="size-3" aria-hidden="true" />
                          Draft Public Advisory
                        </a>
                      </div>
                    </div>

                    {/* Dispatch Field Team Selection */}
                    <div className="rounded-xl border border-brand-line bg-brand-paper/30 p-4 space-y-3">
                      <div>
                        <label
                          htmlFor="assign-team-select"
                          className="block text-xs font-bold text-brand-navy"
                        >
                          {selectedReport.assignedTeamId ? 'Reassign Field Team' : 'Dispatch Field Team (Recommended)'}
                        </label>
                        <p className="mt-0.5 text-[11px] text-brand-muted">
                          Every technician in the assigned team will receive this dispatch, view route guidance, and submit resolution photos.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <select
                          id="assign-team-select"
                          value={teamId}
                          onChange={(event) => setTeamId(event.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                        >
                          <option value="">Select a field crew team…</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.memberCount || 0} crew · {t.activeJobCount || 0} active jobs)
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          onClick={onDispatchTeam}
                          disabled={isSubmitting || !teamId || teams.length === 0}
                          className="h-10 shrink-0 gap-1.5 rounded-xl bg-brand-blue px-5 text-xs font-bold text-white shadow-sm hover:bg-brand-navy cursor-pointer transition-colors"
                        >
                          <UsersIcon className="size-4" aria-hidden="true" />
                          <span>{selectedReport.assignedTeamId ? 'Reassign Team' : 'Dispatch Team'}</span>
                        </Button>
                      </div>

                      {/* Secondary: Individual staff assignment override */}
                      <div className="pt-2 border-t border-brand-line/60">
                        <details className="group">
                          <summary className="text-[11px] font-semibold text-brand-muted hover:text-brand-navy cursor-pointer select-none">
                            Or assign to a specific individual lineman
                          </summary>
                          <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
                            <select
                              id="assign-staff-select"
                              value={staffId}
                              onChange={(event) => setStaffId(event.target.value)}
                              className="h-9 min-w-0 flex-1 rounded-lg border border-brand-line bg-white px-2.5 text-xs font-medium text-brand-ink cursor-pointer"
                            >
                              <option value="">Select individual staff…</option>
                              {staff.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.full_name || member.email}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="button"
                              size="sm"
                              onClick={onAssignStaff}
                              disabled={isSubmitting || !staffId}
                              className="h-9 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Assign Staff
                            </Button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* Section 5: Attached Evidence */}
              <Separator className="bg-brand-line" />
              <section>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                    Attached Evidence ({selectedReport.photos?.length ?? 0})
                  </h3>
                  {(selectedReport.photos?.length ?? 0) > 0 && (
                    <span className="text-[11px] font-medium text-brand-muted">
                      Click photo to enlarge
                    </span>
                  )}
                </div>
                <ReportEvidenceGallery key={selectedReport.id} report={selectedReport} />
              </section>

              {/* Section 6: AI Evidence Security & Forensics */}
              {selectedReport.aiVerification && (
                <>
                  <Separator className="bg-brand-line" />
                  <section>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        <ShieldCheck className="size-3.5 text-brand-blue" aria-hidden="true" />
                        AI Evidence Security & Forensics
                      </h3>
                      <Badge
                        variant="outline"
                        className={`h-auto gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          selectedReport.aiVerification.isPowerRelated === false
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : selectedReport.aiVerification.isWebOrStockImage
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {selectedReport.aiVerification.isPowerRelated === false
                          ? 'Flagged: Non-Utility Media'
                          : selectedReport.aiVerification.isWebOrStockImage
                          ? 'Flagged: Web / Stock Photo'
                          : selectedReport.aiVerification.analysisMode === 'full_video' ||
                              selectedReport.aiVerification.analysisMode === 'video_keyframes'
                          ? 'AI Verified Field Video'
                          : selectedReport.aiVerification.analysisMode === 'mixed_media'
                          ? 'AI Verified Field Media'
                          : 'AI Verified Field Photo'}
                      </Badge>
                    </div>

                    <div className="mt-2.5 space-y-2.5 rounded-xl border border-brand-line/80 bg-brand-paper/35 p-3.5">
                      <dl className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                            Camera Device
                          </dt>
                          <dd
                            className="mt-0.5 truncate font-semibold text-brand-navy"
                            title={selectedReport.aiVerification.cameraDevice || ''}
                          >
                            {selectedReport.aiVerification.cameraDevice ||
                              (selectedReport.aiVerification.hasCameraMetadata
                                ? 'Live camera detected'
                                : selectedReport.aiVerification.analysisMode === 'full_video' ||
                                    selectedReport.aiVerification.analysisMode === 'video_keyframes'
                                ? 'Video clip (no image EXIF)'
                                : 'No camera EXIF (Web/App)')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                            AI Match Confidence
                          </dt>
                          <dd className="mt-0.5 font-semibold tabular-nums text-brand-navy">
                            {Math.round((selectedReport.aiVerification.confidence || 0.9) * 100)}% match
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                            Valencia Geofence
                          </dt>
                          <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-brand-navy">
                            {selectedReport.aiVerification.isWithinValencia === true ? (
                              <>
                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                                <span>Inside Valencia City</span>
                              </>
                            ) : selectedReport.aiVerification.isWithinValencia === false ? (
                              <>
                                <AlertTriangle className="size-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                                <span className="text-amber-800">Outside Valencia City</span>
                              </>
                            ) : (
                              <span>No GPS geotag in photo</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                            Evidence Age
                          </dt>
                          <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-brand-navy">
                            {selectedReport.aiVerification.isStale ? (
                              <>
                                <AlertTriangle className="size-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                                <span className="text-amber-800 tabular-nums">
                                  Stale ({selectedReport.aiVerification.ageHours}h old)
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                                <span>Fresh (&lt;24h)</span>
                              </>
                            )}
                          </dd>
                        </div>
                      </dl>

                      {selectedReport.aiVerification.rejectionReason && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] font-medium text-red-800">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-600" aria-hidden="true" />
                          <span>{selectedReport.aiVerification.rejectionReason}</span>
                        </div>
                      )}

                      {selectedReport.aiVerification.detectedComponents?.length > 0 && (
                        <p className="border-t border-brand-line/60 pt-2 text-[11px] text-brand-muted">
                          <strong className="text-brand-navy">Detected components:</strong>{' '}
                          {selectedReport.aiVerification.detectedComponents.join(', ')}
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Footer: Streamlined Action Bar & Status Notices */}
            <footer className="shrink-0 border-t border-brand-line bg-brand-paper/80 px-5 py-3">
              {statusKey === 'pending' && !confirmingReject && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-brand-muted leading-tight text-center sm:text-left">
                    Review incident evidence above, then verify to dispatch field crews.
                  </p>
                  <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setConfirmingReject(true)}
                      disabled={isSubmitting}
                      className="h-9 flex-1 sm:flex-initial gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-[#b42318] hover:bg-red-100 cursor-pointer"
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                      Reject report
                    </Button>
                    <Button
                      type="button"
                      onClick={onVerify}
                      disabled={isSubmitting}
                      className="h-9 flex-1 sm:flex-initial gap-1.5 rounded-xl bg-brand-blue px-5 text-xs font-bold text-white shadow-sm hover:bg-brand-navy cursor-pointer transition-colors"
                    >
                      <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                      Verify report
                    </Button>
                  </div>
                </div>
              )}

              {statusKey === 'pending' && confirmingReject && (
                <div className="rounded-xl border border-red-200 bg-red-50/90 p-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#b42318]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#b42318]">
                        Reject this outage report?
                      </p>
                      <p className="mt-0.5 text-[11px] text-red-900/80">
                        Rejected reports are closed immediately and will not be dispatched to field staff.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={onReject}
                          disabled={isSubmitting}
                          className="h-8 rounded-lg bg-[#b42318] px-3 text-xs font-bold text-white hover:bg-red-800 cursor-pointer"
                        >
                          {isSubmitting ? 'Rejecting…' : 'Confirm rejection'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmingReject(false)}
                          disabled={isSubmitting}
                          className="h-8 rounded-lg border-red-200 bg-white px-3 text-xs font-bold text-brand-ink hover:bg-brand-paper cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {statusKey === 'verified' && (
                <div className="flex items-center justify-between gap-3">
                  {selectedReport.assignedTeamId && teamNames[selectedReport.assignedTeamId] ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-navy">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        Dispatched to <strong>{teamNames[selectedReport.assignedTeamId]}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                      <AlertCircle className="size-4 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>Awaiting team dispatch — select a field crew in the dossier above.</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="h-8.5 rounded-lg px-4 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              )}

              {statusKey === 'resolved' && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>
                      Resolved
                      {selectedReport.assignedTeamId && teamNames[selectedReport.assignedTeamId]
                        ? ` by ${teamNames[selectedReport.assignedTeamId]}${resolvedByName ? ` (${resolvedByName})` : ''}`
                        : resolvedByName
                        ? ` by ${resolvedByName}`
                        : ''}{' '}
                      — power restored.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="h-8.5 rounded-lg px-4 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              )}

              {statusKey === 'rejected' && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#b42318]">
                    <XCircle className="size-4 shrink-0 text-[#b42318]" aria-hidden="true" />
                    <span>Rejected — this report is closed and requires no dispatch.</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="h-8.5 rounded-lg px-4 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              )}

              {actionError && (
                <p
                  role="alert"
                  className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]"
                >
                  {actionError}
                </p>
              )}
            </footer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
