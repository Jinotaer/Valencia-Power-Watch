import {
  Check,
  CheckCircle2,
  Flag,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react'
import { priorityLabels } from '../../../lib/reports'
import {
  ReportPriorityBadge,
  ReportStatusBadge,
  ReportTimeline,
} from '../../resident/reportView'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../ui/dialog'
import { Separator } from '../../ui/separator'
import { ReportEvidenceGallery } from './ReportEvidenceGallery'
import { ReportLocationMap } from './ReportLocationMap'

export function ReportDetailsGrid({ report, assignedStaffName }) {
  const submittedFormatted = report.createdAt
    ? new Date(report.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : report.date || 'Unknown'

  const rows = [
    ['Reported by', report.residentName || 'Unknown resident'],
    ['Barangay', report.barangay ? `Brgy. ${report.barangay}` : 'Not specified'],
    ['Outage type', report.outageType || 'Power interruption'],
    ['Priority level', priorityLabels[report.priority] ?? report.priority ?? 'Medium'],
    ['First noticed', report.startedTime || report.date || 'Not provided'],
    ['Submitted on', submittedFormatted],
    ['Pinned address', report.pinnedLocation || 'Not provided'],
    ['Nearest landmark', report.landmark || 'Not provided'],
    [
      'Location source',
      report.pinSource === 'gps'
        ? `GPS (${report.coordinates?.accuracy ? `±${Math.round(report.coordinates.accuracy)} m` : 'verified'})`
        : 'Placed manually on map',
    ],
    ['Assigned field staff', assignedStaffName || 'Unassigned'],
  ]

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-xl border border-brand-line/80 bg-brand-paper/40 p-3.5 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            {label}
          </dt>
          <dd className="mt-0.5 truncate text-xs font-semibold text-brand-ink" title={String(value)}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function ReportReviewDialog({
  selectedReport,
  onClose,
  staff,
  staffNames,
  staffId,
  setStaffId,
  isSubmitting,
  actionError,
  confirmingReject,
  setConfirmingReject,
  onVerify,
  onReject,
  onAssignStaff,
  onToggleDuplicateFlag,
}) {
  if (!selectedReport) return null

  const statusKey = String(selectedReport.status ?? 'pending').toLowerCase()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl border border-brand-line bg-white p-0 shadow-2xl ring-0 sm:max-w-[1080px] md:overflow-hidden">
        <div className="grid min-h-[620px] grid-cols-1 md:h-[min(720px,92vh)] md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-0 h-72 w-full overflow-hidden border-b border-brand-line bg-[#e5e9f6] md:h-full md:border-b-0 md:border-r">
            <ReportLocationMap report={selectedReport} fill />
          </div>

          <div className="flex min-h-0 flex-col md:h-full">
            <header className="shrink-0 border-b border-brand-line bg-brand-paper/40 px-5 py-4 pr-12">
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

                <DialogTitle className="mt-2 text-lg font-bold leading-tight text-brand-navy">
                  {selectedReport.outageType}
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                  <MapPin className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
                  <span className="truncate">
                    {selectedReport.location} · Noticed{' '}
                    {selectedReport.startedTime || selectedReport.date}
                  </span>
                </DialogDescription>

                {statusKey !== 'rejected' && (
                  <ReportTimeline progress={selectedReport.progress ?? 1} />
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                    Incident Metadata
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
                  />
                </div>
              </section>

              <Separator className="bg-brand-line" />

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                  Resident Description & Notes
                </h3>
                <Card
                  size="sm"
                  className="mt-2 rounded-xl border border-brand-line/80 bg-brand-paper/40 py-3.5 ring-0"
                >
                  <CardContent className="px-3.5">
                    <p className="whitespace-pre-wrap text-xs font-medium leading-5 text-brand-ink">
                      {selectedReport.notes || 'No additional notes were provided by the resident.'}
                    </p>
                  </CardContent>
                </Card>
              </section>

              {(selectedReport.staffRemarks || selectedReport.restorationEta) && (
                <>
                  <Separator className="bg-brand-line" />
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      Field Staff Updates
                    </h3>
                    <Card
                      size="sm"
                      className="mt-2 rounded-xl border border-brand-blue/20 bg-[#e5e9f6]/50 py-3.5 ring-0"
                    >
                      <CardContent className="space-y-1.5 px-3.5 text-xs">
                        {selectedReport.restorationEta && (
                          <p className="font-bold text-brand-navy">
                            Estimated Restoration: {selectedReport.restorationEta}
                          </p>
                        )}
                        {selectedReport.staffRemarks && (
                          <p className="whitespace-pre-wrap font-medium leading-5 text-brand-ink">
                            {selectedReport.staffRemarks}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </section>
                </>
              )}

              {selectedReport.aiVerification && (
                <>
                  <Separator className="bg-brand-line" />
                  <section>
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        <ShieldCheck className="size-3.5 text-brand-blue" />
                        AI Evidence Security & Forensics
                      </h3>
                      <Badge
                        variant="outline"
                        className={`h-auto gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
                          : 'AI Verified Field Photo'}
                      </Badge>
                    </div>

                    <div className="mt-2.5 space-y-2.5 rounded-xl border border-brand-line/80 bg-brand-paper/40 p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-brand-muted">Camera Device</span>
                          <p className="truncate font-semibold text-brand-navy" title={selectedReport.aiVerification.cameraDevice || ''}>
                            {selectedReport.aiVerification.cameraDevice ||
                              (selectedReport.aiVerification.hasCameraMetadata
                                ? 'Live camera detected'
                                : 'No camera EXIF (Web/App)')}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-brand-muted">AI Match Confidence</span>
                          <p className="font-semibold text-brand-navy">
                            {Math.round((selectedReport.aiVerification.confidence || 0.9) * 100)}% match
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-brand-muted">Valencia Geofence</span>
                          <p className="font-semibold text-brand-navy">
                            {selectedReport.aiVerification.isWithinValencia === true
                              ? '✓ Inside Valencia City'
                              : selectedReport.aiVerification.isWithinValencia === false
                              ? '⚠️ Outside Valencia City'
                              : 'No GPS geotag in photo'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-brand-muted">Evidence Age</span>
                          <p className="font-semibold text-brand-navy">
                            {selectedReport.aiVerification.isStale
                              ? `⚠️ Stale (${selectedReport.aiVerification.ageHours}h old)`
                              : '✓ Fresh (<24h)'}
                          </p>
                        </div>
                      </div>

                      {selectedReport.aiVerification.rejectionReason && (
                        <div className="rounded-lg bg-red-50 p-2 text-[11px] font-medium text-red-800">
                          ⚠️ {selectedReport.aiVerification.rejectionReason}
                        </div>
                      )}

                      {selectedReport.aiVerification.detectedComponents?.length > 0 && (
                        <p className="text-[11px] text-brand-muted">
                          <strong className="text-brand-navy">Components:</strong>{' '}
                          {selectedReport.aiVerification.detectedComponents.join(', ')}
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}

              <Separator className="bg-brand-line" />

              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                    Attached Evidence ({selectedReport.photos?.length ?? 0})
                  </h3>
                  {(selectedReport.photos?.length ?? 0) > 0 && (
                    <span className="text-[11px] font-medium text-brand-muted">
                      Click photo to enlarge
                    </span>
                  )}
                </div>
                <ReportEvidenceGallery report={selectedReport} />
              </section>
            </div>

            <footer className="shrink-0 border-t border-brand-line bg-brand-paper/75 px-5 py-4">
              {statusKey === 'pending' && !confirmingReject && (
                <div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      onClick={onVerify}
                      disabled={isSubmitting}
                      className="h-10 w-full gap-1.5 rounded-xl bg-brand-blue px-4 text-xs font-bold text-white shadow-2xs hover:bg-brand-navy cursor-pointer"
                    >
                      <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                      Verify report
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setConfirmingReject(true)}
                      disabled={isSubmitting}
                      className="h-10 w-full gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-[#b42318] hover:bg-red-100 cursor-pointer"
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                      Reject report
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-brand-muted">
                    Verify this report first to unlock field staff assignment and dispatch.
                  </p>
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
                <div>
                  <label
                    htmlFor="assign-staff"
                    className="text-[11px] font-bold uppercase tracking-wider text-brand-muted"
                  >
                    {selectedReport.assignedStaffId
                      ? 'Reassign Field Staff'
                      : 'Dispatch Field Staff'}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <select
                      id="assign-staff"
                      value={staffId}
                      onChange={(event) => setStaffId(event.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                    >
                      <option value="">Select a field staff member…</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name || member.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={onAssignStaff}
                      disabled={isSubmitting || !staffId || staff.length === 0}
                      className="h-10 shrink-0 gap-1.5 rounded-xl bg-brand-blue px-4 text-xs font-bold text-white shadow-2xs hover:bg-brand-navy cursor-pointer"
                    >
                      <UsersIcon className="size-3.5" aria-hidden="true" />
                      {selectedReport.assignedStaffId ? 'Update' : 'Dispatch'}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-brand-muted">
                    {staff.length === 0
                      ? 'No staff accounts yet — create one under Users first.'
                      : selectedReport.assignedStaffId
                        ? `${staffNames[selectedReport.assignedStaffId] ?? 'The assigned staff member'} can update this job status from the staff portal.`
                        : 'Assigned staff receive this job immediately on their map and job list.'}
                  </p>
                </div>
              )}

              {statusKey === 'resolved' && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>
                    Resolved
                    {selectedReport.assignedStaffId
                      ? ` by ${staffNames[selectedReport.assignedStaffId] ?? 'field staff'}`
                      : ''}{' '}
                    — no further action needed.
                  </span>
                </div>
              )}

              {statusKey === 'rejected' && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-[#b42318]">
                  <XCircle className="size-4 shrink-0" aria-hidden="true" />
                  <span>Rejected — this report is closed and requires no dispatch.</span>
                </div>
              )}

              {actionError && (
                <p
                  role="alert"
                  className="mt-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]"
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
