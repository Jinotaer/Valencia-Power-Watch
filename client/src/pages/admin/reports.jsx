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
import { getAdminAccess, loadAllReports, loadStaff, updateReportStatus } from '../../lib/reports'
import { ReportStatusBadge } from '../resident/reportView'

const statusFilters = ['All', 'Pending', 'Verified', 'Resolved']

function ReportDetailsList({ report }) {
  const rows = [
    ['Reported by', report.residentName || 'Unknown resident'],
    ['Type', report.outageType],
    ['Noticed', report.startedTime],
    ['Barangay', report.barangay ? `Brgy. ${report.barangay}` : null],
    ['Pinned location', report.pinnedLocation || null],
    ['Landmark', report.landmark || 'Not provided'],
    ['Location pin', report.pinSource === 'gps' ? `GPS${report.coordinates?.accuracy ? `, about ${Math.round(report.coordinates.accuracy)} m` : ''}` : 'Placed manually'],
    ['Submitted', report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : report.date || 'Unknown'],
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
    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((photo, index) =>
        photo.kind === 'video' ? (
          <video
            key={photo.id ?? index}
            src={photo.dataUrl}
            controls
            playsInline
            preload="metadata"
            aria-label={photo.label || `Report video ${index + 1}`}
            className="col-span-2 aspect-video w-full rounded-lg border border-brand-line bg-black object-contain sm:col-span-3"
          />
        ) : (
          <img
            key={photo.id ?? index}
            src={photo.dataUrl}
            alt={photo.label || `Report photo ${index + 1}`}
            loading="lazy"
            className="aspect-square w-full rounded-lg border border-brand-line object-cover"
          />
        ),
      )}
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
      const matchesFilter = filter === 'All' || statusKey === filter.toLowerCase()
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
      const updated = await updateReportStatus(selectedReport.id, status, assignedStaffId)
      setSelectedReport(null)
      reload()
      return updated
    } catch {
      setActionError('We could not update this report. Check your connection and try again.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (status) => {
    const updated = await applyUpdate(status, selectedReport?.assignedStaffId)
    if (updated) showToast(status === 'resolved' ? 'Report marked as resolved.' : 'Report marked as verified.')
  }

  const handleAssignStaff = async () => {
    const updated = await applyUpdate(String(selectedReport?.status ?? 'pending').toLowerCase(), staffId)
    if (updated) showToast('Staff assigned to this report.')
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
                    <TableHead className="hidden h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted md:table-cell">Assigned</TableHead>
                    <TableHead className="h-11 pl-3 pr-5 text-right text-[11px] font-bold uppercase tracking-wider text-brand-muted">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="py-10 text-center text-sm font-semibold text-brand-muted">Loading resident reports…</TableCell>
                    </TableRow>
                  )}
                  {!isLoading && loadError && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="py-10 text-center">
                        <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                        <button type="button" className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4" onClick={retryLoad}>Try again</button>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !loadError && visibleReports.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="px-5 py-10 text-center text-sm text-brand-muted">
                        <p className="font-semibold">
                          {reports.length === 0 ? 'No resident reports are visible to this account.' : 'No resident reports match this filter.'}
                        </p>
                        {reports.length === 0 && access && (
                          <p className="mx-auto mt-2 max-w-md text-xs leading-5">
                            {!access.signedIn ? (
                              <>You are not signed in, so Supabase hides every report. <a className="font-bold text-brand-blue underline underline-offset-4" href="/admin/login">Sign in as an administrator</a>.</>
                            ) : access.role !== 'admin' ? (
                              <>Signed in as <strong>{access.email}</strong>, but this account's role is <strong>{access.role || 'missing'}</strong>. Promote it in the Supabase SQL Editor, then reload: <code className="rounded bg-[#e5e9f6] px-1">update public.users set role = 'admin' where email = '{access.email}';</code></>
                            ) : (
                              <>Signed in as <strong>{access.email}</strong> with the admin role, but the reports table returned no rows. Re-run <code className="rounded bg-[#e5e9f6] px-1">supabase/report.sql</code> so the “Admins can view all reports” policy exists.</>
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
            <DialogContent className="grid max-h-[90vh] w-[calc(100%-1.5rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl bg-white p-0 sm:max-w-3xl">
              <header className="flex items-start justify-between gap-4 border-b border-brand-line px-5 py-4 pr-12 sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold tracking-wide text-brand-muted">{selectedReport.id}</span>
                    <ReportStatusBadge tone={selectedReport.tone} status={selectedReport.status} />
                  </div>
                  <DialogTitle className="mt-1 text-lg font-bold leading-tight text-brand-navy">{selectedReport.outageType}</DialogTitle>
                  <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                    <MapPin className="size-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
                    {selectedReport.location} · Noticed {selectedReport.startedTime || selectedReport.date}
                  </DialogDescription>
                </div>
              </header>

              <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_19rem] md:overflow-hidden">
                <div className="min-h-0 space-y-5 px-5 py-4 sm:px-6 md:overflow-y-auto">
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

                <aside className="min-h-0 border-t border-brand-line bg-brand-paper/70 px-5 py-4 sm:px-6 md:overflow-y-auto md:border-l md:border-t-0">
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Status</h3>
                    <div className="mt-2">
                      {statusKey === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('verified')}
                          disabled={isSubmitting}
                          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-4 text-xs font-bold text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                          Mark as verified
                        </button>
                      )}
                      {statusKey === 'verified' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('resolved')}
                          disabled={isSubmitting}
                          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                          Mark as resolved
                        </button>
                      )}
                      {statusKey === 'resolved' && (
                        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Resolved — no further action needed.</p>
                      )}
                    </div>
                  </section>

                  <section className="mt-5 border-t border-brand-line pt-4">
                    <label htmlFor="assign-staff" className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Assign staff</label>
                    <select
                      id="assign-staff"
                      value={staffId}
                      onChange={(event) => setStaffId(event.target.value)}
                      className="mt-2 h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>{member.full_name || member.email}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssignStaff}
                      disabled={isSubmitting || staff.length === 0}
                      className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-4 text-xs font-bold text-white transition-colors hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <UsersIcon className="size-3.5" aria-hidden="true" />
                      Assign staff
                    </button>
                    <p className="mt-2 text-[11px] leading-4 text-brand-muted">
                      {staff.length === 0 ? 'No staff accounts yet — create one under Users first.' : 'Field staff pick this report up from their jobs list.'}
                    </p>
                  </section>

                  {actionError && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]">{actionError}</p>
                  )}
                </aside>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
