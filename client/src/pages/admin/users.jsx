import {
  Check,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  Users as UsersIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import { AdminUsersCreateDialog } from './usersModals'
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
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'
import { createUnpersistedClient, supabase } from '../../lib/supabase'

const barangayOptions = [
  'All barangays',
  'Poblacion',
  'Guinoyuran',
  'Bagontapay',
  'Lourdes',
  'Lumbayao',
  'San Carlos',
  'Tongantongan',
  'Unassigned',
]

const initialUsers = [
  {
    idNumber: 'ADM-0001',
    name: 'System Administrator',
    email: 'admin@gmail.com',
    role: 'Admin',
    position: 'Operations Administrator',
    barangay: '—',
    status: 'Active',
    lastLogin: 'Today, 08:30 AM',
  },
  {
    idNumber: 'STF-102',
    name: 'Maria Santos',
    email: 'maria.santos@gmail.com',
    role: 'Staff',
    position: 'Line Crew 2 · Responder',
    barangay: '—',
    status: 'Active',
    lastLogin: '11/3/2026, 09:18 PM',
  },
  {
    idNumber: 'RES-201',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    role: 'Resident',
    position: 'Community Resident',
    barangay: 'Guinoyuran',
    status: 'Active',
    lastLogin: '11/4/2026, 10:15 AM',
  },
  {
    idNumber: 'STF-103',
    name: 'Joshua Cruz',
    email: 'joshua.cruz@gmail.com',
    role: 'Staff',
    position: 'Substation Technician',
    barangay: '—',
    status: 'Pending',
    lastLogin: 'Never',
  },
  {
    idNumber: 'RES-202',
    name: 'Ana Reyes',
    email: 'ana.reyes@gmail.com',
    role: 'Resident',
    position: 'Purok 4 Leader',
    barangay: 'Bagontapay',
    status: 'Active',
    lastLogin: '11/2/2026, 02:45 PM',
  },
  {
    idNumber: 'ADM-104',
    name: 'Liza Mercado',
    email: 'liza.mercado@gmail.com',
    role: 'Admin',
    position: 'Utility Supervisor',
    barangay: '—',
    status: 'Active',
    lastLogin: '11/2/2026, 04:06 PM',
  },
  {
    idNumber: 'STF-105',
    name: 'Anton Reyes',
    email: 'anton.reyes@gmail.com',
    role: 'Staff',
    position: 'Grid Maintenance Specialist',
    barangay: '—',
    status: 'Disabled',
    lastLogin: '10/20/2026, 10:11 AM',
  },
  {
    idNumber: 'RES-203',
    name: 'Pedro Santos',
    email: 'pedro.santos@gmail.com',
    role: 'Resident',
    position: 'Barangay Kagawad',
    barangay: 'Lumbayao',
    status: 'Active',
    lastLogin: '11/1/2026, 11:15 AM',
  },
  {
    idNumber: 'STF-106',
    name: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    role: 'Staff',
    position: 'Control Room Dispatcher',
    barangay: '—',
    status: 'Active',
    lastLogin: '11/1/2026, 08:30 PM',
  },
  {
    idNumber: 'RES-204',
    name: 'Jino Resident',
    email: 'jino@gmail.com',
    role: 'Resident',
    position: 'Community Resident',
    barangay: 'Poblacion',
    status: 'Active',
    lastLogin: 'Recent',
  },
]

function StatusPill({ status }) {
  const styles = {
    Active: 'border-emerald-200 bg-emerald-50/90 text-emerald-700',
    Pending: 'border-amber-200 bg-amber-50/90 text-amber-700',
    Disabled: 'border-brand-line bg-[#e5e9f6] text-brand-muted',
  }
  const dotColors = {
    Active: 'bg-emerald-500',
    Pending: 'bg-amber-500',
    Disabled: 'bg-brand-muted',
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

function RoleBadge({ role }) {
  const r = (role || '').toLowerCase()
  if (r === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-[#e5e9f6] px-2.5 py-0.5 text-xs font-bold text-brand-blue">
        <span className="size-1.5 rounded-full bg-brand-blue" />
        Admin
      </span>
    )
  }
  if (r === 'staff') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Staff
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-[#e5e9f6] px-2.5 py-0.5 text-xs font-bold text-brand-blue">
      <span className="size-1.5 rounded-full bg-brand-blue" />
      Resident
    </span>
  )
}

function AdminUsers() {
  const [usersList, setUsersList] = useState(initialUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All') // 'All' | 'Resident' | 'Staff' | 'Admin'
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const roleDropdownRef = useRef(null)
  const [statusFilter, setStatusFilter] = useState('All')

  // Click outside listener for the role filter dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false)
      }
    }
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRoleDropdownOpen])
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    position: 'Line Crew / Responder',
    contactNumber: '',
    status: 'Active',
    idNumber: 'STF-109',
  })

  // Load registered users from Supabase public.users on mount
  useEffect(() => {
    if (!supabase) return
    async function loadUsers() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const dbUsers = data.map((u) => {
            const rawRole = (u.role || 'resident').toLowerCase()
            const capitalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1)
            return {
              id: u.id,
              idNumber: u.id_number || `U-${u.id ? u.id.slice(0, 6) : '001'}`,
              name: u.full_name || u.email?.split('@')[0] || 'User',
              email: u.email,
              role: capitalizedRole,
              position:
                capitalizedRole === 'Staff'
                  ? 'Field Staff'
                  : capitalizedRole === 'Admin'
                    ? 'Administrator'
                    : 'Community Resident',
              barangay: capitalizedRole === 'Staff' ? '—' : u.address || 'Unassigned',
              contactNumber: u.contact_number || '',
              status: 'Active',
              lastLogin: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent',
            }
          })

          setUsersList((prev) => {
            const existingEmails = new Set(dbUsers.map((u) => u.email.toLowerCase()))
            const remainingDefaults = prev.filter((u) => !existingEmails.has(u.email.toLowerCase()))
            return [...dbUsers, ...remainingDefaults]
          })
        }
      } catch (err) {
        console.warn('Could not load from Supabase users:', err)
      }
    }
    loadUsers()
  }, [])

  // Calculate counts per role for the filter chips
  const roleCounts = useMemo(() => {
    const counts = { all: usersList.length, resident: 0, staff: 0, admin: 0 }
    usersList.forEach((u) => {
      const r = (u.role || '').toLowerCase()
      if (r === 'resident') counts.resident++
      else if (r === 'staff') counts.staff++
      else if (r === 'admin') counts.admin++
    })
    return counts
  }, [usersList])

  // Handle column sorting
  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filter & sort logic (Search + Role + Status + Barangay)
  const filteredUsers = useMemo(() => {
    let result = usersList.filter((user) => {
      const q = query.toLowerCase()
      const matchesQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.idNumber.toLowerCase().includes(q) ||
        (user.position || '').toLowerCase().includes(q)

      const matchesRole =
        roleFilter === 'All' ||
        (user.role || '').toLowerCase() === roleFilter.toLowerCase()

      const matchesStatus = statusFilter === 'All' || user.status === statusFilter

      const matchesBarangay =
        barangayFilter === 'All barangays' ||
        (user.role === 'Resident' && (user.barangay || 'Unassigned') === barangayFilter)

      return matchesQuery && matchesRole && matchesStatus && matchesBarangay
    })

    result.sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase()
      const valB = (b[sortField] || '').toLowerCase()
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [usersList, query, roleFilter, statusFilter, barangayFilter, sortField, sortOrder])

  // Pagination slice
  const visibleUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page, pageSize])

  // Handle Create Staff Account (Supabase Auth + Database + Local State)
  async function handleCreateUser(e) {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setCreateError('Full name and email address are required.')
      return
    }
    if (!newUser.password || newUser.password.length < 6) {
      setCreateError('Please provide a password of at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    setCreateError('')

    const prefix = 'STF'
    const suffix = Date.now().toString().slice(-4)
    const idNumber = newUser.idNumber || `${prefix}-${suffix}`
    const normalizedRole = 'staff'

    try {
      // 1. Create in Supabase Auth using unpersisted client (does not disrupt admin login session)
      const tempAuthClient = createUnpersistedClient()
      if (tempAuthClient) {
        const { error: authError } = await tempAuthClient.auth.signUp({
          email: newUser.email.trim(),
          password: newUser.password,
          options: {
            data: {
              full_name: newUser.name.trim(),
              role: normalizedRole,
              id_number: idNumber,
              position: newUser.position || 'Line Crew / Responder',
              contact_number: newUser.contactNumber || null,
            },
          },
        })
        if (authError && !authError.message.toLowerCase().includes('already registered')) {
          console.warn('Auth notice:', authError.message)
        }
      }

      // 2. Insert or upsert directly into public.users table in Supabase
      if (supabase) {
        const { error: dbError } = await supabase.from('users').upsert(
          {
            id: crypto.randomUUID(),
            id_number: idNumber,
            email: newUser.email.trim(),
            full_name: newUser.name.trim(),
            role: normalizedRole,
            contact_number: newUser.contactNumber || null,
            address: null, // Staff is citywide / no specific barangay
            created_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        if (dbError) {
          console.warn('Database upsert notice:', dbError.message)
        }
      }
    } catch (err) {
      console.warn('Error during staff registration sync:', err)
    }

    // 3. Immediately reflect in UI table
    const created = {
      idNumber,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: 'Staff',
      position: newUser.position || 'Line Crew / Responder',
      barangay: '—',
      contactNumber: newUser.contactNumber || '',
      status: newUser.status || 'Active',
      lastLogin: 'Never',
    }

    setUsersList((prev) => [created, ...prev])
    setIsSubmitting(false)
    setIsCreateOpen(false)

    setToastMessage(`Staff account for ${created.name} created successfully!`)
    setTimeout(() => setToastMessage(''), 4000)

    // Reset form
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'Staff',
      position: 'Line Crew / Responder',
      contactNumber: '',
      status: 'Active',
      idNumber: `STF-${(Date.now() % 1000).toString().padStart(3, '0')}`,
    })
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/users" />
      <SidebarInset className="bg-brand-paper min-h-screen">
        <AdminNavbar title="Dashboard" section="Users" />

        {/* Success Toast */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3">
            <Check className="size-4 text-brand-yellow" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {/* Page Header: Title + Create User Button */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-ink flex items-center gap-2.5">
                  <UsersIcon className="size-6 text-brand-navy" />
                  <span>Users Directory</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-brand-muted">
                  Manage resident accounts, field response staff, and system administrators.
                </p>
              </div>

              <Button
                onClick={() => {
                  setCreateError('')
                  setIsCreateOpen(true)
                }}
                className="h-10 gap-2 bg-brand-navy hover:bg-brand-navy active:bg-brand-navy px-4 font-semibold text-white shadow-xs rounded-xl transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Create user</span>
              </Button>
            </div>

            {/* Table Container Card */}
            <section className="overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-xs">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col gap-3 p-4 border-b border-brand-line sm:flex-row sm:items-center sm:justify-between">
                {/* Search Bar + Active Role Badge */}
                <div className="flex flex-wrap items-center gap-2">
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
                      aria-label="Search users"
                    />
                  </div>

                  {/* Active Role Filter Chip */}
                  {roleFilter !== 'All' && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-brand-line bg-brand-paper px-2.5 py-1 text-xs font-bold text-brand-ink shadow-2xs animate-in fade-in">
                      <span
                        className={`size-2 rounded-full ${
                          roleFilter === 'Resident'
                            ? 'bg-brand-blue'
                            : roleFilter === 'Staff'
                              ? 'bg-amber-500'
                              : 'bg-brand-blue'
                        }`}
                      />
                      <span>Role: {roleFilter}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRoleFilter('All')
                          setPage(1)
                        }}
                        className="ml-1 text-brand-muted hover:text-brand-ink font-bold cursor-pointer"
                        title="Clear role filter"
                        aria-label="Clear role filter"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Filter Pills + Role Filter Dropdown Button */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  <div className="flex items-center gap-1 rounded-xl bg-[#e5e9f6]/80 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('All')
                        setPage(1)
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'All'
                          ? 'bg-white text-brand-ink shadow-xs'
                          : 'text-brand-muted hover:text-brand-ink'
                      }`}
                    >
                      All status
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'Active'
                          ? 'bg-white text-brand-ink shadow-xs'
                          : 'text-brand-muted hover:text-brand-ink'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'Pending'
                          ? 'bg-white text-brand-ink shadow-xs'
                          : 'text-brand-muted hover:text-brand-ink'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(statusFilter === 'Disabled' ? 'All' : 'Disabled')
                        setPage(1)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === 'Disabled'
                          ? 'bg-white text-brand-ink shadow-xs'
                          : 'text-brand-muted hover:text-brand-ink'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-brand-muted" />
                      Disabled
                    </button>
                  </div>

                  {/* Role Filter Dropdown Button */}
                  <div className="relative" ref={roleDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                      className={`h-9 shrink-0 gap-2 rounded-xl border px-3 transition-all cursor-pointer ${
                        roleFilter !== 'All' || isRoleDropdownOpen
                          ? 'border-brand-navy bg-brand-navy/10 text-brand-navy ring-2 ring-brand-navy/20'
                          : 'border-brand-line text-brand-muted hover:border-brand-line hover:bg-brand-paper'
                      }`}
                      title={`Filter by role (Current: ${roleFilter === 'All' ? 'All Roles' : roleFilter})`}
                      aria-label="Filter by role"
                      aria-expanded={isRoleDropdownOpen}
                    >
                      <SlidersHorizontal className="size-4" />
                      <span className="text-xs font-semibold">
                        Role: {roleFilter === 'All' ? 'All' : roleFilter}
                      </span>
                      <ChevronDown className={`size-3.5 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                      {roleFilter !== 'All' && (
                        <span className="size-2 rounded-full bg-brand-navy" />
                      )}
                    </Button>

                    {/* Floating Role Menu */}
                    {isRoleDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-brand-line bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-brand-line mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                            Filter by Role
                          </span>
                          {roleFilter !== 'All' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRoleFilter('All')
                                setPage(1)
                              }}
                              className="text-[10px] font-semibold text-brand-navy hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          {[
                            { label: 'All Roles', value: 'All', count: roleCounts.all, dot: 'bg-brand-muted' },
                            { label: 'Residents', value: 'Resident', count: roleCounts.resident, dot: 'bg-brand-blue' },
                            { label: 'Field Staff', value: 'Staff', count: roleCounts.staff, dot: 'bg-amber-500' },
                            { label: 'Administrators', value: 'Admin', count: roleCounts.admin, dot: 'bg-brand-blue' },
                          ].map((item) => {
                            const isSelected = roleFilter === item.value
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  setRoleFilter(item.value)
                                  setPage(1)
                                  setIsRoleDropdownOpen(false)
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#e5e9f6] text-brand-ink font-bold'
                                    : 'text-brand-muted hover:bg-brand-paper hover:text-brand-ink'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`size-2 rounded-full ${item.dot}`} />
                                  <span>{item.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded-full bg-brand-line/80 px-1.5 py-0.5 text-[10px] text-brand-muted font-medium">
                                    {item.count}
                                  </span>
                                  {isSelected && <Check className="size-3.5 text-brand-navy" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Barangay Tabs */}
              <div className="border-b border-brand-line px-4 pt-3">
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
                        className="min-h-11 shrink-0 rounded-none px-3 text-xs text-brand-muted data-active:font-semibold data-active:text-brand-navy after:bottom-0"
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
                            <ChevronDown className="size-3.5 opacity-30" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        ID NUMBER
                      </TableHead>

                      <TableHead
                        onClick={() => toggleSort('role')}
                        className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted cursor-pointer select-none hover:text-brand-ink"
                      >
                        <div className="flex items-center gap-1">
                          <span>ROLE</span>
                          {sortField === 'role' ? (
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
                        POSITION / NOTE
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        BARANGAY
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        STATUS
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        LAST ACTIVITY
                      </TableHead>

                      <TableHead className="h-11 w-10 px-3"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visibleUsers.map((user) => (
                      <TableRow
                        key={user.idNumber + user.email}
                        className="border-b border-brand-line hover:bg-brand-paper/60 transition-colors"
                      >
                        <TableCell className="px-5 py-4 font-semibold text-brand-ink text-sm">
                          {user.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="rounded-md bg-brand-paper border border-brand-line/60 px-2.5 py-1 text-xs font-semibold text-brand-muted inline-block tracking-tight">
                            {user.idNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm">
                          {user.position}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm">
                          {user.barangay || 'Unassigned'}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <StatusPill status={user.status} />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-brand-muted whitespace-nowrap">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell className="px-3 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-brand-muted hover:text-brand-ink hover:bg-[#e5e9f6] rounded-md cursor-pointer"
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
                          className="h-36 text-center text-sm text-brand-muted"
                        >
                          No users found matching this filter combination.
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

      {/* Create User Dialog */}
      <AdminUsersCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        newUser={newUser}
        setNewUser={setNewUser}
        onCreateUser={handleCreateUser}
        barangayOptions={barangayOptions}
        isSubmitting={isSubmitting}
        errorMessage={createError}
      />
    </SidebarProvider>
  )
}

export default AdminUsers
