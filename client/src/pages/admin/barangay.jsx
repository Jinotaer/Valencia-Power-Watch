import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  LayoutGrid,
  Phone,
  Plus,
  Search,
  Table as TableIcon,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import { BarangayStatusUpdateDialog, BarangayCreateDialog } from './barangayModals'
import { createBarangay, loadActiveReportCounts, loadBarangays, updateBarangayStatus } from '../../lib/barangays'
import Pagination from '../../common/pagination'
import AdminSidebar from '../../components/admin/sidebar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
function GridStatusBadge({ status }) {
  const styles = {
    Energized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Interrupted: 'border-red-200 bg-red-50 text-red-700 animate-pulse',
    'Partial Outage': 'border-amber-200 bg-amber-50 text-amber-700',
    Maintenance: 'border-brand-line bg-[#e5e9f6] text-brand-blue',
  }
  const dotColors = {
    Energized: 'bg-emerald-500',
    Interrupted: 'bg-red-500',
    'Partial Outage': 'bg-amber-500',
    Maintenance: 'bg-brand-blue',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] || styles.Energized
      }`}
    >
      <span className={`size-1.5 rounded-full ${dotColors[status] || dotColors.Energized}`} />
      {status}
    </span>
  )
}

function AdminBarangay() {
  const [barangays, setBarangays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [zoneFilter, setZoneFilter] = useState('All Zones')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Status edit modal state
  const [selectedBarangay, setSelectedBarangay] = useState(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: 'Energized',
    restorationEta: '',
    affectedHouseholds: 0,
    assignedCrew: '',
  })

  // Create barangay modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBarangay, setNewBarangay] = useState({
    name: '',
    zone: 'Central Urban',
    captain: '',
    contactNumber: '',
    totalHouseholds: 2000,
  })

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 3000)
  }

  useEffect(() => {
    let active = true

    Promise.all([loadBarangays(), loadActiveReportCounts()])
      .then(([list, counts]) => {
        if (!active) return
        setBarangays(list.map((b) => ({ ...b, activeReports: counts[b.name] ?? 0 })))
      })
      .catch(() => {
        if (!active) return
        setBarangays([])
        setLoadError('We could not load barangays. Run supabase/barangay.sql once, then try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  // Sorting
  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filtered & sorted barangays
  const filteredBarangays = useMemo(() => {
    let list = barangays.filter((b) => {
      const q = query.toLowerCase()
      const matchesQuery =
        b.name.toLowerCase().includes(q) ||
        b.captain.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.zone.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter
      const matchesZone = zoneFilter === 'All Zones' || b.zone === zoneFilter
      return matchesQuery && matchesStatus && matchesZone
    })

    list.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortField === 'activeReports') {
        return sortOrder === 'asc' ? a.activeReports - b.activeReports : b.activeReports - a.activeReports
      }
      if (sortField === 'status') {
        return sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
      }
      return 0
    })

    return list
  }, [barangays, query, statusFilter, zoneFilter, sortField, sortOrder])

  // Pagination slice
  const visibleBarangays = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBarangays.slice(start, start + pageSize)
  }, [filteredBarangays, page, pageSize])

  // Open update modal
  function handleOpenUpdate(barangay) {
    setActionError('')
    setSelectedBarangay(barangay)
    setStatusForm({
      status: barangay.status,
      restorationEta: barangay.restorationEta,
      affectedHouseholds: barangay.affectedHouseholds,
      assignedCrew: barangay.assignedCrew,
    })
    setIsUpdateOpen(true)
  }

  // Submit status update
  async function handleSaveStatus(e) {
    e.preventDefault()
    if (!selectedBarangay || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')

    try {
      const updated = await updateBarangayStatus(selectedBarangay.code, statusForm)
      setBarangays((prev) =>
        prev.map((b) => (b.code === updated.code ? { ...updated, activeReports: b.activeReports } : b))
      )
      setIsUpdateOpen(false)
      showToast(`${updated.name} power status updated.`)
    } catch {
      setActionError('We could not save these updates. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add new barangay
  async function handleCreateBarangay(e) {
    e.preventDefault()
    if (!newBarangay.name.trim() || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')

    try {
      const created = await createBarangay(newBarangay)
      setBarangays((prev) => [created, ...prev])
      setIsCreateOpen(false)
      setNewBarangay({
        name: '',
        zone: 'Central Urban',
        captain: '',
        contactNumber: '',
        totalHouseholds: 2000,
      })
      showToast(`${created.name} registered.`)
    } catch (error) {
      setActionError(
        error?.code === '23505'
          ? 'A barangay with that name already exists.'
          : 'We could not register this barangay. Check your connection and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/barangay" />
      <SidebarInset className="bg-brand-paper min-h-screen">
        <AdminNavbar title="Barangays" section="Grid status" />

        {toastMessage && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3">
            <Check className="size-4 text-brand-yellow" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header: Title + Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-ink flex items-center gap-2">
                  <Building2 className="size-6 text-brand-blue" />
                  Barangays
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-brand-muted">
                  Valencia City power grid status, outage reports, and response crew assignments across all 31 barangays.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => {
                    setActionError('')
                    setIsCreateOpen(true)
                  }}
                  className="h-10 gap-2 bg-brand-blue hover:bg-brand-navy px-4 font-semibold text-white shadow-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Add Barangay</span>
                </Button>
              </div>
            </div>

            {/* Main Table Card */}
            <section className="overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-xs">
              {/* Filter Toolbar */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-brand-line">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <Input
                    className="h-10 rounded-lg border-brand-line bg-white pl-9 text-xs sm:text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="Search barangay, captain, code..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search barangays"
                  />
                </div>

                {/* Filter Pills, Zone Select & View Toggle */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 rounded-xl bg-[#e5e9f6]/80 p-1">
                    {['All', 'Energized', 'Interrupted', 'Partial Outage', 'Maintenance'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st)
                          setPage(1)
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-white text-brand-ink shadow-xs'
                            : 'text-brand-muted hover:text-brand-ink'
                        }`}
                      >
                        {st !== 'All' && (
                          <span
                            className={`size-1.5 rounded-full ${
                              st === 'Energized'
                                ? 'bg-emerald-500'
                                : st === 'Interrupted'
                                ? 'bg-red-500'
                                : st === 'Partial Outage'
                                ? 'bg-amber-500'
                                : 'bg-brand-blue'
                            }`}
                          />
                        )}
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Zone Selector */}
                  <select
                    value={zoneFilter}
                    onChange={(e) => {
                      setZoneFilter(e.target.value)
                      setPage(1)
                    }}
                    className="h-9 rounded-lg border border-brand-line bg-white px-2.5 text-xs font-semibold text-brand-ink shadow-xs focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
                  >
                    <option>All Zones</option>
                    <option>Central Urban</option>
                    <option>North District</option>
                    <option>South District</option>
                    <option>East District</option>
                    <option>West District</option>
                  </select>

                  {/* View Mode Toggle: Table or Grid */}
                  <div className="flex items-center rounded-lg border border-brand-line p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'table' ? 'bg-[#e5e9f6] text-brand-ink' : 'text-brand-muted hover:text-brand-muted'
                      }`}
                      aria-label="Table view"
                    >
                      <TableIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-[#e5e9f6] text-brand-ink' : 'text-brand-muted hover:text-brand-muted'
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: Data Table View */}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-brand-paper/60">
                      <TableRow className="border-b border-brand-line hover:bg-transparent">
                        <TableHead
                          onClick={() => toggleSort('name')}
                          className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted cursor-pointer select-none hover:text-brand-ink"
                        >
                          <div className="flex items-center gap-1">
                            <span>BARANGAY</span>
                            {sortField === 'name' ? (
                              sortOrder === 'asc' ? (
                                <ChevronUp className="size-3.5 text-brand-blue" />
                              ) : (
                                <ChevronDown className="size-3.5 text-brand-blue" />
                              )
                            ) : (
                              <ChevronUp className="size-3.5 opacity-30" />
                            )}
                          </div>
                        </TableHead>

                        <TableHead
                          onClick={() => toggleSort('status')}
                          className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted cursor-pointer select-none hover:text-brand-ink"
                        >
                          <div className="flex items-center gap-1">
                            <span>POWER STATUS</span>
                            {sortField === 'status' && (
                              sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                            )}
                          </div>
                        </TableHead>

                        <TableHead
                          onClick={() => toggleSort('activeReports')}
                          className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted cursor-pointer select-none hover:text-brand-ink"
                        >
                          <div className="flex items-center gap-1">
                            <span>ACTIVE REPORTS</span>
                            {sortField === 'activeReports' && (
                              sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                            )}
                          </div>
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          RESPONSE CREW
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          EST. RESTORATION
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          LIAISON / CAPTAIN
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          CONTACT
                        </TableHead>

                        <TableHead className="h-11 w-10 px-3 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {isLoading && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="h-36 text-center text-sm font-semibold text-brand-muted">
                            Loading barangays…
                          </TableCell>
                        </TableRow>
                      )}

                      {!isLoading && loadError && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="h-36 text-center">
                            <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                            <button
                              type="button"
                              onClick={reload}
                              className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4"
                            >
                              Try again
                            </button>
                          </TableCell>
                        </TableRow>
                      )}

                      {!isLoading && !loadError && visibleBarangays.map((b) => (
                        <TableRow key={b.code} className="border-b border-brand-line hover:bg-brand-paper/60 transition-colors">
                          {/* Barangay Name & Code */}
                          <TableCell className="px-5 py-4">
                            <div>
                              <div className="font-bold text-brand-ink text-sm flex items-center gap-2">
                                {b.name}
                                <span className="rounded-md bg-[#e5e9f6] px-1.5 py-0.5 text-[10px] font-semibold text-brand-muted">
                                  {b.code}
                                </span>
                              </div>
                              <span className="text-xs text-brand-muted font-medium">{b.zone}</span>
                            </div>
                          </TableCell>

                          {/* Status Pill Badge */}
                          <TableCell className="px-5 py-4">
                            <GridStatusBadge status={b.status} />
                          </TableCell>

                          {/* Active Citizen Reports */}
                          <TableCell className="px-5 py-4">
                            {b.activeReports > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                                <AlertTriangle className="size-3" />
                                {b.activeReports} reports
                              </span>
                            ) : (
                              <span className="text-xs text-brand-muted font-medium">0 reports</span>
                            )}
                          </TableCell>

                          {/* Assigned Crew */}
                          <TableCell className="px-5 py-4 text-xs font-medium text-brand-ink">
                            {b.assignedCrew}
                          </TableCell>

                          {/* Estimated Restoration */}
                          <TableCell className="px-5 py-4 text-xs text-brand-muted">
                            <div className="flex items-center gap-1.5">
                              {b.status === 'Energized' ? (
                                <Zap className="size-3.5 text-emerald-500" />
                              ) : (
                                <Clock className="size-3.5 text-amber-500" />
                              )}
                              <span>{b.restorationEta}</span>
                            </div>
                          </TableCell>

                          {/* Captain / Contact Person */}
                          <TableCell className="px-5 py-4 text-xs font-semibold text-brand-ink">
                            {b.captain}
                          </TableCell>

                          {/* Phone Hotline */}
                          <TableCell className="px-5 py-4 text-xs text-brand-muted whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Phone className="size-3 text-brand-muted" />
                              <span>{b.contactNumber}</span>
                            </div>
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="px-3 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenUpdate(b)}
                              className="h-8 w-8 text-brand-muted hover:text-brand-blue hover:bg-[#e5e9f6] rounded-md cursor-pointer"
                              title="Update grid status"
                            >
                              <Edit className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {!isLoading && !loadError && visibleBarangays.length === 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="h-36 text-center text-sm text-brand-muted">
                            No barangays found matching your search and filter criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* View 2: Visual Grid Cards */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoading && (
                    <p className="col-span-full py-10 text-center text-sm font-semibold text-brand-muted">Loading barangays…</p>
                  )}

                  {!isLoading && loadError && (
                    <div className="col-span-full py-10 text-center">
                      <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                      <button
                        type="button"
                        onClick={reload}
                        className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!isLoading && !loadError && visibleBarangays.map((b) => (
                    <div
                      key={b.code}
                      className="rounded-xl border border-brand-line bg-white p-4 shadow-xs hover:border-brand-blue transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-brand-ink text-base">{b.name}</div>
                          <div className="text-xs text-brand-muted font-medium">{b.zone} • {b.code}</div>
                        </div>
                        <GridStatusBadge status={b.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-brand-line py-3">
                        <div>
                          <span className="text-brand-muted text-[10px] uppercase font-bold">Reports</span>
                          <div className="font-semibold text-brand-ink">
                            {b.activeReports > 0 ? `${b.activeReports} active` : 'None'}
                          </div>
                        </div>
                        <div>
                          <span className="text-brand-muted text-[10px] uppercase font-bold">Households</span>
                          <div className="font-semibold text-brand-ink">{b.totalHouseholds.toLocaleString()} HH</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-brand-muted text-[10px] uppercase font-bold">Restoration ETA</span>
                          <div className="font-medium text-brand-ink flex items-center gap-1 mt-0.5">
                            <Clock className="size-3 text-brand-muted" />
                            {b.restorationEta}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-brand-muted">
                        <div className="truncate pr-2">
                          <span className="font-medium text-brand-ink block truncate">{b.captain}</span>
                          <span className="text-[11px] text-brand-muted">{b.contactNumber}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpdate(b)}
                          className="h-8 text-xs font-semibold gap-1 text-brand-blue hover:bg-[#e5e9f6] cursor-pointer"
                        >
                          <Edit className="size-3.5" />
                          <span>Update</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {!isLoading && !loadError && visibleBarangays.length === 0 && (
                    <p className="col-span-full py-10 text-center text-sm text-brand-muted">
                      No barangays found matching your search and filter criteria.
                    </p>
                  )}
                </div>
              )}

              {/* Common Reusable Pagination */}
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filteredBarangays.length}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </section>
          </div>
        </main>
      </SidebarInset>

      {/* Modal: Update Grid Status */}
      <BarangayStatusUpdateDialog
        open={isUpdateOpen}
        onOpenChange={(open) => {
          setIsUpdateOpen(open)
          if (!open) setActionError('')
        }}
        barangay={selectedBarangay}
        statusForm={statusForm}
        setStatusForm={setStatusForm}
        onSaveStatus={handleSaveStatus}
        isSubmitting={isSubmitting}
        actionError={actionError}
      />

      {/* Modal: Add Barangay */}
      <BarangayCreateDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setActionError('')
        }}
        newBarangay={newBarangay}
        setNewBarangay={setNewBarangay}
        onCreateBarangay={handleCreateBarangay}
        isSubmitting={isSubmitting}
        actionError={actionError}
      />
    </SidebarProvider>
  )
}

export default AdminBarangay
