import {
  AlertTriangle,
  Check,
  CheckCircle2,
  HardHat,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import Pagination from '../../components/common/pagination'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { createTeam, deleteTeam, loadTeams, updateTeam } from '../../lib/teams'
import { supabase } from '../../lib/supabase'
import {
  TeamCreateDialog,
  TeamDeleteDialog,
  TeamEditDialog,
} from '../../components/admin/teamsModals'

function TeamStatusBadge({ status, activeJobCount }) {
  const s = String(status || '').toLowerCase()
  if (s === 'dispatched' || activeJobCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
        <span className="size-1.5 rounded-full bg-brand-blue animate-pulse" />
        Dispatched ({activeJobCount} active)
      </span>
    )
  }
  if (s === 'offline') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
        <span className="size-1.5 rounded-full bg-slate-400" />
        Offline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Available
    </span>
  )
}

export default function AdminTeams() {
  const [teams, setTeams] = useState([])
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Filters & display state
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'available' | 'dispatched' | 'offline'
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [deletingTeam, setDeletingTeam] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    leaderId: '',
    vehiclePlate: '',
    contactNumber: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((v) => v + 1)
  }

  useEffect(() => {
    let active = true

    async function fetchData() {
      if (!supabase) return [[], []]
      const [teamsData, { data: staffData }] = await Promise.all([
        loadTeams(),
        supabase.from('users').select('id, full_name, email, position').neq('role', 'resident'),
      ])

      const staffFormatted = (staffData || []).map((u) => ({
        id: u.id,
        name: u.full_name || u.email?.split('@')[0] || 'Staff',
        email: u.email,
        position: u.position || '',
      }))

      return [teamsData, staffFormatted]
    }

    fetchData()
      .then(([teamsList, staff]) => {
        if (!active) return
        setTeams(teamsList)
        setStaffList(staff)
      })
      .catch((err) => {
        if (!active) return
        setTeams([])
        setLoadError(
          err?.message || 'We could not load field teams. Please run supabase/teams.sql and try again.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  // Filtered teams list
  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.leaderName.toLowerCase().includes(q) ||
        t.vehiclePlate.toLowerCase().includes(q) ||
        t.members.some((m) => m.name.toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'dispatched'
          ? t.status === 'dispatched' || t.activeJobCount > 0
          : t.status === statusFilter)

      return matchesQuery && matchesStatus
    })
  }, [teams, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedTeams = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredTeams.slice(start, start + pageSize)
  }, [filteredTeams, safePage, pageSize])

  // Modal Handlers
  const handleOpenEdit = (team) => {
    setEditingTeam(team)
    setEditForm({
      name: team.name,
      description: team.description,
      leaderId: team.leaderId || '',
      vehiclePlate: team.vehiclePlate || '',
      contactNumber: team.contactNumber || '',
      status: team.status || 'available',
    })
    setActionError('')
    setIsEditOpen(true)
  }

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault()
    if (!newTeam.name.trim() || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')
    try {
      await createTeam(newTeam)
      setIsCreateOpen(false)
      setNewTeam({
        name: '',
        description: '',
        leaderId: '',
        vehiclePlate: '',
        contactNumber: '',
      })
      reload()
      showToast('Field team registered successfully.')
    } catch (err) {
      setActionError(err.message || 'Could not register team. Check for duplicate team names.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingTeam || !editForm || isSubmitting) return

    setIsSubmitting(true)
    setActionError('')
    try {
      await updateTeam(editingTeam.id, editForm)
      setIsEditOpen(false)
      setEditingTeam(null)
      reload()
      showToast('Team settings updated.')
    } catch (err) {
      setActionError(err.message || 'Could not update team settings.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeamSubmit = async () => {
    if (!deletingTeam || isSubmitting) return

    setIsSubmitting(true)
    try {
      await deleteTeam(deletingTeam.id)
      setDeletingTeam(null)
      reload()
      showToast('Team disbanded.')
    } catch (err) {
      showToast(err.message || 'Could not disband team.')
      setDeletingTeam(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/teams" />
      <SidebarInset className="bg-brand-paper min-h-screen">
        <AdminNavbar title="Field Teams" section="Team roster & dispatch" />

        {toastMessage && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3">
            <Check className="size-4 text-brand-yellow" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header: Title + Action Buttons matching barangay.jsx */}
            <PageHeader
              title="Field Teams"
              description="Organize line technicians into dispatchable units, assign utility trucks, and track crew assignments across Valencia City."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reload}
                    disabled={isLoading}
                    className="h-10 gap-2 rounded-lg border border-brand-line bg-white px-3.5 text-xs font-semibold text-brand-navy hover:bg-brand-paper transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`size-4 text-brand-muted ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setActionError('')
                      setIsCreateOpen(true)
                    }}
                    className="h-10 gap-2 bg-brand-blue hover:bg-brand-navy px-4 font-semibold text-white shadow-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>Add Team</span>
                  </Button>
                </div>
              }
            />

            {/* Main Table / Grid Card matching barangay.jsx */}
            <section className="overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-xs">
              {/* Filter Toolbar */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-brand-line">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search Bar */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                    <Input
                      className="h-10 rounded-lg border-brand-line bg-white pl-9 text-xs sm:text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      placeholder="Search team, leader, truck, or member..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setPage(1)
                      }}
                      aria-label="Search teams"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setPage(1)
                      }}
                      className="h-10 rounded-lg border border-brand-line bg-white px-3 text-xs sm:text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue cursor-pointer"
                    >
                      <option value="all">All Operational Statuses</option>
                      <option value="available">Available (Ready)</option>
                      <option value="dispatched">Dispatched (Active)</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>

                {/* View Mode Toggle: Table or Grid */}
                <div className="flex items-center rounded-lg border border-brand-line p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-[#e5e9f6] text-brand-ink' : 'text-brand-muted'
                    }`}
                    aria-label="Table view"
                  >
                    <TableIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#e5e9f6] text-brand-ink' : 'text-brand-muted'
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                </div>
              </div>

              {/* Data States */}
              {isLoading ? (
                <div className="h-44 grid place-items-center text-sm font-semibold text-brand-muted animate-pulse">
                  Loading field teams and crew rosters…
                </div>
              ) : loadError ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button
                    type="button"
                    onClick={reload}
                    className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="p-12 text-center text-sm text-brand-muted">
                  <Users className="size-8 mx-auto text-brand-muted/60 mb-2" />
                  <p className="font-bold text-brand-navy">No field teams found.</p>
                  <p className="text-xs mt-1">
                    {query || statusFilter !== 'all'
                      ? 'Try adjusting your search query or status filter.'
                      : 'Click "Add Team" to register your first line crew.'}
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                /* Table View */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-brand-paper/60">
                      <TableRow className="border-b border-brand-line hover:bg-transparent">
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          TEAM & VEHICLE
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          STATUS
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          TEAM LEADER
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          CREW ROSTER
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          ACTIVE INCIDENTS
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted text-right">
                          ACTIONS
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedTeams.map((team) => (
                        <TableRow
                          key={team.id}
                          className="border-b border-brand-line hover:bg-brand-paper/60 transition-colors"
                        >
                          {/* Team Name & Vehicle */}
                          <TableCell className="px-5 py-4">
                            <div className="font-bold text-brand-navy text-sm">{team.name}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-brand-muted">
                              {team.vehiclePlate && (
                                <span className="inline-flex items-center gap-1 font-mono font-semibold bg-brand-paper border border-brand-line px-1.5 py-0.5 rounded text-[11px] text-brand-ink">
                                  <Truck className="size-3 text-brand-muted" />
                                  {team.vehiclePlate}
                                </span>
                              )}
                              {team.contactNumber && (
                                <span className="inline-flex items-center gap-1 text-[11px]">
                                  <Radio className="size-3 text-brand-muted" />
                                  {team.contactNumber}
                                </span>
                              )}
                            </div>
                            {team.description && (
                              <p className="text-[11px] text-brand-muted mt-1 max-w-[260px] truncate">
                                {team.description}
                              </p>
                            )}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell className="px-5 py-4">
                            <TeamStatusBadge
                              status={team.status}
                              activeJobCount={team.activeJobCount}
                            />
                          </TableCell>

                          {/* Team Leader */}
                          <TableCell className="px-5 py-4">
                            {team.leaderName ? (
                              <div className="flex items-center gap-2">
                                <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                  <HardHat className="size-3.5" />
                                </span>
                                <div>
                                  <div className="font-bold text-xs text-brand-ink">
                                    {team.leaderName}
                                  </div>
                                  <div className="text-[10px] text-brand-muted">Lead Lineman</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-brand-muted italic">No leader assigned</span>
                            )}
                          </TableCell>

                          {/* Crew Roster */}
                          <TableCell className="px-5 py-4">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-brand-navy">
                                {team.memberCount} crew member{team.memberCount !== 1 ? 's' : ''}
                              </span>
                              {team.members.length > 0 && (
                                <p className="text-[11px] text-brand-muted max-w-[220px] truncate">
                                  {team.members.map((m) => m.name).join(', ')}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Active Jobs */}
                          <TableCell className="px-5 py-4">
                            {team.activeJobCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                                <AlertTriangle className="size-3" />
                                {team.activeJobCount} assigned job{team.activeJobCount !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                                <CheckCircle2 className="size-3.5" />
                                0 active (Ready)
                              </span>
                            )}
                          </TableCell>

                          {/* Action Buttons */}
                          <TableCell className="px-5 py-4">
                            <div className="flex justify-end items-center gap-2">
                              {team.lastKnownLocation ? (
                                <a
                                  href={`/admin/map?focusTeam=${team.id}`}
                                  title="Track Live Location"
                                  className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-blue hover:bg-[#e5e9f6]"
                                >
                                  <MapPin className="size-4" />
                                </a>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(team)}
                                aria-label={`Edit ${team.name}`}
                                title="Edit Team"
                                className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy cursor-pointer"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTeam(team)}
                                aria-label={`Disband ${team.name}`}
                                title="Disband Team"
                                className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* Grid View */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-xl border border-brand-line bg-white p-4 shadow-xs hover:border-brand-blue transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-brand-navy text-sm">{team.name}</h3>
                          <p className="text-xs text-brand-muted mt-0.5">{team.description}</p>
                        </div>
                        <TeamStatusBadge
                          status={team.status}
                          activeJobCount={team.activeJobCount}
                        />
                      </div>

                      <div className="border-y border-brand-line py-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted font-medium">Team Leader:</span>
                          <span className="font-bold text-brand-ink">
                            {team.leaderName || 'None assigned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted font-medium">Vehicle / Truck:</span>
                          <span className="font-mono text-brand-ink font-semibold">
                            {team.vehiclePlate || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted font-medium">Members:</span>
                          <span className="font-bold text-brand-navy">
                            {team.memberCount} Linemen
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted font-medium">Active Incidents:</span>
                          <span
                            className={`font-bold ${
                              team.activeJobCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {team.activeJobCount} active
                          </span>
                        </div>
                      </div>

                      {team.members.length > 0 && (
                        <div className="text-[11px] text-brand-muted">
                          <span className="font-semibold text-brand-ink block mb-0.5">Roster:</span>
                          <p className="truncate">{team.members.map((m) => m.name).join(', ')}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <a
                          href={`/admin/map?focusTeam=${team.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
                        >
                          <MapPin className="size-3.5" />
                          <span>Track location</span>
                        </a>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(team)}
                            className="p-1.5 rounded-lg border border-brand-line text-brand-muted hover:bg-brand-paper hover:text-brand-navy cursor-pointer"
                            aria-label="Edit team"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeam(team)}
                            className="p-1.5 rounded-lg border border-[#f3c7c3] text-[#b42318] hover:bg-red-50 cursor-pointer"
                            aria-label="Delete team"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reusable Pagination matching barangay.jsx */}
              {!isLoading && !loadError && filteredTeams.length > 0 && (
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={filteredTeams.length}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setPage(1)
                  }}
                />
              )}
            </section>
          </div>
        </main>
      </SidebarInset>

      {/* Team Modals */}
      <TeamCreateDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setActionError('')
        }}
        newTeam={newTeam}
        setNewTeam={setNewTeam}
        onCreateTeam={handleCreateTeamSubmit}
        staffList={staffList}
        isSubmitting={isSubmitting}
        errorMessage={actionError}
      />

      <TeamEditDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setActionError('')
        }}
        form={editForm}
        setForm={setEditForm}
        onSave={handleSaveEditSubmit}
        staffList={staffList}
        isSubmitting={isSubmitting}
        errorMessage={actionError}
      />

      <TeamDeleteDialog
        open={Boolean(deletingTeam)}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
        team={deletingTeam}
        onDelete={handleDeleteTeamSubmit}
        isSubmitting={isSubmitting}
      />
    </SidebarProvider>
  )
}
