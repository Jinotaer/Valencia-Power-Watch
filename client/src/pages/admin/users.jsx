import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Users as UsersIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import { AdminUsersCreateDialog, AdminUsersEditDialog } from './usersModals'
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
import { createUnpersistedClient, supabase } from '../../lib/supabase'
import { sendStaffPasswordReset, setUserActive, updateAdminUser } from '../../lib/adminUsers'

// Map a public.users row to the shape used by the table (staff + admin only;
// residents are displayed on /admin/residents)
function toUser(u) {
  const role = (u.role || 'resident').toLowerCase()
  const capitalized = role.charAt(0).toUpperCase() + role.slice(1)
  return {
    id: u.id,
    idNumber: u.id_number || '\u2014',
    name: u.full_name || u.email?.split('@')[0] || 'User',
    email: u.email,
    role: capitalized,
    contactNumber: u.contact_number || '\u2014',
    position: u.position || '',
    address: u.address || '',
    isActive: u.is_active !== false,
    rawId: u.id,
    joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : '\u2014',
  }
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
  const [usersList, setUsersList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All') // 'All' | 'Staff' | 'Admin'
  const [openFilterMenu, setOpenFilterMenu] = useState(null) // 'role' | null
  const filterMenuRef = useRef(null)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  // Close whichever filter dropdown is open when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setOpenFilterMenu(null)
      }
    }
    if (openFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openFilterMenu])
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', idNumber: '', contactNumber: '', position: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWorking, setIsWorking] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    position: 'Line Crew / Responder',
    contactNumber: '',
    idNumber: 'STF-109',
  })

  // Load registered users from Supabase public.users (admins see every row)
  useEffect(() => {
    let active = true

    async function fetchUsers() {
      if (!supabase) throw new Error('Authentication is not configured in this environment.')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'resident')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }

    fetchUsers()
      .then((rows) => {
        if (!active) return
        setUsersList(rows.map(toUser))
        setLoadError('')
      })
      .catch((err) => {
        if (!active) return
        setUsersList([])
        setLoadError(
          err?.message === 'Authentication is not configured in this environment.'
            ? err.message
            : 'We could not load users. Check your connection and try again.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  // Calculate counts per role for the filter chips
  const roleCounts = useMemo(() => {
    const counts = { all: usersList.length, staff: 0, admin: 0 }
    usersList.forEach((u) => {
      const r = (u.role || '').toLowerCase()
      if (r === 'staff') counts.staff++
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
        user.idNumber.toLowerCase().includes(q)

      const matchesRole =
        roleFilter === 'All' ||
        (user.role || '').toLowerCase() === roleFilter.toLowerCase()

      return matchesQuery && matchesRole
    })

    result.sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase()
      const valB = (b[sortField] || '').toLowerCase()
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [usersList, query, roleFilter, sortField, sortOrder])

  // Pagination slice
  const visibleUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, page, pageSize])

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

    const tempAuthClient = createUnpersistedClient()
    if (!tempAuthClient) {
      setCreateError('Authentication is not configured in this environment.')
      setIsSubmitting(false)
      return
    }

    const suffix = Date.now().toString().slice(-4)
    const idNumber = newUser.idNumber || `STF-${suffix}`

    // Create the auth user with a throwaway client so the admin session is
    // untouched; the handle_new_user() trigger inserts the public.users row.
    const { error: authError } = await tempAuthClient.auth.signUp({
      email: newUser.email.trim(),
      password: newUser.password,
      options: {
        data: {
          full_name: newUser.name.trim(),
          role: 'staff',
          id_number: idNumber,
          position: newUser.position || 'Line Crew / Responder',
          contact_number: newUser.contactNumber || null,
        },
      },
    })
    setIsSubmitting(false)

    if (authError && !authError.message.toLowerCase().includes('already registered')) {
      setCreateError(authError.message || 'Could not create the account. Try again.')
      return
    }
    if (authError) {
      // The auth user (and its public.users row from the trigger) already exists
      setCreateError('An account with this email already exists.')
      return
    }

    setIsCreateOpen(false)
    reload()
    setToastMessage(`Staff account for ${newUser.name.trim()} created successfully!`)
    setTimeout(() => setToastMessage(''), 4000)

    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'Staff',
      position: 'Line Crew / Responder',
      contactNumber: '',
      idNumber: `STF-${suffix}`,
    })
  }

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 4000)
  }

  function openEdit(user) {
    setEditingUser(user)
    setEditForm({
      fullName: user.name === '\u2014' ? '' : user.name,
      idNumber: user.idNumber === '\u2014' ? '' : user.idNumber,
      contactNumber: user.contactNumber === '\u2014' ? '' : user.contactNumber,
      position: user.position || 'Line Crew / Responder',
      address: user.address || '',
    })
    setEditError('')
    setIsEditOpen(true)
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    if (!editingUser || isSubmitting) return

    setIsSubmitting(true)
    setEditError('')
    try {
      const updated = await updateAdminUser(editingUser.rawId, editForm)
      setUsersList((current) => current.map((row) => (row.rawId === updated.id ? toUser(updated.raw) : row)))
      setIsEditOpen(false)
      showToast('Staff account updated.')
    } catch (error) {
      setEditError(error.message || 'Could not update this account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive() {
    if (!editingUser || isWorking) return
    setIsWorking(true)
    setEditError('')
    try {
      const nextActive = editingUser.isActive === false
      await setUserActive(editingUser.rawId, nextActive)
      setUsersList((current) => current.map((row) => (row.rawId === editingUser.rawId ? { ...row, isActive: nextActive } : row)))
      setEditingUser((current) => current ? { ...current, isActive: nextActive } : current)
      showToast(nextActive ? 'Account reactivated.' : 'Account deactivated.')
    } catch (error) {
      setEditError(error.message || 'Could not change account status.')
    } finally {
      setIsWorking(false)
    }
  }

  async function handleResetAccess() {
    if (!editingUser || isWorking) return
    setIsWorking(true)
    setEditError('')
    try {
      await sendStaffPasswordReset(editingUser.email)
      showToast('Password reset link sent.')
    } catch (error) {
      setEditError(error.message || 'Could not send the reset link.')
    } finally {
      setIsWorking(false)
    }
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
                  Field response staff and administrator accounts — resident accounts are on the{' '}
                  <a href="/admin/residents" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                    resident directory
                  </a>
                  .
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
                        className={`size-2 rounded-full ${roleFilter === 'Staff' ? 'bg-amber-500' : 'bg-brand-blue'}`}
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

                {/* Role + Barangay Filter Dropdowns */}
                <div className="flex items-center gap-2" ref={filterMenuRef}>
                  {/* Role Filter Dropdown */}
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenFilterMenu((prev) => (prev === 'role' ? null : 'role'))}
                      className={`h-9 shrink-0 gap-2 rounded-xl border px-3 transition-all cursor-pointer ${
                        roleFilter !== 'All' || openFilterMenu === 'role'
                          ? 'border-brand-navy bg-brand-navy/10 text-brand-navy ring-2 ring-brand-navy/20'
                          : 'border-brand-line text-brand-muted hover:border-brand-line hover:bg-brand-paper'
                      }`}
                      title={`Filter by role (Current: ${roleFilter === 'All' ? 'All Roles' : roleFilter})`}
                      aria-label="Filter by role"
                      aria-expanded={openFilterMenu === 'role'}
                    >
                      <SlidersHorizontal className="size-4" />
                      <span className="text-xs font-semibold">
                        Role: {roleFilter === 'All' ? 'All' : roleFilter}
                      </span>
                      <ChevronDown className={`size-3.5 transition-transform ${openFilterMenu === 'role' ? 'rotate-180' : ''}`} />
                      {roleFilter !== 'All' && (
                        <span className="size-2 rounded-full bg-brand-navy" />
                      )}
                    </Button>

                    {openFilterMenu === 'role' && (
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
                                  setOpenFilterMenu(null)
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

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-brand-paper/60">
                    <TableRow className="border-b border-brand-line hover:bg-transparent">
                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        ID NUMBER
                      </TableHead>

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
                        CONTACT
                      </TableHead>
                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        STATUS
                      </TableHead>
                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        POSITION
                      </TableHead>
                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted text-right">
                        ACTIONS
                      </TableHead>

                      <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        JOINED
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {!isLoading && !loadError && visibleUsers.map((user) => (
                      <TableRow
                        key={user.idNumber + user.email}
                        className="border-b border-brand-line hover:bg-brand-paper/60 transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <span className="rounded-md bg-brand-paper border border-brand-line/60 px-2.5 py-1 text-xs font-semibold text-brand-muted inline-block tracking-tight">
                            {user.idNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 font-semibold text-brand-ink text-sm">
                          {user.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-brand-muted text-xs sm:text-sm whitespace-nowrap">
                          {user.contactNumber}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${user.isActive === false ? 'border-red-200 bg-red-50 text-[#b42318]' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                            <span className={`size-1.5 rounded-full ${user.isActive === false ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            {user.isActive === false ? 'Deactivated' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs font-medium text-brand-muted whitespace-nowrap">
                          {user.position || '\u2014'}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`} title="Edit" className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy">
                              <Pencil className="size-4" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-xs text-brand-muted whitespace-nowrap">
                          {user.joined}
                        </TableCell>
                      </TableRow>
                    ))}

                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-36 text-center text-sm font-semibold text-brand-muted">
                          Loading users…
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && loadError && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-36 text-center">
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

                    {!isLoading && !loadError && visibleUsers.length === 0 && (
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
        isSubmitting={isSubmitting}
        errorMessage={createError}
      />
      <AdminUsersEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        form={editForm}
        setForm={setEditForm}
        onSave={handleSaveEdit}
        onToggleActive={handleToggleActive}
        onResetAccess={handleResetAccess}
        isSubmitting={isSubmitting}
        isWorking={isWorking}
        errorMessage={editError}
        user={editingUser}
      />
    </SidebarProvider>
  )
}

export default AdminUsers
