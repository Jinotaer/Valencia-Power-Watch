import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Phone,
  Pencil,
  Plus,
  Search,
  Trash2,
  Table as TableIcon,
  AlertTriangle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import { BarangayCreateDialog, BarangayEditDialog } from './barangayModals'
import { createBarangay, deleteBarangay, loadActiveReportCounts, loadBarangays, updateBarangay } from '../../lib/barangays'
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

function normalizeBarangayName(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function AdminBarangay() {
  const emptyNewBarangay = {
    name: '',
    captain: '',
    contactNumber: '',
    totalHouseholds: 2000,
    pinnedLocation: '',
    pinPosition: null,
    pinSource: 'manual',
    coordinates: null,
  }

  const [barangays, setBarangays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Create barangay modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingBarangay, setEditingBarangay] = useState(null)
  const [deletingBarangay, setDeletingBarangay] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [newBarangay, setNewBarangay] = useState(emptyNewBarangay)

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
        b.code.toLowerCase().includes(q)
      return matchesQuery
    })

    list.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortField === 'activeReports') {
        return sortOrder === 'asc' ? a.activeReports - b.activeReports : b.activeReports - a.activeReports
      }
      return 0
    })

    return list
  }, [barangays, query, sortField, sortOrder])

  // Pagination slice
  const visibleBarangays = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBarangays.slice(start, start + pageSize)
  }, [filteredBarangays, page, pageSize])

  function openEdit(barangay) {
    setEditingBarangay(barangay)
    setEditForm({
      captain: barangay.captain ?? '',
      contactNumber: barangay.contactNumber ?? '',
      totalHouseholds: barangay.totalHouseholds ?? 0,
      affectedHouseholds: barangay.affectedHouseholds ?? 0,
      pinnedLocation: barangay.pinnedLocation ?? '',
      coordinates: barangay.coordinates ?? null,
      pinSource: barangay.pinSource ?? 'manual',
    })
    setActionError('')
    setIsEditOpen(true)
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    if (!editingBarangay || !editForm || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')
    try {
      const updated = await updateBarangay(editingBarangay.code, editForm)
      setBarangays((previous) => previous.map((barangay) => (
        barangay.code === updated.code ? { ...updated, activeReports: barangay.activeReports ?? 0 } : barangay
      )))
      setIsEditOpen(false)
      setEditingBarangay(null)
      showToast(`${updated.name} updated.`)
    } catch (error) {
      setActionError(error.message || 'We could not update this barangay.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingBarangay || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')
    try {
      await deleteBarangay(deletingBarangay.code)
      setBarangays((previous) => previous.filter((barangay) => barangay.code !== deletingBarangay.code))
      setDeletingBarangay(null)
      showToast(`${deletingBarangay.name} deleted.`)
    } catch (error) {
      setActionError(error.message || 'We could not delete this barangay.')
      setDeletingBarangay(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add new barangay
  async function handleCreateBarangay(e) {
    e.preventDefault()
    if (!newBarangay.name.trim() || isSubmitting) return
    if (!Number.isFinite(newBarangay.coordinates?.latitude) || !Number.isFinite(newBarangay.coordinates?.longitude)) {
      setActionError('Pin the barangay location on the map before registering.')
      return
    }

    const nameKey = normalizeBarangayName(newBarangay.name)
    if (barangays.some((b) => normalizeBarangayName(b.name) === nameKey)) {
      setActionError('A barangay with that name already exists.')
      return
    }

    setIsSubmitting(true)
    setActionError('')

    try {
      const created = await createBarangay(newBarangay)
      setBarangays((prev) => [{ ...created, activeReports: 0 }, ...prev])
      setIsCreateOpen(false)
      setNewBarangay(emptyNewBarangay)
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
        <AdminNavbar title="Barangays" section="Barangay directory" />

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
                  Valencia City barangay liaison directory with live outage-report counts across all 31 barangays.
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
                          LIAISON / CAPTAIN
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          CONTACT
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted text-right">
                          ACTIONS
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {isLoading && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="h-36 text-center text-sm font-semibold text-brand-muted">
                            Loading barangays…
                          </TableCell>
                        </TableRow>
                      )}

                      {!isLoading && loadError && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="h-36 text-center">
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
                            <div className="font-bold text-brand-ink text-sm flex items-center gap-2">
                              {b.name}
                              <span className="rounded-md bg-[#e5e9f6] px-1.5 py-0.5 text-[10px] font-semibold text-brand-muted">
                                {b.code}
                              </span>
                            </div>
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
                          <TableCell className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => openEdit(b)} aria-label={`Edit ${b.name}`} title="Edit" className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy">
                                <Pencil className="size-4" />
                              </button>
                              <button type="button" onClick={() => setDeletingBarangay(b)} aria-label={`Delete ${b.name}`} title="Delete" className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] hover:bg-red-50">
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {!isLoading && !loadError && visibleBarangays.length === 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="h-36 text-center text-sm text-brand-muted">
                            No barangays found matching your search criteria.
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
                          <div className="text-xs text-brand-muted font-medium">{b.code}</div>
                        </div>
                        {b.activeReports > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            <AlertTriangle className="size-3" />
                            {b.activeReports}
                          </span>
                        )}
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
                      </div>

                      <div className="mt-3 text-xs text-brand-muted">
                        <span className="font-medium text-brand-ink block truncate">{b.captain}</span>
                        <span className="text-[11px] text-brand-muted">{b.contactNumber}</span>
                      </div>
                    </div>
                  ))}

                  {!isLoading && !loadError && visibleBarangays.length === 0 && (
                    <p className="col-span-full py-10 text-center text-sm text-brand-muted">
                      No barangays found matching your search criteria.
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
          existingBarangays={barangays}
          isSubmitting={isSubmitting}
          actionError={actionError}
        />
        <BarangayEditDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          form={editForm ?? {}}
          setForm={setEditForm}
          onSave={handleSaveEdit}
          isSubmitting={isSubmitting}
          actionError={actionError}
        />
        {deletingBarangay && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-label="Delete barangay">
              <h2 className="text-lg font-bold text-brand-navy">Delete {deletingBarangay.name}?</h2>
              <p className="mt-2 text-sm text-brand-muted">This permanently removes the barangay record. Reports that reference this name will keep their text value, but this barangay will no longer appear in the directory.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeletingBarangay(null)} disabled={isSubmitting} className="h-10 rounded-lg border border-brand-line px-4 text-sm font-semibold text-brand-muted hover:bg-brand-paper">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={isSubmitting} className="h-10 rounded-lg bg-[#b42318] px-4 text-sm font-semibold text-white hover:bg-[#912018]">
                  {isSubmitting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </SidebarProvider>
    )
}

export default AdminBarangay
