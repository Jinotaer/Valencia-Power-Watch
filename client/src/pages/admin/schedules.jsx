import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Search,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
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

const barangays = ['All barangays', 'Poblacion', 'Bagontapay', 'Lourdes', 'Lumbayao', 'Unassigned']
const statuses = ['All statuses', 'Scheduled', 'Published', 'Cancelled']

function ScheduleStatus({ status }) {
  const styles = {
    Scheduled: 'bg-blue-50 text-brand-blue border-blue-100',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const icons = {
    Scheduled: Clock3,
    Published: CheckCircle2,
    Cancelled: XCircle,
  }
  const Icon = icons[status] || Clock3

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Scheduled}`}>
      <Icon className="size-3.5" />
      {status}
    </span>
  )
}

function EmptyScheduleState({ onCreate }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e8edff] text-brand-blue">
        <CalendarClock className="size-7" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-brand-navy">No planned outages yet</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Publish a service notice when a planned interruption needs to be shared with residents.
      </p>
      <Button
        onClick={onCreate}
        className="mt-5 h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy"
      >
        <Plus className="size-4" />
        Create first notice
      </Button>
    </div>
  )
}

function AdminSchedules() {
  const [schedules, setSchedules] = useState([])
  const [query, setQuery] = useState('')
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    location: '',
    barangay: 'Poblacion',
    date: '',
    startTime: '',
    endTime: '',
    type: 'Maintenance',
  })

  const filteredSchedules = useMemo(() => schedules.filter((schedule) => {
    const search = query.trim().toLowerCase()
    const matchesQuery = !search || [schedule.location, schedule.barangay, schedule.type].some((value) => value.toLowerCase().includes(search))
    const matchesBarangay = barangayFilter === 'All barangays' || schedule.barangay === barangayFilter
    const matchesStatus = statusFilter === 'All statuses' || schedule.status === statusFilter
    return matchesQuery && matchesBarangay && matchesStatus
  }), [schedules, query, barangayFilter, statusFilter])

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function createSchedule(event) {
    event.preventDefault()
    if (!form.location || !form.date || !form.startTime || !form.endTime) return

    setSchedules((current) => [{
      ...form,
      id: crypto.randomUUID(),
      status: 'Scheduled',
    }, ...current])
    setForm({
      location: '',
      barangay: 'Poblacion',
      date: '',
      startTime: '',
      endTime: '',
      type: 'Maintenance',
    })
    setIsCreateOpen(false)
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/schedules" />
      <SidebarInset className="min-h-screen bg-[#f7f9fd]">
        <AdminNavbar title="Workspace" section="Scheduled outages" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-brand-blue">
                  <CalendarClock className="size-4" />
                  Service planning
                </div>
                <h1 className="text-3xl font-bold tracking-[-.04em] text-brand-navy">Scheduled outages</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Prepare clear interruption notices before planned field work begins.
                </p>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
              >
                <Plus className="size-4" />
                Add schedule
              </Button>
            </header>

            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Visible notices</p>
                <p className="mt-2 text-2xl font-bold text-brand-navy">{filteredSchedules.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Published</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{schedules.filter(({ status }) => status === 'Published').length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Needs planning</p>
                <p className="mt-2 text-2xl font-bold text-brand-blue">{schedules.filter(({ status }) => status === 'Scheduled').length}</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search location or outage type"
                    aria-label="Search scheduled outages"
                    className="h-10 rounded-lg border-slate-200 pl-9 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:flex">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <select value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)} aria-label="Filter by barangay" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {barangays.map((barangay) => <option key={barangay}>{barangay}</option>)}
                  </select>
                </div>
              </div>

              {filteredSchedules.length === 0 ? (
                <EmptyScheduleState onCreate={() => setIsCreateOpen(true)} />
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredSchedules.map((schedule) => (
                    <article key={schedule.id} className="grid gap-4 p-5 transition-colors hover:bg-slate-50/70 sm:grid-cols-[150px_1fr_auto] sm:items-center">
                      <div className="flex items-center gap-3 text-sm font-semibold text-brand-navy">
                        <span className="grid size-10 place-items-center rounded-lg bg-[#eef2ff] text-brand-blue">
                          <CalendarClock className="size-5" />
                        </span>
                        {schedule.date}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-800">{schedule.location}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="size-3.5" />
                          {schedule.barangay} · {schedule.type} · {schedule.startTime} to {schedule.endTime}
                        </p>
                      </div>
                      <ScheduleStatus status={schedule.status} />
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
            <DialogDescription className="text-xs leading-5 text-slate-500">
              Add the details residents need before planned work begins.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createSchedule} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="schedule-location" className="text-xs font-semibold text-slate-600">Location</label>
              <Input id="schedule-location" name="location" value={form.location} onChange={updateForm} placeholder="Example: North feeder line" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                Barangay
                <select name="barangay" value={form.barangay} onChange={updateForm} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  {barangays.slice(1, -1).map((barangay) => <option key={barangay}>{barangay}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                Work type
                <select name="type" value={form.type} onChange={updateForm} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  <option>Maintenance</option>
                  <option>Network upgrade</option>
                  <option>Safety inspection</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                Date
                <Input name="date" type="date" value={form.date} onChange={updateForm} required />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                Starts
                <Input name="startTime" type="time" value={form.startTime} onChange={updateForm} required />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                Ends
                <Input name="endTime" type="time" value={form.endTime} onChange={updateForm} required />
              </label>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-navy">Create schedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

export default AdminSchedules
