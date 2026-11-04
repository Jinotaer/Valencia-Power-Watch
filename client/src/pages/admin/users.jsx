import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'

const barangayOptions = [
  'All barangays',
  'Poblacion',
  'Bagontapay',
  'Lourdes',
  'Lumbayao',
  'San Carlos',
  'Tongantongan',
  'Unassigned',
]

const initialUsers = [
  {
    idNumber: 'P - 101',
    name: 'admin',
    email: 'admin@gmail.com',
    role: 'Admin',
    position: 'Administrative Aide VI',
    status: 'Active',
    lastLogin: '11/3/2026, 11:09:09 PM',
  },
  {
    idNumber: 'P - 102',
    name: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    role: 'Staff',
    position: 'Laboratory Technician',
    status: 'Active',
    lastLogin: '11/3/2026, 09:18:22 PM',
  },
  {
    idNumber: 'P - 103',
    name: 'Joshua Cruz',
    email: 'joshua.cruz@gmail.com',
    role: 'Staff',
    position: 'Research Assistant',
    status: 'Pending',
    lastLogin: 'Never',
  },
  {
    idNumber: 'P - 104',
    name: 'Liza Mercado',
    email: 'liza.mercado@gmail.com',
    role: 'Admin',
    position: 'Operations Administrator',
    status: 'Active',
    lastLogin: '11/2/2026, 04:06:15 PM',
  },
  {
    idNumber: 'P - 105',
    name: 'Anton Reyes',
    email: 'anton.reyes@gmail.com',
    role: 'Staff',
    position: 'Chemical Custodian',
    status: 'Disabled',
    lastLogin: '10/20/2026, 10:11:04 AM',
  },
  {
    idNumber: 'P - 106',
    name: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    role: 'Staff',
    position: 'Senior Microbiologist',
    status: 'Active',
    lastLogin: '11/1/2026, 08:30:19 PM',
  },
  {
    idNumber: 'P - 107',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@gmail.com',
    role: 'Staff',
    position: 'Equipment Specialist',
    status: 'Pending',
    lastLogin: 'Never',
  },
  {
    idNumber: 'P - 108',
    name: 'Nina Garcia',
    email: 'nina.garcia@gmail.com',
    role: 'Staff',
    position: 'Quality Analyst',
    status: 'Active',
    lastLogin: '10/28/2026, 03:15:40 PM',
  },
]

function StatusPill({ status }) {
  const styles = {
    Active: 'border-emerald-200 bg-emerald-50/90 text-emerald-700',
    Pending: 'border-amber-200 bg-amber-50/90 text-amber-700',
    Disabled: 'border-slate-200 bg-slate-100 text-slate-500',
  }
  const dotColors = {
    Active: 'bg-emerald-500',
    Pending: 'bg-amber-500',
    Disabled: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.Active}`}
    >
      <span className={`size-1.5 rounded-full ${dotColors[status] || dotColors.Active}`} />
      {status}
    </span>
  )
}

function AdminUsers() {
  const [usersList, setUsersList] = useState(initialUsers)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Staff',
    position: '',
    barangay: 'Unassigned',
    idNumber: `P - ${100 + usersList.length + 1}`,
  })

  // Handle column sorting
  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filter & sort logic
  const filteredUsers = useMemo(() => {
    let result = usersList.filter((user) => {
      const q = query.toLowerCase()
      const matchesQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.idNumber.toLowerCase().includes(q) ||
        user.position.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter
      const matchesBarangay =
        barangayFilter === 'All barangays' ||
        (user.barangay || 'Unassigned') === barangayFilter
      return matchesQuery && matchesStatus && matchesBarangay
    })

    result.sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase()
      const valB = (b[sortField] || '').toLowerCase()
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [usersList, query, statusFilter, barangayFilter, sortField, sortOrder])

  // Pagination slice
  const visibleUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page, pageSize])

  function handleCreateStaff(e) {
    e.preventDefault()
    if (!newStaff.name.trim() || !newStaff.email.trim()) return
    const created = {
      ...newStaff,
      status: 'Active',
      lastLogin: 'Never',
    }
    setUsersList([created, ...usersList])
    setIsCreateOpen(false)
    setNewStaff({
      name: '',
      email: '',
      role: 'Staff',
      position: '',
      barangay: 'Unassigned',
      idNumber: `P - ${100 + usersList.length + 2}`,
    })
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/users" />
      <SidebarInset className="bg-[#f8fafc] min-h-screen">
        <AdminNavbar title="Dashboard" section="Users" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {/* Page Header: Title + Create Staff Button */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Users
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Admin-managed staff accounts.
                </p>
              </div>

              <Button
                onClick={() => setIsCreateOpen(true)}
                className="h-10 gap-2 bg-[#0e4d64] hover:bg-[#0a3a4b] active:bg-[#072d3a] px-4 font-semibold text-white shadow-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Create staff</span>
              </Button>
            </div>

            {/* Table Container Card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0e4d64] focus:ring-1 focus:ring-[#0e4d64]"
                    placeholder="Search users by name, email, or ID num"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search users"
                  />
                </div>

                {/* Status Filter Pills & Filter Button */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('All')
                        setPage(1)
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'All'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'Pending'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'Active'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(statusFilter === 'Disabled' ? 'All' : 'Disabled')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'Disabled'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-slate-400" />
                      Disabled
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                    aria-label="Filter"
                  >
                    <SlidersHorizontal className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="border-b border-slate-100 px-4 pt-3">
                <Tabs
                  value={barangayFilter}
                  onValueChange={(value) => {
                    setBarangayFilter(value)
                    setPage(1)
                  }}
                >
                  <TabsList
                    variant="line"
                    aria-label="Filter users by barangay"
                    className="max-w-full gap-0 overflow-x-auto rounded-none p-0"
                  >
                    {barangayOptions.map((barangay) => (
                      <TabsTrigger
                        key={barangay}
                        value={barangay}
                        className="min-h-11 shrink-0 rounded-none px-3 text-xs text-slate-500 data-active:font-semibold data-active:text-[#0e4d64] after:bottom-0"
                      >
                        {barangay}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/60">
                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                      {/* Name column with sort toggle */}
                      <TableHead
                        onClick={() => toggleSort('name')}
                        className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800"
                      >
                        <div className="flex items-center gap-1">
                          <span>NAME</span>
                          {sortField === 'name' ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="size-3.5 text-[#0e4d64]" />
                            ) : (
                              <ChevronDown className="size-3.5 text-[#0e4d64]" />
                            )
                          ) : (
                            <ChevronUp className="size-3.5 opacity-30" />
                          )}
                        </div>
                      </TableHead>

                      {/* Email column with sort toggle */}
                      <TableHead
                        onClick={() => toggleSort('email')}
                        className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800"
                      >
                        <div className="flex items-center gap-1">
                          <span>EMAIL</span>
                          {sortField === 'email' ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="size-3.5 text-[#0e4d64]" />
                            ) : (
                              <ChevronDown className="size-3.5 text-[#0e4d64]" />
                            )
                          ) : (
                            <ChevronDown className="size-3.5 opacity-30" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        ID NUMBER
                      </TableHead>

                      {/* Role column with sort toggle */}
                      <TableHead
                        onClick={() => toggleSort('role')}
                        className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800"
                      >
                        <div className="flex items-center gap-1">
                          <span>ROLE</span>
                          {sortField === 'role' ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="size-3.5 text-[#0e4d64]" />
                            ) : (
                              <ChevronDown className="size-3.5 text-[#0e4d64]" />
                            )
                          ) : (
                            <ChevronDown className="size-3.5 opacity-30" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        POSITION
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        BARANGAY
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        STATUS
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        LAST LOGIN
                      </TableHead>

                      <TableHead className="h-11 w-10 px-3"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visibleUsers.map((user) => (
                      <TableRow
                        key={user.idNumber}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="px-5 py-4 font-semibold text-slate-900 text-sm">
                          {user.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-slate-500 text-xs sm:text-sm">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="rounded-md bg-[#f1f5f9] border border-slate-200/60 px-2.5 py-1 text-xs font-semibold text-[#334155] inline-block tracking-tight">
                            {user.idNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-slate-700 text-xs sm:text-sm">
                          {user.role}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-slate-600 text-xs sm:text-sm">
                          {user.position}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-slate-600 text-xs sm:text-sm">
                          {user.barangay || 'Unassigned'}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <StatusPill status={user.status} />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell className="px-3 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                            aria-label={`Actions for ${user.name}`}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {visibleUsers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-36 text-center text-sm text-slate-400"
                        >
                          No users found for this barangay and filter combination.
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
                total={filteredUsers.length}
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

      {/* Create Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Create Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a new staff member with verified laboratory credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Full Name</label>
              <Input
                required
                placeholder="e.g. Maria Santos"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Email Address</label>
              <Input
                required
                type="email"
                placeholder="staff@example.com"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Role</label>
                <Input
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  placeholder="Staff / Admin"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">ID Number</label>
                <Input
                  value={newStaff.idNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, idNumber: e.target.value })}
                  placeholder="P - 109"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Position</label>
              <Input
                placeholder="e.g. Laboratory Technician"
                value={newStaff.position}
                onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
            <label htmlFor="staff-barangay" className="text-xs font-semibold text-slate-500">
              Barangay
            </label>
            <select
              id="staff-barangay"
              value={newStaff.barangay || 'Unassigned'}
              onChange={(e) => setNewStaff({ ...newStaff, barangay: e.target.value })}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#0e4d64] focus:ring-1 focus:ring-[#0e4d64]"
            >
              {barangayOptions.slice(1).map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0e4d64] hover:bg-[#0a3a4b] text-white rounded-lg text-xs font-semibold"
              >
                Create Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

export default AdminUsers
