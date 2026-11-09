import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import { ReportReviewDialog } from '../../components/admin/reports/ReportReviewDialog'
import { ReportsFilterBar } from '../../components/admin/reports/ReportsFilterBar'
import { ReportsTable } from '../../components/admin/reports/ReportsTable'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import Pagination from '../../components/common/pagination'
import { Card } from '../../components/ui/card'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  getAdminAccess,
  loadAllReports,
  loadStaff,
  setReportDuplicateFlag,
  updateReportStatus,
} from '../../lib/reports'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [barangayFilter, setBarangayFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedReport, setSelectedReport] = useState(null)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [staff, setStaff] = useState([])
  const [staffId, setStaffId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [access, setAccess] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3200)
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

  const staffNames = useMemo(
    () => Object.fromEntries(staff.map((member) => [member.id, member.full_name || member.email])),
    [staff],
  )

  const barangayOptions = useMemo(() => {
    const unique = new Set()
    reports.forEach((r) => {
      if (r.barangay) unique.add(r.barangay)
    })
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [reports])

  const counts = useMemo(() => {
    const summary = {
      All: reports.length,
      Pending: 0,
      Verified: 0,
      Resolved: 0,
      Rejected: 0,
      'Flagged duplicates': 0,
      unassignedVerified: 0,
      highPriorityOpen: 0,
    }
    reports.forEach((report) => {
      const statusKey = String(report.status ?? '').toLowerCase()
      if (statusKey === 'pending') summary.Pending += 1
      else if (statusKey === 'verified') {
        summary.Verified += 1
        if (!report.assignedStaffId) summary.unassignedVerified += 1
      } else if (statusKey === 'resolved') summary.Resolved += 1
      else if (statusKey === 'rejected') summary.Rejected += 1

      if (report.isDuplicate) summary['Flagged duplicates'] += 1
      if (
        String(report.priority ?? '').toLowerCase() === 'high' &&
        (statusKey === 'pending' || statusKey === 'verified')
      ) {
        summary.highPriorityOpen += 1
      }
    })
    return summary
  }, [reports])

  const visibleReports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return reports.filter((report) => {
      const statusKey = String(report.status ?? '').toLowerCase()
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Flagged duplicates'
          ? Boolean(report.isDuplicate)
          : statusKey === filter.toLowerCase())
      const matchesPriority =
        priorityFilter === 'All' ||
        String(report.priority ?? 'medium').toLowerCase() === priorityFilter.toLowerCase()
      const matchesBarangay =
        barangayFilter === 'All' || report.barangay === barangayFilter
      const assignedName = staffNames[report.assignedStaffId] ?? ''
      const matchesQuery =
        !normalizedQuery ||
        [
          report.id,
          report.title,
          report.outageType,
          report.residentName,
          report.barangay,
          report.location,
          report.status,
          assignedName,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery))
      return matchesFilter && matchesPriority && matchesBarangay && matchesQuery
    })
  }, [barangayFilter, filter, priorityFilter, query, reports, staffNames])

  const hasActiveFilters =
    filter !== 'All' || priorityFilter !== 'All' || barangayFilter !== 'All' || query.trim() !== ''

  const pageCount = Math.max(1, Math.ceil(visibleReports.length / pageSize))
  const safePage = Math.min(page, pageCount)

  const paginatedReports = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return visibleReports.slice(start, start + pageSize)
  }, [pageSize, safePage, visibleReports])

  const clearFilters = () => {
    setFilter('All')
    setPriorityFilter('All')
    setBarangayFilter('All')
    setQuery('')
    setPage(1)
  }

  const openReview = (report) => {
    setSelectedReport(report)
    setStaffId(report.assignedStaffId ?? '')
    setConfirmingReject(false)
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

  const handleVerify = async () => {
    const updated = await applyUpdate('verified', selectedReport?.assignedStaffId)
    if (!updated) return
    setSelectedReport((current) => ({ ...current, ...updated }))
    reload()
    showToast('Report verified. Assign a staff member to dispatch it.')
  }

  const handleReject = async () => {
    const updated = await applyUpdate('rejected', null)
    if (!updated) return
    setConfirmingReject(false)
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
      setSelectedReport((current) =>
        current ? { ...current, isDuplicate: nextFlagged } : current,
      )
      setReports((current) =>
        current.map((row) =>
          row.id === selectedReport.id ? { ...row, isDuplicate: nextFlagged } : row,
        ),
      )
      showToast(nextFlagged ? 'Report flagged as duplicate.' : 'Duplicate flag removed.')
    } catch {
      setActionError('We could not update the duplicate flag. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/reports" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Reports" section="Outage reports" />

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3"
          >
            <Check className="size-4 text-brand-yellow" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <PageHeader
              title="Outage reports"
              description="Verify resident-submitted power interruptions, flag duplicates, and dispatch field staff."
            />

            <Card className="gap-0 overflow-hidden rounded-2xl border border-brand-line bg-white py-0 shadow-sm shadow-slate-200/50 ring-0">
              <ReportsFilterBar
                query={query}
                onQueryChange={(val) => {
                  setQuery(val)
                  setPage(1)
                }}
                barangayFilter={barangayFilter}
                onBarangayChange={(val) => {
                  setBarangayFilter(val)
                  setPage(1)
                }}
                barangayOptions={barangayOptions}
                priorityFilter={priorityFilter}
                onPriorityChange={(val) => {
                  setPriorityFilter(val)
                  setPage(1)
                }}
                filter={filter}
                onFilterChange={(val) => {
                  setFilter(val)
                  setPage(1)
                }}
                counts={counts}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                visibleCount={visibleReports.length}
                totalCount={reports.length}
              />

              <ReportsTable
                isLoading={isLoading}
                loadError={loadError}
                reports={reports}
                visibleReports={paginatedReports}
                staffNames={staffNames}
                hasActiveFilters={hasActiveFilters}
                access={access}
                onReload={reload}
                onClearFilters={clearFilters}
                onOpenReview={openReview}
              />

              {!isLoading && !loadError && visibleReports.length > 0 && (
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={visibleReports.length}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              )}
            </Card>
          </div>
        </main>

        <ReportReviewDialog
          selectedReport={selectedReport}
          onClose={() => {
            setConfirmingReject(false)
            setSelectedReport(null)
          }}
          staff={staff}
          staffNames={staffNames}
          staffId={staffId}
          setStaffId={setStaffId}
          isSubmitting={isSubmitting}
          actionError={actionError}
          confirmingReject={confirmingReject}
          setConfirmingReject={setConfirmingReject}
          onVerify={handleVerify}
          onReject={handleReject}
          onAssignStaff={handleAssignStaff}
          onToggleDuplicateFlag={handleToggleDuplicateFlag}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
