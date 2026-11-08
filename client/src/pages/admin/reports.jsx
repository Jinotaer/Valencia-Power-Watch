import { Check, ChevronRight, MapPin, Search, Users as UsersIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { getAdminAccess, loadAllReports, loadStaff, priorityLabels, setReportDuplicateFlag, updateReportStatus } from '../../lib/reports'
import { ReportPriorityBadge, ReportStatusBadge } from '../resident/reportView'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { icons } from './mapData'
import { VALENCIA_CENTER } from '../../lib/geo'

const statusFilters = ['All', 'Pending', 'Verified', 'Resolved', 'Rejected', 'Flagged duplicates']

function ReportDetailsList({ report }) {
  const rows = [
    ['Reported by', report.residentName || 'Unknown resident'],
    ['Type', report.outageType],
    ['Priority', priorityLabels[report.priority] ?? report.priority ?? 'Medium'],
    ['Noticed', report.startedTime],
    ['Barangay', report.barangay ? `Brgy. ${report.barangay}` : null],
    ['Pinned location', report.pinnedLocation || null],
    ['Landmark', report.landmark || 'Not provided'],
    ['Location pin', report.pinSource === 'gps' ? `GPS${report.coordinates?.accuracy ? `, about ${Math.round(report.coordinates.accuracy)} m` : ''}` : 'Placed manually'],
    ['Submitted', report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : report.date || 'Unknown'],
    ['Duplicate flag', report.isDuplicate ? 'Flagged as duplicate' : 'Not flagged'],
  ]

  return (
    <dl className="grid gap-3 text-xs sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{label}</dt>
          <dd className="mt-0.5 font-semibold text-brand-muted">{value || 'Not provided'}</dd>
        </div>
      ))}
    </dl>
  )
}

function ReportEvidence({ report }) {
  const photos = report.photos ?? []

  if (photos.length === 0) {
    return <p className="mt-2 text-sm text-brand-muted">No evidence was attached.</p>
  }

  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2">
      {photos.map((photo, index) => {
        if (!photo.dataUrl) {
          return (
            <div
              key={photo.id ?? index}
              className="col-span-2 flex aspect-video items-center justify-center rounded-lg border border-dashed border-brand-line bg-brand-paper px-4 text-center text-[11px] font-semibold text-brand-muted"
            >
              Evidence file {index + 1} could not be loaded — re-run supabase/report.sql so admins can read the evidence bucket.
            </div>
          )
        }
        return photo.kind === 'video' ? (
          <video
            key={photo.id ?? index}
            src={photo.dataUrl}
            controls
            playsInline
            preload="metadata"
            aria-label={photo.label || `Report video ${index + 1}`}
            className="col-span-2 aspect-video w-full rounded-lg border border-brand-line bg-black object-contain"
          />
        ) : (
          <img
            key={photo.id ?? index}
            src={photo.dataUrl}
            alt={photo.label || `Report photo ${index + 1}`}
            loading="lazy"
            className="aspect-square w-full rounded-lg border border-brand-line object-cover"
          />
        )
      })}
    </div>
  )
}

function MapSizeFix() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

function ReportLocationMap({ report, fill = false }) {
  const position = report.coordinates
    ? [report.coordinates.latitude, report.coordinates.longitude]
    : null

  return (
    <div
      className={
        fill
          ? 'relative h-full w-full overflow-hidden bg-[#e5e9f6]'
          : 'mt-2.5 overflow-hidden rounded-xl border border-brand-line'
      }
    >
      <MapContainer
        center={position ?? VALENCIA_CENTER}
        zoom={position ? 15 : 12}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        style={fill ? { height: '100%', width: '100%' } : { height: '220px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapSizeFix />
        {position && <Marker position={position} icon={icons.openReport} />}
      </MapContainer>
      <p
        className={
          fill
            ? 'absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 px-3 py-2 text-[11px] font-semibold text-brand-muted'
            : 'px-3 py-2 text-[11px] font-semibold text-brand-muted'
        }
      >
        {position
          ? `Pin ${report.pinSource === 'gps' ? 'captured by GPS' : 'placed by the resident'}${
              report.pinSource === 'gps' && report.coordinates.accuracy
                ? ` · about ${Math.round(report.coordinates.accuracy)} m accuracy`
                : ''
            }`
          : 'No coordinates were captured for this report.'}
      </p>
    </div>
  )
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [staff, setStaff] = useState([])
  const [staffId, setStaffId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [access, setAccess] = useState(null)

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

    loadAllReports()
      .then((savedReports) => {
        if (active) setReports(savedReports)
      })
      .catch(() => {
        if (active) {
          setReports([])
          setLoadError('We could not load resident reports. Check your connection and try again.')
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
    getAdminAccess().then(setAccess).catch(() => setAccess(null))
  }, [reloadKey])

  useEffect(() => {
    loadStaff().then(setStaff)
  }, [])

  const retryLoad = () => {
    reload()
  }

  const visibleReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return reports.filter((report) => {
      const statusKey = String(report.status ?? '').toLowerCase()
      const matchesFilter = filter === 'All'
        || (filter === 'Flagged duplicates' ? Boolean(report.isDuplicate) : statusKey === filter.toLowerCase())
      const matchesQuery = !normalizedQuery || [report.id, report.title, report.location, report.status].some((value) => value?.toLowerCase().includes(normalizedQuery))
      return matchesFilter && matchesQuery
    })
  }, [filter, query, reports])

  const staffNames = useMemo(
    () => Object.fromEntries(staff.map((member) => [member.id, member.full_name || member.email])),
    [staff],
  )

  const openReview = (report) => {
    setSelectedReport(report)
    setStaffId(report.assignedStaffId ?? '')
    setActionError('')
  }

  const applyUpdate = async (status, assignedStaffId) => {
    if (!selectedReport) return null

    setIsSubmitting(true)
    setActionError('')

    try {
      return await updateReportStatus(selectedReport.id, status, assignedStaffId)
    } catch {
      setActionError('We could not update this report. Check your connection and try again.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verifying keeps the dialog open so the admin can assign a staff member next.
  const handleVerify = async () => {
    const updated = await applyUpdate('verified', selectedReport?.assignedStaffId)
    if (!updated) return
    // Keep fields the update response does not carry (e.g. residentName).
    setSelectedReport((current) => ({ ...current, ...updated }))
    reload()
    showToast('Report verified. Assign a staff member to dispatch it.')
  }

  const handleReject = async () => {
    if (!window.confirm('Reject this report? This cannot be undone from this page.')) return
    const updated = await applyUpdate('rejected', null)
    if (!updated) return
    setSelectedReport(null)
    reload()
    showToast('Report rejected.')
  }

  const handleAssignStaff = async () => {
    if (!staffId) return
    const updated = await applyUpdate('verified', staffId)
    if (!updated) return
    setSelectedReport(null)
    reload()
    showToast('Staff assigned to this report.')
  }

  const handleToggleDuplicateFlag = async () => {
    if (!selectedReport || isSubmitting) return

    const nextFlagged = !selectedReport.isDuplicate
    setIsSubmitting(true)
    setActionError('')
    try {
      await setReportDuplicateFlag(selectedReport.id, nextFlagged)
      setSelectedReport((current) => current ? { ...current, isDuplicate: nextFlagged } : current)
      setReports((current) => current.map((row) => (row.id === selectedReport.id ? { ...row, isDuplicate: nextFlagged } : row)))
      showToast(nextFlagged ? 'Report flagged as duplicate.' : 'Duplicate flag removed.')
    } catch {
      setActionError('We could not update the duplicate flag. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusKey = String(selectedReport?.status ?? 'pending').toLowerCase()

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/reports" />
      <SidebarInset className="bg-brand-paper min-h-screen">
        <AdminNavbar title="Reports" section="Outage reports" />

        {toastMessage && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3">
            <Check className="size-4 text-brand-yellow" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-[-.03em] text-brand-navy">Outage reports</h2>
              <p className="mt-1 text-sm text-brand-muted">Review resident-submitted interruptions and assign field staff.</p>
            </div>

            <section className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-3 border-b border-brand-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <label className="sr-only">Search reports</label>
                  <input
                    type="search"
                    placeholder="Search by place or report ID"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-10 w-full rounded-xl border border-brand-line bg-white pl-9 pr-3 text-xs text-brand-ink placeholder:text-brand-muted focus:border-brand-navy focus:outline-none sm:text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {statusFilters.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFilter(option)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        filter === option ? 'bg-brand-navy text-white' : 'border border-brand-line bg-white text-brand-muted hover:bg-brand-paper'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-brand-paper/80 hover:bg-brand-paper/80">
                    <TableHead className="h-11 pl-5 pr-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">Report</TableHead>
                    <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">Resident</TableHead>
                    <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">Barangay</TableHead>
                    <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">Noticed</TableHead>
                    <TableHead className="hidden h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted lg:table-cell">Submitted</TableHead>
                    <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">Status</TableHead>
                    <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">Duplicate</TableHead>
                    <TableHead className="hidden h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted md:table-cell">Assigned</TableHead>
                    <TableHead className="h-11 pl-3 pr-5 text-right text-[11px] font-bold uppercase tracking-wider text-brand-muted">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="py-10 text-center text-sm font-semibold text-brand-muted">Loading resident reports…</TableCell>
                    </TableRow>
                  )}
                  {!isLoading && loadError && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="py-10 text-center">
                        <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                        <button type="button" className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4" onClick={retryLoad}>Try again</button>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !loadError && visibleReports.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="px-5 py-10 text-center text-sm text-brand-muted">
                        <p className="font-semibold">
                          {reports.length === 0 ? 'No resident reports are visible to this account.' : 'No resident reports match this filter.'}
                        </p>
                        {reports.length === 0 && access && (
                          <p className="mx-auto mt-2 max-w-md text-xs leading-5">
                            {!access.signedIn ? (
                              <>You are not signed in, so Supabase hides every report. <a className="font-bold text-brand-blue underline underline-offset-4" href="/admin/login">Sign in as an administrator</a>.</>
                            ) : access.role !== 'admin' ? (
                              <>Signed in as <strong>{access.email}</strong>, but this account's role is <strong>{access.role || 'missing'}</strong>. Promote it in the Supabase SQL Editor, then reload: <code className="rounded bg-[#e5e9f6] px-1 break-all">update public.users set role = 'admin' where email = '{access.email}';</code></>
                            ) : (
                              <>Signed in as <strong>{access.email}</strong> with the admin role, but the reports table returned no rows. Re-run <code className="rounded bg-[#e5e9f6] px-1 break-all">supabase/report.sql</code> so the “Admins can view all reports” policy exists.</>
                            )}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !loadError && visibleReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="pl-5 pr-3">
                        <p className="text-sm font-semibold text-brand-navy">{report.outageType}</p>
                        <p className="mt-0.5 text-[11px] font-medium tracking-wide text-brand-muted">{report.id}</p>
                      </TableCell>
                      <TableCell className="px-3 text-sm text-brand-muted">
                        <span className="block max-w-[18ch] truncate" title={report.residentName || undefined}>
                          {report.residentName || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 text-sm text-brand-muted">{report.barangay ? `Brgy. ${report.barangay}` : '—'}</TableCell>
                      <TableCell className="px-3 text-sm tabular-nums text-brand-muted">{report.startedTime || report.date || '—'}</TableCell>
                      <TableCell className="hidden px-3 text-sm tabular-nums text-brand-muted lg:table-cell">{report.date || '—'}</TableCell>
                      <TableCell className="px-3"><ReportStatusBadge tone={report.tone} status={report.status} /></TableCell>
                      <TableCell className="px-3">
                        {report.isDuplicate
                          ? <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">Duplicate</span>
                          : <span className="text-xs text-brand-muted">—</span>}
                      </TableCell>
                      <TableCell className="hidden px-3 text-sm text-brand-muted md:table-cell">
                        {staffNames[report.assignedStaffId] ?? <span className="text-brand-muted">Unassigned</span>}
                      </TableCell>
                      <TableCell className="pl-3 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => openReview(report)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-blue transition-colors hover:bg-[#e5e9f6] hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                        >
                          Review <ChevronRight className="size-3.5" aria-hidden="true" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        </main>

        {selectedReport && (
          <Dialog open onOpenChange={(open) => { if (!open) setSelectedReport(null) }}>
            <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl bg-white p-0 sm:max-w-[1040px] md:overflow-hidden">
              <div className="grid min-h-[600px] grid-cols-1 md:h-[min(680px,92vh)] md:grid-cols-[1.2fr_0.8fr]">
                {/* Left: report location */}
                <div className="relative z-0 h-72 w-full overflow-hidden border-b border-brand-line bg-[#e5e9f6] md:h-full md:border-b-0 md:border-r">
                  <ReportLocationMap report={selectedReport} fill />
                </div>

                {/* Right: details and actions */}
                <div className="flex min-h-0 flex-col md:h-full">
                  <header className="shrink-0 border-b border-brand-line px-5 py-4 pr-12">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold tracking-wide text-brand-muted">{selectedReport.id}</span>
                        <ReportPriorityBadge priority={selectedReport.priority} />
                        <ReportStatusBadge tone={selectedReport.tone} status={selectedReport.status} />
                      </div>
                      <DialogTitle className="mt-1 text-lg font-bold leading-tight text-brand-navy">{selectedReport.outageType}</DialogTitle>
                      <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                        <MapPin className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
                        {selectedReport.location} · Noticed {selectedReport.startedTime || selectedReport.date}
                      </DialogDescription>
                    </div>
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <section>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Report details</h3>
                      <div className="mt-2.5"><ReportDetailsList report={selectedReport} /></div>
                    </section>

                    <section className="border-t border-brand-line pt-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Resident notes</h3>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-brand-muted">{selectedReport.notes || 'No notes were added.'}</p>
                    </section>

                    <section className="border-t border-brand-line pt-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Evidence</h3>
                      <ReportEvidence report={selectedReport} />
                    </section>
                  </div>

                    {selectedReport.isDuplicate && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">Duplicate</span>
                    )}
                  <footer className="shrink-0 border-t border-brand-line bg-brand-paper/60 px-5 py-4">
                    <div className="mb-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleToggleDuplicateFlag}
                        disabled={isSubmitting}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-200 bg-white px-3 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {selectedReport.isDuplicate ? 'Remove duplicate flag' : 'Flag as duplicate'}
                      </button>
                    </div>
                    {statusKey === 'pending' && (
                      <div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleVerify}
                            disabled={isSubmitting}
                            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-4 text-xs font-bold text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                            Verify report
                          </button>
                          <button
                            type="button"
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-xs font-bold text-[#b42318] transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject report
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] leading-4 text-brand-muted">
                          Verify this report before assigning field staff.
                        </p>
                      </div>
                    )}

                    {statusKey === 'verified' && (
                      <div>
                        <label htmlFor="assign-staff" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Assign staff</label>
                        <div className="mt-2 flex gap-2">
                          <select
                            id="assign-staff"
                            value={staffId}
                            onChange={(event) => setStaffId(event.target.value)}
                            className="h-10 min-w-0 flex-1 rounded-lg border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                          >
                            <option value="">Select a staff member</option>
                            {staff.map((member) => (
                              <option key={member.id} value={member.id}>{member.full_name || member.email}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAssignStaff}
                            disabled={isSubmitting || !staffId || staff.length === 0}
                            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand-blue px-4 text-xs font-bold text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <UsersIcon className="size-3.5" aria-hidden="true" />
                            Assign
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] leading-4 text-brand-muted">
                          {staff.length === 0
                            ? 'No staff accounts yet — create one under Users first.'
                            : selectedReport.assignedStaffId
                              ? `${staffNames[selectedReport.assignedStaffId] ?? 'The assigned staff member'} can update this job status from the staff portal.`
                              : 'Assigned staff update the job status from their portal.'}
                        </p>
                      </div>
                    )}

                    {statusKey === 'resolved' && (
                      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        Resolved{selectedReport.assignedStaffId ? ` by ${staffNames[selectedReport.assignedStaffId] ?? 'field staff'}` : ''} — no further action needed.
                      </p>
                    )}

                    {statusKey === 'rejected' && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[#b42318]">Rejected — this report needs no action.</p>
                    )}

                    {actionError && (
                      <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]">{actionError}</p>
                    )}
                  </footer>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
