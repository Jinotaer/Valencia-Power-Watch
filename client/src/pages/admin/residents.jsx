import { ChevronDown, ChevronUp, MapPin, Search, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import Pagination from '../../components/common/pagination'
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
import { loadBarangays } from '../../lib/barangays'
import { supabase } from '../../lib/supabase'

// Resident accounts only — staff and admins live on /admin/users
function toResident(u) {
  return {
    id: u.id,
    name: u.full_name || u.email?.split('@')[0] || 'User',
    email: u.email,
    // Registration records the home barangay in `address`
    barangay: u.address || 'Unassigned',
    contactNumber: u.contact_number || '\u2014',
    joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : '\u2014',
  }
}

function AdminResidents() {
  const [residents, setResidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [barangayNames, setBarangayNames] = useState([])
  const [query, setQuery] = useState('')
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [isBarangayMenuOpen, setIsBarangayMenuOpen] = useState(false)
  const barangayMenuRef = useRef(null)
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  // Close the barangay dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (barangayMenuRef.current && !barangayMenuRef.current.contains(event.target)) {
        setIsBarangayMenuOpen(false)
      }
    }
    if (isBarangayMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isBarangayMenuOpen])

  useEffect(() => {
    let active = true

    async function fetchResidents() {
      if (!supabase) throw new Error('Authentication is not configured in this environment.')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'resident')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }

    fetchResidents()
      .then((rows) => {
        if (!active) return
        setResidents(rows.map(toResident))
        setLoadError('')
      })
      .catch((err) => {
        if (!active) return
        setResidents([])
        setLoadError(
          err?.message === 'Authentication is not configured in this environment.'
            ? err.message
            : 'We could not load residents. Check your connection and try again.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    loadBarangays()
      .then((list) => {
        if (active) setBarangayNames(list.map((b) => b.name))
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [reloadKey])

  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredResidents = useMemo(() => {
    const result = residents.filter((r) => {
      const q = query.toLowerCase()
      const matchesQuery =
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)

      const matchesBarangay =
        barangayFilter === 'All barangays' ||
        (r.barangay || 'Unassigned') === barangayFilter

      return matchesQuery && matchesBarangay
    })

    result.sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase()
      const valB = (b[sortField] || '').toLowerCase()
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [residents, query, barangayFilter, sortField, sortOrder])

  const visibleResidents = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredResidents.slice(start, start + pageSize)
  }, [filteredResidents, page, pageSize])

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/residents" />
      <SidebarInset className="bg-brand-paper min-h-screen">
        <AdminNavbar title="Users" section="Residents" />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {/* Page Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-ink flex items-center gap-2.5">
                  <UsersRound className="size-6 text-brand-navy" />
                  <span>Resident Directory</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-brand-muted">
                  Community member accounts only — field staff and administrators are on the{' '}
                  <a href="/admin/users" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                    staff directory
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Table Container Card */}
            <section className="overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-xs">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col gap-3 p-4 border-b border-brand-line sm:flex-row sm:items-center sm:justify-between">
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <Input
                    className="h-10 rounded-xl border-brand-line bg-white pl-9 text-xs sm:text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
                    placeholder="Search by name, email, or ID num..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search residents"
                  />
                </div>

                {/* Barangay Filter Dropdown */}
                <div className="flex items-center gap-2" ref={barangayMenuRef}>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBarangayMenuOpen((prev) => !prev)}
                      className={`h-9 shrink-0 gap-2 rounded-xl border px-3 transition-all cursor-pointer ${
                        barangayFilter !== 'All barangays' || isBarangayMenuOpen
                          ? 'border-brand-navy bg-brand-navy/10 text-brand-navy ring-2 ring-brand-navy/20'
                          : 'border-brand-line text-brand-muted hover:border-brand-line hover:bg-brand-paper'
                      }`}
                      title={`Filter by barangay (Current: ${barangayFilter === 'All barangays' ? 'All' : barangayFilter})`}
                      aria-label="Filter by barangay"
                      aria-expanded={isBarangayMenuOpen}
                    >
                      <MapPin className="size-4" />
                      <span className="text-xs font-semibold">
                        Barangay: {barangayFilter === 'All barangays' ? 'All' : barangayFilter}
                      </span>
                      <ChevronDown className={`size-3.5 transition-transform ${isBarangayMenuOpen ? 'rotate-180' : ''}`} />
                      {barangayFilter !== 'All barangays' && (
                        <span className="size-2 rounded-full bg-brand-navy" />
                      )}
                    </Button>

                    {isBarangayMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-brand-line bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-brand-line mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Filter by Barangay
                          </span>
                          {barangayFilter !== 'All barangays' && (
                            <button
                              type="button"
                              onClick={() => {
                                setBarangayFilter('All barangays')
                                setPage(1)
                              }}
                              className="text-[10px] font-semibold text-brand-navy hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 space-y-0.5 overflow-y-auto">
                          {['All barangays', ...barangayNames, 'Unassigned'].map((barangay) => {
                            const isSelected = barangayFilter === barangay
                            return (
                              <button
                                key={barangay}
                                type="button"
                                onClick={() => {
                                  setBarangayFilter(barangay)
                                  setPage(1)
                                  setIsBarangayMenuOpen(false)
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#e5e9f6] text-brand-ink font-bold'
                                    : 'text-brand-muted hover:bg-brand-paper hover:text-brand-ink'
                                }`}
                              >
                                <span className="truncate">{barangay}</span>
                                {isSelected && <span className="size-1.5 rounded-full bg-brand-navy" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-brand-paper/60">
                    <TableRow className="border-b border-brand-line hover:bg-transparent">
                      <TableHead
                        onClick={() => toggleSort('name')}
                        className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted cursor-pointer select-none hover:text-brand-ink"
                      >
                        <div className="flex items-center gap-1">
                          <span>NAME</span>
                          {sortField === 'name' ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="size-3.5 text-brand-navy" />
                            ) : (
                              <ChevronDown className="size-3.5 text-brand-navy" />
                            )
                          ) : (
                            <ChevronUp className="size-3.5 opacity-30" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead
                        onClick={() => toggleSort('email')}
                        className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted cursor-pointer select-none hover:text-brand-ink"
                      >
                        <div className="flex items-center gap-1">
                          <span>EMAIL</span>
                          {sortField === 'email' ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="size-3.5 text-brand-navy" />
                            ) : (
                              <ChevronDown className="size-3.5 text-brand-navy" />
                            )
                          ) : (
                            <ChevronUp className="size-3.5 opacity-30" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        BARANGAY
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        CONTACT
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        JOINED
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {!isLoading && !loadError && visibleResidents.map((resident) => (
                      <TableRow
                        key={resident.email}
                        className="border-b border-brand-line hover:bg-brand-paper/60 transition-colors"
                      >
                        <TableCell className="px-5 py-4 font-semibold text-brand-ink text-sm">
                          {resident.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm">
                          {resident.email}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm">
                          {resident.barangay}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm whitespace-nowrap">
                          {resident.contactNumber}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-brand-muted whitespace-nowrap">
                          {resident.joined}
                        </TableCell>
                      </TableRow>
                    ))}

                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-36 text-center text-sm font-semibold text-brand-muted">
                          Loading residents…
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && loadError && (
                      <TableRow>
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

                    {!isLoading && !loadError && visibleResidents.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-36 text-center text-sm text-brand-muted"
                        >
                          No residents found matching this filter combination.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Common Pagination Component */}
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filteredResidents.length}
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
    </SidebarProvider>
  )
}

export default AdminResidents
