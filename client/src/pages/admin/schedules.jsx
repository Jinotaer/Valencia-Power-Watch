import {
  CalendarClock,
  Check,
  Clock3,
  EyeOff,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import { loadBarangays } from '../../lib/barangays'
import {
  createSchedule,
  deleteSchedule,
  loadSchedules,
  setScheduleStatus,
  updateSchedule,
} from '../../lib/schedules'

const workTypes = [
  'Maintenance',
  'Repair',
  'Installation',
  'Network upgrade',
  'Safety inspection',
  'Other',
]
const statusPills = ['All', 'Pinned', 'Off', 'Expired']

// Local calendar date (UTC would be a day behind in UTC+8 before 8 AM).
function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Pinned = published (residents see it). Off = scheduled or cancelled.
// Expired overrides both once the outage date has passed.
function derivedStatus(schedule) {
  if (schedule.date < todayKey()) return 'Expired'
  return schedule.status === 'published' ? 'Pinned' : 'Off'
}

function emptyForm(barangay = '') {
  return {
    title: '',
    barangay,
    date: '',
    startTime: '',
    endTime: '',
    type: 'Maintenance',
    customType: '',
    description: '',
  }
}

function formFromSchedule(schedule) {
  const knownType = workTypes.includes(schedule.type)
  return {
    title: schedule.title,
    barangay: schedule.barangay ?? '',
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    type: knownType ? schedule.type : 'Other',
    customType: knownType ? '' : schedule.type,
    description: schedule.description ?? '',
  }
}

function ScheduleBadge({ schedule }) {
  const status = derivedStatus(schedule)
  const styles = {
    Pinned: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Off: 'bg-[#e5e9f6] text-brand-muted border-brand-line',
    Expired: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const icons = { Pinned: Pin, Off: EyeOff, Expired: Clock3 }
  const Icon = icons[status] || Clock3

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>
      <Icon className="size-3.5" />
      {status}
    </span>
  )
}

function EmptyScheduleState({ hasAny, onCreate, onClear }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
        <CalendarClock className="size-7" />
      </div>
      {hasAny ? (
        <>
          <h2 className="text-lg font-bold tracking-tight text-brand-navy">No schedules match this filter</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-brand-muted">
            Try a different search term, barangay, or status.
          </p>
          <Button
            onClick={onClear}
            className="mt-5 h-10 rounded-lg border border-brand-line bg-white px-4 text-sm font-semibold text-brand-navy hover:bg-brand-paper"
          >
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold tracking-tight text-brand-navy">No planned outages yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-brand-muted">
            Create a notice, then pin it so residents see it on their home screen.
          </p>
          <Button
            onClick={onCreate}
            className="mt-5 h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy"
          >
            <Plus className="size-4" />
            Create first notice
          </Button>
        </>
      )}
    </div>
  )
}

function AdminSchedules() {
  const [schedules, setSchedules] = useState([])
  const [barangays, setBarangays] = useState([])
  const [isBarangayLoading, setIsBarangayLoading] = useState(true)
  const [barangayError, setBarangayError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingSchedule, setDeletingSchedule] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(emptyForm())

  const showToast = (message, tone = 'ok') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3500)
  }

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    loadSchedules()
      .then((rows) => {
        if (active) {
          setSchedules(rows)
          setLoadError('')
        }
      })
      .catch(() => {
        if (active) {
          setSchedules([])
          setLoadError('We could not load schedules. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  // The barangay choices come from the registry, not a hardcoded list.
  useEffect(() => {
    let active = true

    loadBarangays()
      .then((rows) => {
        if (!active) return
        setBarangays(rows)
        setBarangayError('')
        setForm((current) => (
          current.barangay === '' || rows.some((barangay) => barangay.name === current.barangay)
            ? current
            : { ...current, barangay: '' }
        ))
      })
      .catch(() => {
        if (active) {
          setBarangays([])
          setBarangayError('Could not load barangays. Run supabase/barangay.sql, then reload.')
        }
      })
      .finally(() => {
        if (active) setIsBarangayLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  // Keep historic barangay names available in the filter even if the registry changed.
  const barangayOptions = useMemo(() => {
    const names = new Set(barangays.map((barangay) => barangay.name))
    schedules.forEach((schedule) => {
      if (schedule.barangay) names.add(schedule.barangay)
    })
    return ['All barangays', ...names]
  }, [barangays, schedules])

  const filteredSchedules = useMemo(() => schedules.filter((schedule) => {
    const search = query.trim().toLowerCase()
    const matchesQuery = !search || [schedule.title, schedule.barangay, schedule.type, schedule.description].some((value) => (value || '').toLowerCase().includes(search))
    // Multi-barangay outages are shown for every barangay filter.
    const matchesBarangay = barangayFilter === 'All barangays' || !schedule.barangay || schedule.barangay === barangayFilter
    const matchesStatus = statusFilter === 'All' || derivedStatus(schedule) === statusFilter
    return matchesQuery && matchesBarangay && matchesStatus
  }), [schedules, query, barangayFilter, statusFilter])

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormError('')
    setIsFormOpen(true)
  }

  function openEdit(schedule) {
    setEditingId(schedule.id)
    setForm(formFromSchedule(schedule))
    setFormError('')
    setIsFormOpen(true)
  }

  async function saveNotice(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setFormError('')

    try {
      const type = form.type === 'Other' ? (form.customType || '').trim() : form.type
      if (!type) {
        setFormError('Enter the type of work.')
        return
      }

      if (editingId) {
        const updated = await updateSchedule(editingId, { ...form, type })
        setSchedules((current) => current.map((row) => (row.id === updated.id ? updated : row)))
        showToast('Schedule updated.')
      } else {
        const created = await createSchedule({ ...form, type })
        setSchedules((current) => [...current, created])
        setForm(emptyForm(created.barangay ?? ''))
        showToast('Schedule created. Pin it to show it to residents.')
      }

      setEditingId(null)
      setIsFormOpen(false)
    } catch (error) {
      const message = error?.message ?? ''
      if (error?.code === '42501' || /row-level security/i.test(message)) {
        setFormError(`Your account was rejected by the schedules policy. Sign in as an admin and run supabase/schedule.sql. (${message})`)
      } else if (['42P01', '42703', '23502', 'PGRST204'].includes(error?.code)) {
        setFormError(`The schedules table is out of date. Run supabase/schedule.sql, then try again. (${message})`)
      } else {
        setFormError(`Could not save this schedule: ${message || 'check your connection and try again.'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pin = published, so residents can see it. Off = scheduled, hidden again.
  async function togglePin(schedule) {
    const next = schedule.status === 'published' ? 'scheduled' : 'published'
    setBusyId(schedule.id)
    try {
      const updated = await setScheduleStatus(schedule.id, next)
      setSchedules((current) => current.map((row) => (row.id === updated.id ? updated : row)))
      showToast(next === 'published'
        ? 'Pinned — residents can now see this notice.'
        : 'Off — residents can no longer see this notice.')
    } catch {
      showToast('We could not update this schedule. Check your connection and try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function deleteNotice() {
    if (!deletingSchedule || isDeleting) return

    setIsDeleting(true)
    try {
      await deleteSchedule(deletingSchedule.id)
      setSchedules((current) => current.filter((row) => row.id !== deletingSchedule.id))
      setDeletingSchedule(null)
      showToast('Schedule deleted.')
    } catch {
      setDeletingSchedule(null)
      showToast('We could not delete this schedule. Check your connection and try again.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/schedules" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Workspace" section="Scheduled outages" />

        {toast && (
          <div
            role="status"
            className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3 ${toast.tone === 'error' ? 'bg-[#b42318]' : 'bg-brand-navy'}`}
          >
            {toast.tone === 'error'
              ? <XCircle className="size-4" aria-hidden="true" />
              : <Check className="size-4 text-brand-yellow" aria-hidden="true" />}
            <span>{toast.message}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-[-.03em] text-brand-navy">Scheduled outages</h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-brand-muted">
                  Prepare clear interruption notices before planned field work begins.
                </p>
              </div>
              <Button
                onClick={openCreate}
                className="h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
              >
                <Plus className="size-4" />
                New Schedule
              </Button>
            </header>

            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-3 border-b border-brand-line p-4 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search title or description..."
                    aria-label="Search scheduled outages"
                    className="h-10 rounded-lg border-brand-line pl-9 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:flex">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {statusPills.map((option) => (
                      <option key={option} value={option}>{option === 'All' ? 'All statuses' : option}</option>
                    ))}
                  </select>
                  <select value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)} aria-label="Filter by barangay" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {barangayOptions.map((barangay) => <option key={barangay}>{barangay}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={reload}
                  aria-label="Refresh schedules"
                  className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-brand-line px-5 py-3">
                <h2 className="text-sm font-bold text-brand-navy">
                  Outage schedules
                  <span className="ml-2 font-medium text-brand-muted">{filteredSchedules.length} {filteredSchedules.length === 1 ? 'schedule' : 'schedules'}</span>
                </h2>
                <span className="text-xs text-brand-muted">{filteredSchedules.length} on this page</span>
              </div>

              {isLoading ? (
                <p className="px-5 py-12 text-center text-sm font-semibold text-brand-muted">Loading schedules…</p>
              ) : loadError ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4"
                    onClick={reload}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredSchedules.length === 0 ? (
                <EmptyScheduleState
                  hasAny={schedules.length > 0}
                  onCreate={openCreate}
                  onClear={() => { setQuery(''); setBarangayFilter('All barangays'); setStatusFilter('All') }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f4f6fb] text-[11px] font-bold uppercase tracking-[.08em] text-brand-muted">
                        <th className="px-5 py-3">Post</th>
                        <th className="px-5 py-3">Duration</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredSchedules.map((schedule) => {
                        const pinned = schedule.status === 'published'
                        return (
                          <tr key={schedule.id} className="transition-colors hover:bg-brand-paper/70">
                            <td className="min-w-0 max-w-[380px] px-5 py-4">
                              <p className="truncate font-semibold text-brand-ink">{schedule.title || 'Untitled schedule'}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-brand-muted">
                                {schedule.description || schedule.type}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-muted">
                                {schedule.barangay ? `Brgy. ${schedule.barangay}` : 'Multiple barangays'} · {schedule.type}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-brand-ink">
                              {schedule.dateLabel}, {schedule.timeLabel}
                            </td>
                            <td className="px-5 py-4"><ScheduleBadge schedule={schedule} /></td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(schedule)}
                                  disabled={busyId === schedule.id}
                                  aria-label={`Edit ${schedule.title || 'schedule'}`}
                                  title="Edit"
                                  className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy disabled:opacity-60"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePin(schedule)}
                                  disabled={busyId === schedule.id}
                                  aria-label={pinned ? `Unpin ${schedule.title || 'schedule'} (hide from residents)` : `Pin ${schedule.title || 'schedule'} (show to residents)`}
                                  title={pinned ? 'Unpin — hide from residents' : 'Pin — show to residents'}
                                  className={`grid size-9 place-items-center rounded-lg border transition-colors disabled:opacity-60 ${
                                    pinned
                                      ? 'border-brand-blue bg-brand-blue text-white hover:bg-brand-navy'
                                      : 'border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy'
                                  }`}
                                >
                                  {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingSchedule(schedule)}
                                  disabled={busyId === schedule.id}
                                  aria-label={`Delete ${schedule.title || 'schedule'}`}
                                  title="Delete"
                                  className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] transition-colors hover:bg-red-50 disabled:opacity-60"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </SidebarInset>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-navy">
              {editingId ? 'Edit outage schedule' : 'Create outage schedule'}
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              {editingId
                ? 'Update the details residents see while this schedule is pinned.'
                : 'Add the details residents need before planned work begins.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveNotice} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="schedule-title" className="text-xs font-semibold text-brand-muted">Title</label>
              <Input id="schedule-title" name="title" value={form.title} onChange={updateForm} placeholder="Example: Planned maintenance on east feeder line" required />
            </div>
            <div className="grid gap-3">
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Barangay <span className="font-normal">(optional)</span>
                <select name="barangay" value={form.barangay} onChange={updateForm} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  <option value="">Multiple barangays</option>
                  {barangays.map((barangay) => (
                    <option key={barangay.code ?? barangay.name}>{barangay.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Work type
                <select name="type" value={form.type} onChange={updateForm} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  {workTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
            </div>
            {barangayError && (
              <p className="text-[11px] font-normal text-[#b42318]">{barangayError}</p>
            )}
            {!isBarangayLoading && !barangayError && barangays.length === 0 && (
              <p className="text-[11px] font-normal text-[#9a6500]">
                To target a specific barangay, add it first in the <a href="/admin/barangay" className="font-semibold underline underline-offset-4">barangay registry</a>.
              </p>
            )}
            {form.type === 'Other' && (
              <div className="space-y-1.5">
                <label htmlFor="schedule-custom-type" className="text-xs font-semibold text-brand-muted">Specify work type</label>
                <Input id="schedule-custom-type" name="customType" value={form.customType} onChange={updateForm} placeholder="Example: Pole replacement" required />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="schedule-description" className="text-xs font-semibold text-brand-muted">
                Description <span className="font-normal">(optional)</span>
              </label>
              <textarea
                id="schedule-description"
                name="description"
                value={form.description}
                onChange={updateForm}
                rows={3}
                maxLength={500}
                placeholder="What residents should know about this interruption"
                className="w-full resize-none rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Date
                <Input name="date" type="date" value={form.date} onChange={updateForm} required />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Starts
                <Input name="startTime" type="time" value={form.startTime} onChange={updateForm} required />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Ends
                <Input name="endTime" type="time" value={form.endTime} onChange={updateForm} required />
              </label>
            </div>
            {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[#b42318]">{formError}</p>}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-blue text-white hover:bg-brand-navy">
                {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingSchedule} onOpenChange={(open) => { if (!open) setDeletingSchedule(null) }}>
        <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-navy">Delete schedule?</DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              “{deletingSchedule?.title || 'Untitled schedule'}” will be permanently removed. Residents will no longer see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setDeletingSchedule(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" onClick={deleteNotice} disabled={isDeleting} className="bg-[#b42318] text-white hover:bg-[#912018]">
              {isDeleting ? 'Deleting…' : 'Delete schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

export default AdminSchedules
