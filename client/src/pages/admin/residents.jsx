import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import PageHeader from '../../components/common/pageHeader'
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
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

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
            <PageHeader
              className="mb-6"
              title="Resident Directory"
              description="Registered Valencia City community members and their registered residential barangays."
            />

            {/* Table Container Card */}
            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm shadow-slate-200/50">
              {/* Search & Filter Toolbar */}
              <div className="border-b border-brand-line p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative min-w-0 flex-1 lg:max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                    <Input
                      type="text"
                      className="h-10 w-full rounded-xl border-brand-line bg-white pl-9 pr-9 text-xs font-medium text-brand-ink placeholder:text-brand-muted focus-visible:border-brand-line focus-visible:ring-0 sm:text-sm"
                      placeholder="Search by name, email, or ID num..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setPage(1)
                      }}
                      aria-label="Search residents"
                    />
                    {query && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setQuery('')
                          setPage(1)
                        }}
                        aria-label="Clear search query"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full text-brand-muted hover:bg-brand-line/50 hover:text-brand-ink cursor-pointer"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>

                  {/* Barangay Filter Dropdown */}
                  <select
                    value={barangayFilter}
                    onChange={(e) => {
                      setBarangayFilter(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Filter by barangay"
                    className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                  >
                    <option value="All barangays">All barangays</option>
                    {barangayNames.map((name) => (
                      <option key={name} value={name}>
                        Brgy. {name}
                      </option>
                    ))}
                    <option value="Unassigned">Unassigned</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-brand-line bg-brand-paper/80">
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
                            <ChevronDown className="size-3.5 opacity-30" />
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
              />
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminResidents
