import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import { AdminUsersCreateDialog, AdminUsersEditDialog } from '../../components/admin/usersModals'
import PageHeader from '../../components/common/pageHeader'
import Pagination from '../../components/common/pagination'
import AdminSidebar from '../../components/admin/sidebar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'
import { createUnpersistedClient, supabase } from '../../lib/supabase'
import { sendStaffPasswordReset, setUserActive, updateAdminUser } from '../../lib/adminUsers'
import { loadTeams } from '../../lib/teams'

// Map a public.users row to the shape used by the table (staff + admin only;
// residents are displayed on /admin/residents)
function toUser(u, teamsMap = {}) {
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
    teamId: u.team_id || null,
    teamName: teamsMap[u.team_id] || '',
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

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [teamsList, setTeamsList] = useState([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', idNumber: '', contactNumber: '', position: '', address: '', teamId: '' })
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
    address: '',
    idNumber: 'STF-109',
    teamId: '',
  })

  // Load registered users and field teams from Supabase
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

    Promise.all([fetchUsers(), loadTeams().catch(() => [])])
      .then(([rows, teamsData]) => {
        if (!active) return
        setTeamsList(teamsData || [])
        const teamsMap = Object.fromEntries((teamsData || []).map((t) => [t.id, t.name]))
        setUsersList(rows.map((r) => toUser(r, teamsMap)))
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
          contact_number: newUser.contactNumber ? newUser.contactNumber.trim() : null,
          address: newUser.address ? newUser.address.trim() : null,
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

    if ((newUser.teamId || newUser.address) && supabase) {
      try {
        const updatePayload = {}
        if (newUser.teamId) updatePayload.team_id = newUser.teamId
        if (newUser.address) updatePayload.address = newUser.address.trim()
        await supabase.from('users').update(updatePayload).eq('email', newUser.email.trim())
      } catch (err) {
        console.warn('Could not assign team/address to user:', err)
      }
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
      address: '',
      idNumber: `STF-${suffix}`,
      teamId: '',
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
      teamId: user.teamId || '',
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
      const teamsMap = Object.fromEntries(teamsList.map((t) => [t.id, t.name]))
      setUsersList((current) => current.map((row) => (row.rawId === updated.id ? toUser(updated.raw, teamsMap) : row)))
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
            <PageHeader
              className="mb-6"
              title="Users Directory"
              description={
                <>
                  Field response staff and administrator accounts — resident accounts are on the{' '}
                  <a href="/admin/residents" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
                    resident directory
                  </a>
                  .
                </>
              }
              actions={
                <Button
                  onClick={() => {
                    setCreateError('')
                    setIsCreateOpen(true)
                  }}
                  className="h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
                >
                  <Plus className="size-4" />
                  <span>New User</span>
                </Button>
              }
            />

            {/* Table Container Card */}
            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm shadow-slate-200/50">
              <div className="border-b border-brand-line p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative min-w-0 flex-1 lg:max-w-md">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted"
                      aria-hidden="true"
                    />
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Search by name, email, or ID number..."
                      aria-label="Search users"
                      className="h-10 w-full rounded-xl border-brand-line bg-white pl-9 pr-9 text-xs font-medium text-brand-ink placeholder:text-brand-muted focus-visible:border-brand-line focus-visible:ring-0 sm:text-sm"
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

                  {/* Role Filter Dropdown */}
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Filter by role"
                    className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                  >
                    <option value="All">All roles</option>
                    <option value="Staff">Field Staff</option>
                    <option value="Admin">Administrators</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-line bg-brand-paper/80 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      <th className="h-11 px-5">ID number</th>
                      <th className="h-11 px-5">
                        <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 cursor-pointer hover:text-brand-ink">
                          <span>Name</span>
                          {sortField === 'name' ? (
                            sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronUp className="size-3.5 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="h-11 px-5">
                        <button type="button" onClick={() => toggleSort('email')} className="inline-flex items-center gap-1 cursor-pointer hover:text-brand-ink">
                          <span>Email</span>
                          {sortField === 'email' ? (
                            sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="h-11 px-5">
                        <button type="button" onClick={() => toggleSort('role')} className="inline-flex items-center gap-1 cursor-pointer hover:text-brand-ink">
                          <span>Role</span>
                          {sortField === 'role' ? (
                            sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="h-11 px-5">Contact</th>
                      <th className="h-11 px-5">Position</th>
                      <th className="h-11 px-5">Field Team</th>
                      <th className="h-11 px-5">Joined</th>
                      <th className="h-11 px-5">Status</th>
                      <th className="h-11 px-5 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-line">
                    {!isLoading && !loadError && visibleUsers.map((user) => (
                      <tr
                        key={user.idNumber + user.email}
                        className="transition-colors hover:bg-brand-paper/70"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-block rounded-md border border-brand-line bg-brand-paper px-2 py-0.5 text-xs font-semibold tracking-tight text-brand-muted">
                            {user.idNumber}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-brand-ink">{user.name}</td>
                        <td className="px-5 py-4 text-xs text-brand-muted sm:text-sm">{user.email}</td>
                        <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-brand-muted sm:text-sm">{user.contactNumber}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-brand-muted">
                          {user.position || '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-medium">
                          {user.teamName ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-brand-blue">
                              {user.teamName}
                            </span>
                          ) : (
                            <span className="text-brand-muted italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-brand-muted">{user.joined}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${user.isActive === false ? 'border-[#f3c7c3] bg-red-50 text-[#b42318]' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                            <span className={`size-1.5 rounded-full ${user.isActive === false ? 'bg-[#b42318]' : 'bg-emerald-500'}`} />
                            {user.isActive === false ? 'Deactivated' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`} title="Edit" className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy">
                              <Pencil className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {isLoading && (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-sm font-semibold text-brand-muted">
                          Loading users…
                        </td>
                      </tr>
                    )}

                    {!isLoading && loadError && (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center">
                          <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                          <button
                            type="button"
                            onClick={reload}
                            className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4"
                          >
                            Try again
                          </button>
                        </td>
                      </tr>
                    )}

                    {!isLoading && !loadError && visibleUsers.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-sm text-brand-muted">
                          No users found matching this filter combination.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
        teamsList={teamsList}
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
        teamsList={teamsList}
        isSubmitting={isSubmitting}
        isWorking={isWorking}
        errorMessage={editError}
        user={editingUser}
      />
    </SidebarProvider>
  )
}

export default AdminUsers
