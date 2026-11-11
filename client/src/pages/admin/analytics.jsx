import {
  Calendar,
  Download,
  FileSpreadsheet,
  MapPin,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Pagination } from '../../components/common/pagination'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { ReportPriorityBadge, ReportStatusBadge } from '../../components/resident/reportView'
import { downloadCsv } from '../../lib/adminUsers'
import { loadAllReports, loadStaff } from '../../lib/reports'
import { loadSchedules } from '../../lib/schedules'

function todayStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calculateDurationHours(startIso, endIso) {
  if (!startIso || !endIso) return '—'
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—'
  const diffHours = (end - start) / (1000 * 60 * 60)
  return `${diffHours.toFixed(1)}h`
}

function formatDateTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('incidents') // 'incidents' | 'barangays' | 'staff' | 'schedules'
  const [reports, setReports] = useState([])
  const [staff, setStaff] = useState([])
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleRefresh = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const [reportsData, staffData, schedulesData] = await Promise.all([
        loadAllReports().catch(() => []),
        loadStaff().catch(() => []),
        loadSchedules().catch(() => []),
      ])
      setReports(reportsData)
      setStaff(staffData)
      setSchedules(schedulesData)
    } catch {
      setLoadError('Unable to load data. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      loadAllReports().catch(() => []),
      loadStaff().catch(() => []),
      loadSchedules().catch(() => []),
    ])
      .then(([reportsData, staffData, schedulesData]) => {
        if (!active) return
        setReports(reportsData)
        setStaff(staffData)
        setSchedules(schedulesData)
      })
      .catch(() => {
        if (!active) return
        setLoadError('Unable to load data. Please check your connection and try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const staffMap = useMemo(() => {
    return Object.fromEntries(
      staff.map((s) => [s.id, s.full_name || s.email || 'Unassigned']),
    )
  }, [staff])

  // Aggregated Barangay Dataset
  const barangayData = useMemo(() => {
    const map = {}
    reports.forEach((r) => {
      const bg = r.barangay || 'Unknown'
      if (!map[bg]) {
        map[bg] = {
          barangay: bg,
          total: 0,
          pending: 0,
          verified: 0,
          resolved: 0,
          rejected: 0,
          causes: {},
        }
      }
      map[bg].total += 1
      const tone = r.tone || 'pending'
      if (tone === 'pending') map[bg].pending += 1
      else if (tone === 'verified') map[bg].verified += 1
      else if (tone === 'resolved') map[bg].resolved += 1
      else if (tone === 'rejected') map[bg].rejected += 1

      const cause = r.outageType || 'Unknown'
      map[bg].causes[cause] = (map[bg].causes[cause] || 0) + 1
    })

    return Object.values(map)
      .map((item) => {
        const primaryCause = Object.entries(item.causes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
        const resolutionRate = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0
        return {
          ...item,
          active: item.pending + item.verified,
          resolutionRate,
          primaryCause,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [reports])

  // Aggregated Staff Dataset
  const staffWorkloadData = useMemo(() => {
    const map = {}
    staff.forEach((s) => {
      map[s.id] = {
        id: s.id,
        name: s.full_name || s.email,
        email: s.email || '',
        assigned: 0,
        resolved: 0,
        inProgress: 0,
      }
    })

    reports.forEach((r) => {
      if (r.assignedStaffId && map[r.assignedStaffId]) {
        map[r.assignedStaffId].assigned += 1
        if (r.tone === 'resolved') {
          map[r.assignedStaffId].resolved += 1
        } else if (r.tone === 'verified' || r.tone === 'pending') {
          map[r.assignedStaffId].inProgress += 1
        }
      }
    })

    return Object.values(map).map((s) => {
      const rate = s.assigned > 0 ? Math.round((s.resolved / s.assigned) * 100) : 0
      return {
        ...s,
        completionRate: rate,
      }
    })
  }, [reports, staff])

  // Filtered Incidents
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && (r.tone || '').toLowerCase() !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchRef = (r.reference || r.id || '').toLowerCase().includes(query)
        const matchBg = (r.barangay || '').toLowerCase().includes(query)
        const matchType = (r.outageType || '').toLowerCase().includes(query)
        const matchLandmark = (r.landmark || r.pinnedLocation || '').toLowerCase().includes(query)
        const matchStaff = (staffMap[r.assignedStaffId] || '').toLowerCase().includes(query)
        if (!matchRef && !matchBg && !matchType && !matchLandmark && !matchStaff) {
          return false
        }
      }
      return true
    })
  }, [reports, statusFilter, searchQuery, staffMap])

  // Filtered Barangays
  const filteredBarangays = useMemo(() => {
    if (!searchQuery.trim()) return barangayData
    const q = searchQuery.toLowerCase()
    return barangayData.filter((b) => b.barangay.toLowerCase().includes(q) || b.primaryCause.toLowerCase().includes(q))
  }, [barangayData, searchQuery])

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffWorkloadData
    const q = searchQuery.toLowerCase()
    return staffWorkloadData.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  }, [staffWorkloadData, searchQuery])

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules
    const q = searchQuery.toLowerCase()
    return schedules.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.barangay || '').toLowerCase().includes(q) ||
        (s.type || '').toLowerCase().includes(q),
    )
  }, [schedules, searchQuery])

  // Current active dataset
  const currentItems = useMemo(() => {
    if (activeTab === 'incidents') return filteredReports
    if (activeTab === 'barangays') return filteredBarangays
    if (activeTab === 'staff') return filteredStaff
    return filteredSchedules
  }, [activeTab, filteredReports, filteredBarangays, filteredStaff, filteredSchedules])

  // Pagination calculation
  const pageCount = Math.max(1, Math.ceil(currentItems.length / pageSize))
  const safePage = Math.min(page, pageCount)

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return currentItems.slice(start, start + pageSize)
  }, [currentItems, safePage, pageSize])

  // Export handlers
  const handleExportCurrentTable = () => {
    if (activeTab === 'incidents') {
      const headers = [
        'Reference ID',
        'Reported Date',
        'Reported Time',
        'Barangay',
        'Landmark / Street',
        'Outage Cause / Type',
        'Priority',
        'Workflow Status',
        'Resolved Date',
        'Duration Hours',
        'Assigned Staff',
        'Lineman Remarks',
        'Restoration ETA',
        'Duplicate Flag',
        'Latitude',
        'Longitude',
      ]

      const rows = filteredReports.map((r) => {
        const created = r.createdAt ? new Date(r.createdAt) : null
        const dateStr = created ? created.toISOString().slice(0, 10) : ''
        const timeStr = created ? created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        const resolvedStr = r.resolvedAt ? new Date(r.resolvedAt).toISOString().slice(0, 10) : ''
        const duration = calculateDurationHours(r.createdAt, r.resolvedAt).replace('h', '')

        return [
          r.reference || r.id,
          dateStr,
          timeStr,
          r.barangay || 'Valencia City',
          r.landmark || r.pinnedLocation || '',
          r.outageType || 'Power interruption',
          r.priority || 'medium',
          r.status || 'Pending',
          resolvedStr,
          duration,
          staffMap[r.assignedStaffId] || (r.assignedStaffId ? 'Assigned' : 'Unassigned'),
          r.staffRemarks || '',
          r.restorationEta || '',
          r.isDuplicate ? 'Yes' : 'No',
          r.coordinates?.latitude ?? '',
          r.coordinates?.longitude ?? '',
        ]
      })

      downloadCsv(`valencia-incidents-${todayStamp()}.csv`, [headers, ...rows])
    } else if (activeTab === 'barangays') {
      const headers = [
        'Barangay',
        'Total Reports',
        'Pending Triage',
        'Verified in Field',
        'Resolved Outages',
        'Active Incidents',
        'Resolution Rate %',
        'Primary Failure Cause',
      ]

      const rows = filteredBarangays.map((b) => [
        b.barangay,
        b.total,
        b.pending,
        b.verified,
        b.resolved,
        b.active,
        `${b.resolutionRate}%`,
        b.primaryCause,
      ])

      downloadCsv(`valencia-barangay-summary-${todayStamp()}.csv`, [headers, ...rows])
    } else if (activeTab === 'staff') {
      const headers = [
        'Staff Name',
        'Email',
        'Assigned Jobs',
        'Completed Restorations',
        'In Progress Jobs',
        'Completion Rate %',
      ]

      const rows = filteredStaff.map((s) => [
        s.name,
        s.email,
        s.assigned,
        s.resolved,
        s.inProgress,
        `${s.completionRate}%`,
      ])

      downloadCsv(`valencia-staff-workload-${todayStamp()}.csv`, [headers, ...rows])
    } else if (activeTab === 'schedules') {
      const headers = [
        'Maintenance Title',
        'Target Barangay',
        'Scheduled Date',
        'Start Time',
        'End Time',
        'Type',
        'Scope / Description',
        'Publication Status',
      ]

      const rows = filteredSchedules.map((s) => [
        s.title,
        s.barangay || 'All Valencia City',
        s.date,
        s.startTime || '',
        s.endTime || '',
        s.type || 'Maintenance',
        s.description || '',
        s.status || 'published',
      ])

      downloadCsv(`valencia-schedules-${todayStamp()}.csv`, [headers, ...rows])
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/analytics" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Analytics" section="Reporting & export" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header: Title + Action Buttons matching barangay.jsx */}
            <PageHeader
              title="Data Export & Reporting"
              description="Export official incident ledgers, barangay reliability summaries, and maintenance schedules."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="h-10 gap-2 rounded-lg border border-brand-line bg-white px-3.5 text-xs font-semibold text-brand-navy hover:bg-brand-paper transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`size-4 text-brand-muted ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleExportCurrentTable}
                    disabled={isLoading || currentItems.length === 0}
                    className="h-10 gap-2 bg-brand-blue hover:bg-brand-navy px-4 font-semibold text-white shadow-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="size-4" />
                    <span>Export CSV ({currentItems.length})</span>
                  </Button>
                </div>
              }
            />

            {loadError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                {loadError}
              </div>
            )}

            {/* Main Table Card (No Charts, No KPIs) */}
            <section className="overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-xs">
              {/* Dataset Navigation Tabs */}
              <div className="border-b border-brand-line bg-brand-paper/50 px-4 pt-3 flex flex-wrap items-center gap-2">
                {[
                  { id: 'incidents', label: 'Incident Audit Log', count: reports.length, icon: FileSpreadsheet },
                  { id: 'barangays', label: 'Barangay Reliability', count: barangayData.length, icon: MapPin },
                  { id: 'staff', label: 'Lineman Dispatch', count: staffWorkloadData.length, icon: Users },
                  { id: 'schedules', label: 'Maintenance Schedules', count: schedules.length, icon: Calendar },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id)
                        setSearchQuery('')
                        setStatusFilter('all')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'border-brand-blue text-brand-blue bg-white rounded-t-xl'
                          : 'border-transparent text-brand-muted hover:text-brand-navy'
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-[#e5e9f6] text-brand-blue' : 'bg-brand-line/60 text-brand-muted'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Table Toolbar & Search (Exact same size and styling as reports.jsx) */}
              <div className="border-b border-brand-line p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Search Input matching reports.jsx */}
                  <div className="relative min-w-0 flex-1 lg:max-w-md">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted"
                      aria-hidden="true"
                    />
                    <label htmlFor="analytics-search" className="sr-only">
                      Search records
                    </label>
                    <Input
                      id="analytics-search"
                      type="text"
                      placeholder={
                        activeTab === 'incidents'
                          ? 'Search by reference, barangay, cause…'
                          : activeTab === 'barangays'
                            ? 'Search barangay or primary cause…'
                            : activeTab === 'staff'
                              ? 'Search staff name or email…'
                              : 'Search schedule title or barangay…'
                      }
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value)
                        setPage(1)
                      }}
                      className="h-10 w-full rounded-xl border-brand-line bg-white pl-9 pr-9 text-xs font-medium text-brand-ink placeholder:text-brand-muted focus-visible:border-brand-line focus-visible:ring-0 sm:text-sm"
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setSearchQuery('')
                          setPage(1)
                        }}
                        aria-label="Clear search query"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full text-brand-muted hover:bg-brand-line/50 hover:text-brand-ink cursor-pointer"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>

                  {/* Status Dropdown matching reports.jsx */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeTab === 'incidents' && (
                      <select
                        value={statusFilter}
                        onChange={(event) => {
                          setStatusFilter(event.target.value)
                          setPage(1)
                        }}
                        aria-label="Filter by status"
                        className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* DATA TABLES */}
              {isLoading ? (
                <div className="py-16 text-center text-xs font-semibold text-brand-muted">
                  Loading dataset records…
                </div>
              ) : (
                <div className="relative w-full overflow-x-auto">
                  {/* TAB 1: Incidents Ledger */}
                  {activeTab === 'incidents' && (
                    <Table>
                      <TableHeader className="bg-brand-paper/80 border-b border-brand-line">
                        <TableRow>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pl-4">
                            Reference
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Barangay
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Outage Type
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Priority
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Status
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Reported
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Duration
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pr-4">
                            Assigned Lineman
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-brand-line">
                        {paginatedItems.length > 0 ? (
                          paginatedItems.map((r) => (
                            <TableRow key={r.id || r.reference} className="hover:bg-brand-paper/50">
                              <TableCell className="font-mono font-bold text-brand-blue pl-4">
                                {r.reference || r.id}
                              </TableCell>
                              <TableCell className="font-semibold text-brand-navy">
                                Brgy. {r.barangay}
                                {r.landmark && (
                                  <p className="text-[11px] text-brand-muted font-normal truncate max-w-[180px]">
                                    {r.landmark}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-brand-ink">
                                {r.outageType}
                              </TableCell>
                              <TableCell>
                                <ReportPriorityBadge priority={r.priority} />
                              </TableCell>
                              <TableCell>
                                <ReportStatusBadge tone={r.tone} status={r.status} />
                              </TableCell>
                              <TableCell className="text-xs text-brand-muted">
                                {formatDateTime(r.createdAt)}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-brand-navy">
                                {calculateDurationHours(r.createdAt, r.resolvedAt)}
                              </TableCell>
                              <TableCell className="text-xs text-brand-muted pr-4">
                                {staffMap[r.assignedStaffId] || (
                                  <span className="text-brand-muted/70 italic">Unassigned</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="py-12 text-center text-xs text-brand-muted">
                              No incident reports matched your filter.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {/* TAB 2: Barangay Reliability */}
                  {activeTab === 'barangays' && (
                    <Table>
                      <TableHeader className="bg-brand-paper/80 border-b border-brand-line">
                        <TableRow>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pl-4">
                            Barangay
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Total Reports
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Active (Pending/Verified)
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Resolved
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Resolution Rate
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pr-4">
                            Primary Failure Mode
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-brand-line">
                        {paginatedItems.length > 0 ? (
                          paginatedItems.map((b) => (
                            <TableRow key={b.barangay} className="hover:bg-brand-paper/50">
                              <TableCell className="font-bold text-brand-navy pl-4">
                                Brgy. {b.barangay}
                              </TableCell>
                              <TableCell className="font-mono font-semibold text-brand-ink">
                                {b.total}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {b.active > 0 ? (
                                  <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800 border border-amber-200">
                                    {b.active} active
                                  </span>
                                ) : (
                                  <span className="text-brand-muted">0 active</span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-emerald-700 font-semibold">
                                {b.resolved}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-brand-navy">
                                    {b.resolutionRate}%
                                  </span>
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-paper border border-brand-line">
                                    <div
                                      className="h-full rounded-full bg-emerald-600"
                                      style={{ width: `${b.resolutionRate}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-brand-muted pr-4">
                                {b.primaryCause}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="py-12 text-center text-xs text-brand-muted">
                              No barangay data matched your filter.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {/* TAB 3: Staff Workload */}
                  {activeTab === 'staff' && (
                    <Table>
                      <TableHeader className="bg-brand-paper/80 border-b border-brand-line">
                        <TableRow>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pl-4">
                            Staff Member
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Email
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Total Assigned Jobs
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Completed Restorations
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            In Progress
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pr-4">
                            Completion Rate
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-brand-line">
                        {paginatedItems.length > 0 ? (
                          paginatedItems.map((s) => (
                            <TableRow key={s.id} className="hover:bg-brand-paper/50">
                              <TableCell className="font-bold text-brand-navy pl-4">
                                {s.name}
                              </TableCell>
                              <TableCell className="text-xs text-brand-muted font-mono">
                                {s.email}
                              </TableCell>
                              <TableCell className="font-mono font-semibold text-brand-ink">
                                {s.assigned}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-emerald-700 font-semibold">
                                {s.resolved}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-amber-700 font-semibold">
                                {s.inProgress}
                              </TableCell>
                              <TableCell className="pr-4">
                                <span className="font-mono text-xs font-bold text-brand-navy">
                                  {s.completionRate}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="py-12 text-center text-xs text-brand-muted">
                              No staff dispatch records matched your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {/* TAB 4: Maintenance Schedules */}
                  {activeTab === 'schedules' && (
                    <Table>
                      <TableHeader className="bg-brand-paper/80 border-b border-brand-line">
                        <TableRow>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pl-4">
                            Maintenance Title
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Target Barangay
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Scheduled Date
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Time Window
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Type
                          </TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-brand-muted pr-4">
                            Scope / Description
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-brand-line">
                        {paginatedItems.length > 0 ? (
                          paginatedItems.map((s) => (
                            <TableRow key={s.id} className="hover:bg-brand-paper/50">
                              <TableCell className="font-bold text-brand-navy pl-4">
                                {s.title}
                              </TableCell>
                              <TableCell className="font-semibold text-brand-navy text-xs">
                                {s.barangay ? `Brgy. ${s.barangay}` : 'All Valencia City'}
                              </TableCell>
                              <TableCell className="text-xs text-brand-muted font-mono">
                                {s.date}
                              </TableCell>
                              <TableCell className="text-xs text-brand-ink">
                                {s.startTime && s.endTime ? `${s.startTime} – ${s.endTime}` : 'All day'}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex rounded-md bg-[#e5e9f6] px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                                  {s.type || 'Maintenance'}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-brand-muted pr-4 truncate max-w-[240px]">
                                {s.description || 'Routine preventive maintenance'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="py-12 text-center text-xs text-brand-muted">
                              No maintenance schedules found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Pagination matching reports.jsx */}
              {!isLoading && currentItems.length > 0 && (
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={currentItems.length}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              )}
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
