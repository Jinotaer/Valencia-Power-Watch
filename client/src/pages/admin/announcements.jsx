import { Check, Megaphone, Pencil, Plus, RefreshCw, Search, Trash2, XCircle } from 'lucide-react'
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
  createAnnouncement,
  deleteAnnouncement,
  loadAnnouncements,
  updateAnnouncement,
} from '../../lib/announcements'

const categoryOptions = [
  { value: 'advisory', label: 'Advisory' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'restoration', label: 'Restoration' },
  { value: 'general', label: 'General' },
]

function emptyForm(barangay = '') {
  return { title: '', body: '', barangay, category: 'general' }
}

function formFromAnnouncement(announcement) {
  return {
    title: announcement.title,
    body: announcement.body,
    barangay: announcement.barangay ?? '',
    category: announcement.category,
  }
}

function formatPublishedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function EmptyAnnouncementState({ hasAny, onCreate, onClear }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
        <Megaphone className="size-7" />
      </div>
      {hasAny ? (
        <>
          <h2 className="text-lg font-bold tracking-tight text-brand-navy">No announcements match this filter</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-brand-muted">
            Try a different search term, category, or barangay.
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
          <h2 className="text-lg font-bold tracking-tight text-brand-navy">No announcements yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-brand-muted">
            Create the first advisory. It will appear immediately in the resident portal.
          </p>
          <Button
            onClick={onCreate}
            className="mt-5 h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy"
          >
            <Plus className="size-4" />
            Create first announcement
          </Button>
        </>
      )}
    </div>
  )
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [barangays, setBarangays] = useState([])
  const [isBarangayLoading, setIsBarangayLoading] = useState(true)
  const [barangayError, setBarangayError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [barangayFilter, setBarangayFilter] = useState('All barangays')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

    loadAnnouncements(100)
      .then((rows) => {
        if (active) {
          setAnnouncements(rows)
          setLoadError('')
        }
      })
      .catch(() => {
        if (active) {
          setAnnouncements([])
          setLoadError('We could not load announcements. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

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

  const barangayOptions = useMemo(() => {
    const names = new Set(barangays.map((barangay) => barangay.name))
    announcements.forEach((announcement) => {
      if (announcement.barangay) names.add(announcement.barangay)
    })
    return ['All barangays', ...names]
  }, [barangays, announcements])

  const filteredAnnouncements = useMemo(() => announcements.filter((announcement) => {
    const search = query.trim().toLowerCase()
    const matchesQuery = !search || [announcement.title, announcement.body, announcement.barangay, announcement.category].some((value) => (value || '').toLowerCase().includes(search))
    const matchesCategory = categoryFilter === 'All categories' || announcement.category === categoryFilter
    const matchesBarangay = barangayFilter === 'All barangays' || announcement.barangay === barangayFilter
    return matchesQuery && matchesCategory && matchesBarangay
  }), [announcements, query, categoryFilter, barangayFilter])

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormError('')
    setIsFormOpen(true)
  }

  function openEdit(announcement) {
    setEditingId(announcement.id)
    setForm(formFromAnnouncement(announcement))
    setFormError('')
    setIsFormOpen(true)
  }

  async function saveAnnouncement(event) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setFormError('')

    try {
      const payload = { ...form, barangay: form.barangay || null }
      if (editingId) {
        const updated = await updateAnnouncement(editingId, payload)
        setAnnouncements((current) => current.map((row) => (row.id === updated.id ? updated : row)))
        showToast('Announcement updated.')
      } else {
        const created = await createAnnouncement(payload)
        setAnnouncements((current) => [created, ...current])
        setForm(emptyForm(created.barangay ?? ''))
        showToast('Announcement published to residents.')
      }

      setEditingId(null)
      setIsFormOpen(false)
    } catch (error) {
      const message = error?.message ?? ''
      if (error?.code === '42501' || /row-level security/i.test(message)) {
        setFormError(`Your account was rejected by the announcements policy. Sign in as an admin and run supabase/announcement.sql. (${message})`)
      } else if (['42P01', '42703', '23502', 'PGRST204'].includes(error?.code)) {
        setFormError(`The announcements table is out of date. Run supabase/announcement.sql, then try again. (${message})`)
      } else {
        setFormError(`Could not save this announcement: ${message || 'check your connection and try again.'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteCurrentAnnouncement() {
    if (!deletingAnnouncement || isDeleting) return

    setIsDeleting(true)
    try {
      await deleteAnnouncement(deletingAnnouncement.id)
      setAnnouncements((current) => current.filter((row) => row.id !== deletingAnnouncement.id))
      setDeletingAnnouncement(null)
      showToast('Announcement deleted.')
    } catch {
      setDeletingAnnouncement(null)
      showToast('We could not delete this announcement. Check your connection and try again.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/announcements" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Workspace" section="Announcements" />

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
                <h1 className="text-2xl font-bold tracking-[-.03em] text-brand-navy">Announcements</h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-brand-muted">
                  Publish advisories, maintenance notices and restoration updates for residents.
                </p>
              </div>
              <Button
                onClick={openCreate}
                className="h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
              >
                <Plus className="size-4" />
                New Announcement
              </Button>
            </header>

            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-3 border-b border-brand-line p-4 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search announcements..."
                    aria-label="Search announcements"
                    className="h-10 rounded-lg border-brand-line pl-9 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:flex">
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    <option>All categories</option>
                    {categoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                  <select value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)} aria-label="Filter by barangay" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                    {barangayOptions.map((barangay) => <option key={barangay}>{barangay}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={reload}
                  aria-label="Refresh announcements"
                  className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-brand-line px-5 py-3">
                <h2 className="text-sm font-bold text-brand-navy">
                  Announcements
                  <span className="ml-2 font-medium text-brand-muted">{filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'announcement' : 'announcements'}</span>
                </h2>
                <span className="text-xs text-brand-muted">{filteredAnnouncements.length} on this page</span>
              </div>

              {isLoading ? (
                <p className="px-5 py-12 text-center text-sm font-semibold text-brand-muted">Loading announcements…</p>
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
              ) : filteredAnnouncements.length === 0 ? (
                <EmptyAnnouncementState
                  hasAny={announcements.length > 0}
                  onCreate={openCreate}
                  onClear={() => { setQuery(''); setCategoryFilter('All categories'); setBarangayFilter('All barangays') }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f4f6fb] text-[11px] font-bold uppercase tracking-[.08em] text-brand-muted">
                        <th className="px-5 py-3">Announcement</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Published</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {filteredAnnouncements.map((announcement) => {
                        const category = categoryOptions.find((option) => option.value === announcement.category)?.label ?? announcement.category
                        return (
                          <tr key={announcement.id} className="transition-colors hover:bg-brand-paper/70">
                            <td className="min-w-0 max-w-[420px] px-5 py-4">
                              <p className="truncate font-semibold text-brand-ink">{announcement.title || 'Untitled announcement'}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-brand-muted">
                                {announcement.body}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-muted">
                                {announcement.barangay ? `Brgy. ${announcement.barangay}` : 'All barangays'}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-brand-ink">{category}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-brand-ink">
                              {formatPublishedAt(announcement.publishedAt)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(announcement)}
                                  aria-label={`Edit ${announcement.title || 'announcement'}`}
                                  title="Edit"
                                  className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingAnnouncement(announcement)}
                                  aria-label={`Delete ${announcement.title || 'announcement'}`}
                                  title="Delete"
                                  className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] transition-colors hover:bg-red-50"
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
        <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-navy">
              {editingId ? 'Edit announcement' : 'Create announcement'}
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              {editingId
                ? 'Update the advisory residents see in the community portal.'
                : 'Publish an official notice for residents. It appears in the community portal immediately.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAnnouncement} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="announcement-title" className="text-xs font-semibold text-brand-muted">Title</label>
              <Input id="announcement-title" name="title" value={form.title} onChange={updateForm} placeholder="Example: Scheduled maintenance in Brgy. Poblacion" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Category
                <select name="category" value={form.category} onChange={updateForm} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  {categoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Barangay <span className="font-normal">(optional)</span>
                <select name="barangay" value={form.barangay} onChange={updateForm} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20">
                  <option value="">All barangays</option>
                  {barangays.map((barangay) => (
                    <option key={barangay.code ?? barangay.name}>{barangay.name}</option>
                  ))}
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
            <div className="space-y-1.5">
              <label htmlFor="announcement-body" className="text-xs font-semibold text-brand-muted">Message</label>
              <textarea
                id="announcement-body"
                name="body"
                value={form.body}
                onChange={updateForm}
                rows={4}
                maxLength={1000}
                placeholder="What residents need to know"
                className="w-full resize-none rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                required
              />
            </div>
            {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[#b42318]">{formError}</p>}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-blue text-white hover:bg-brand-navy">
                {isSubmitting ? 'Publishing…' : editingId ? 'Save changes' : 'Publish announcement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingAnnouncement} onOpenChange={(open) => { if (!open) setDeletingAnnouncement(null) }}>
        <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-navy">Delete announcement?</DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              “{deletingAnnouncement?.title || 'Untitled announcement'}” will be permanently removed. Residents will no longer see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setDeletingAnnouncement(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" onClick={deleteCurrentAnnouncement} disabled={isDeleting} className="bg-[#b42318] text-white hover:bg-[#912018]">
              {isDeleting ? 'Deleting…' : 'Delete announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
