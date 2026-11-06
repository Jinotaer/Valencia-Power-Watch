import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Search,
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
import { createSchedule, loadSchedules, setScheduleStatus } from '../../lib/schedules'

const barangays = ['All barangays', 'Poblacion', 'Bagontapay', 'Lourdes', 'Lumbayao', 'Unassigned']
const statuses = ['All statuses', 'Scheduled', 'Published', 'Cancelled']

function ScheduleStatus({ status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  const styles = {
    Scheduled: 'bg-[#e5e9f6] text-brand-blue border-brand-line',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Cancelled: 'bg-[#e5e9f6] text-brand-muted border-brand-line',
  }
  const icons = {
    Scheduled: Clock3,
    Published: CheckCircle2,
    Cancelled: XCircle,
  }
  const Icon = icons[label] || Clock3

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[label] || styles.Scheduled}`}>
      <Icon className="size-3.5" />
      {label}
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
            Create a notice, then publish it so residents see it on their home screen.
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    location: '',
    barangay: 'Poblacion',
    date: '',
    startTime: '',
    endTime: '',
    type: 'Maintenance',
  })

  const showToast = (message, tone = 'ok') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3500)
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

  const filteredSchedules = useMemo(() => schedules.filter((schedule) => {
    const search = query.trim().toLowerCase()
    const matchesQuery = !search || [schedule.location, schedule.barangay, schedule.type].some((value) => value.toLowerCase().includes(search))
    const matchesBarangay = barangayFilter === 'All barangays' || schedule.barangay === barangayFilter
    const matchesStatus = statusFilter === 'All statuses' || schedule.status === statusFilter.toLowerCase()
    return matchesQuery && matchesBarangay && matchesStatus
  }), [schedules, query, barangayFilter, statusFilter])

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function createNotice(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setFormError('')

    try {
      const created = await createSchedule(form)
      setSchedules((current) => [...current, created])
      setForm({
        location: '',
        barangay: 'Poblacion',
        date: '',
        startTime: '',
        endTime: '',
        type: 'Maintenance',
      })
      setIsCreateOpen(false)
      showToast('Schedule created. Publish it to share with residents.')
    } catch {
      setFormError('We could not create this schedule. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function changeStatus(schedule, status) {
    setBusyId(schedule.id)
    try {
      const updated = await setScheduleStatus(schedule.id, status)
      setSchedules((current) => current.map((row) => (row.id === updated.id ? updated : row)))
      showToast(status === 'published'
        ? 'Published — residents can now see this notice.'
        : 'Schedule cancelled. Residents no longer see it.')
    } catch {
      showToast('We could not update this schedule. Check your connection and try again.', 'error')
    } finally {
      setBusyId(null)
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
                onClick={() => { setFormError(''); setIsCreateOpen(true) }}
                className="h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
              >
                <Plus className="size-4" />
                Add schedule
              </Button>
            </header>

            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-3 border-b border-brand-line p-4 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search location or outage type"
                    aria-label="Search scheduled outages"
                    className="h-10 rounded-lg border-brand-line pl-9 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:flex">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <select value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)} aria-label="Filter by barangay" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {barangays.map((barangay) => <option key={barangay}>{barangay}</option>)}
                  </select>
                </div>
              </div>

              {isLoading ? (
                <p className="px-5 py-12 text-center text-sm font-semibold text-brand-muted">Loading schedules…</p>
              ) : loadError ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4"
                    onClick={() => { setLoadError(''); setIsLoading(true); setReloadKey((value) => value + 1) }}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredSchedules.length === 0 ? (
                <EmptyScheduleState
                  hasAny={schedules.length > 0}
                  onCreate={() => setIsCreateOpen(true)}
                  onClear={() => { setQuery(''); setBarangayFilter('All barangays'); setStatusFilter('All statuses') }}
                />
              ) : (
                <div className="divide-y divide-brand-line">
                  {filteredSchedules.map((schedule) => (
                    <article key={schedule.id} className="grid gap-4 p-5 transition-colors hover:bg-brand-paper/70 sm:grid-cols-[140px_1fr_auto] sm:items-center">
                      <div className="flex items-center gap-3 text-sm font-semibold text-brand-navy">
                        <span className="grid size-10 place-items-center rounded-lg bg-[#e5e9f6] text-brand-blue">
                          <CalendarClock className="size-5" />
                        </span>
                        {schedule.dateLabel}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-brand-ink">{schedule.location}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-muted">
                          <MapPin className="size-3.5 shrink-0" />
                          {schedule.barangay} · {schedule.type} · {schedule.timeLabel}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <ScheduleStatus status={schedule.status} />
                        {/* shortcut: cancelled notices stay as history — no delete action until admins ask for one */}
                        <div className="flex gap-2">
                          {schedule.status === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() => changeStatus(schedule, 'published')}
                              disabled={busyId === schedule.id}
                              className="rounded-lg border border-brand-line bg-white px-2.5 py-1 text-[11px] font-bold text-brand-blue transition-colors hover:bg-brand-paper disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Publish
                            </button>
                          )}
                          {schedule.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => changeStatus(schedule, 'cancelled')}
                              disabled={busyId === schedule.id}
                              className="rounded-lg border border-[#f3c7c3] bg-white px-2.5 py-1 text-[11px] font-bold text-[#b42318] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </SidebarInset>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-navy">Create outage schedule</DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              Add the details residents need before planned work begins.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createNotice} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="schedule-location" className="text-xs font-semibold text-brand-muted">Location</label>
              <Input id="schedule-location" name="location" value={form.location} onChange={updateForm} placeholder="Example: North feeder line" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Barangay
                <select name="barangay" value={form.barangay} onChange={updateForm} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  {barangays.slice(1, -1).map((barangay) => <option key={barangay}>{barangay}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Work type
                <select name="type" value={form.type} onChange={updateForm} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  <option>Maintenance</option>
                  <option>Network upgrade</option>
                  <option>Safety inspection</option>
                </select>
              </label>
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
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-blue text-white hover:bg-brand-navy">
                {isSubmitting ? 'Creating…' : 'Create schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

export default AdminSchedules
