import { Check, Megaphone, Pencil, Plus, Search, Trash2, X, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import Pagination from '../../components/common/pagination'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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

  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedAnnouncements = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredAnnouncements.slice(start, start + pageSize)
  }, [filteredAnnouncements, safePage, pageSize])

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
            <PageHeader
              className="mb-6"
              title="Announcements"
              description="Publish advisories, maintenance notices and restoration updates for residents."
              actions={
                <Button
                  onClick={openCreate}
                  className="h-10 gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy"
                >
                  <Plus className="size-4" />
                  New Announcement
                </Button>
              }
            />

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
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setPage(1)
                      }}
                      placeholder="Search announcements..."
                      aria-label="Search announcements"
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
                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={categoryFilter}
                      onChange={(event) => {
                        setCategoryFilter(event.target.value)
                        setPage(1)
                      }}
                      aria-label="Filter by category"
                      className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                    >
                      <option value="All categories">All categories</option>
                      {categoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={barangayFilter}
                      onChange={(event) => {
                        setBarangayFilter(event.target.value)
                        setPage(1)
                      }}
                      aria-label="Filter by barangay"
                      className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                    >
                      {barangayOptions.map((barangay) => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
                  onClear={() => { setQuery(''); setCategoryFilter('All categories'); setBarangayFilter('All barangays'); setPage(1) }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-brand-line bg-brand-paper/80 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        <th className="h-11 px-5">Announcement</th>
                        <th className="h-11 px-5">Category</th>
                        <th className="h-11 px-5">Published</th>
                        <th className="h-11 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {paginatedAnnouncements.map((announcement) => {
                        const category = categoryOptions.find((option) => option.value === announcement.category)?.label ?? announcement.category
                        return (
                          <tr key={announcement.id} className="transition-colors hover:bg-brand-paper/70">
                            <td className="min-w-0 max-w-[420px] px-5 py-3.5">
                              <p className="truncate font-bold text-brand-ink">{announcement.title || 'Untitled announcement'}</p>
                              <p className="mt-0.5 text-xs text-brand-muted">
                                {announcement.barangay ? `Brgy. ${announcement.barangay}` : 'All barangays'}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-brand-ink">
                              <span className="inline-flex items-center rounded-full border border-brand-line bg-[#e5e9f6] px-2.5 py-0.5 text-[11px] font-bold text-brand-blue">
                                {category}
                              </span>
                            </td>
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
                                  className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy cursor-pointer"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingAnnouncement(announcement)}
                                  aria-label={`Delete ${announcement.title || 'announcement'}`}
                                  title="Delete"
                                  className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] transition-colors hover:bg-red-50 cursor-pointer"
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

              {!isLoading && !loadError && (
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={filteredAnnouncements.length}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              )}
            </section>
          </div>
        </main>
      </SidebarInset>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-brand-line bg-white p-0 shadow-2xl ring-0 sm:max-w-[540px]">
          <DialogHeader className="border-b border-brand-line px-6 py-5">
            <DialogTitle className="text-lg font-bold tracking-[-0.02em] text-brand-navy">
              {editingId ? 'Edit announcement' : 'Create announcement'}
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              {editingId
                ? 'Update the advisory residents see in the community portal.'
                : 'Publish an official notice for residents. It appears in the community portal immediately.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveAnnouncement}>
            <div className="max-h-[calc(85vh-140px)] space-y-4 overflow-y-auto px-6 py-5">
              {formError && (
                <p
                  role="alert"
                  className="rounded-xl border border-[#f3c7c3] bg-red-50/80 px-3.5 py-2.5 text-xs font-semibold text-[#b42318]"
                >
                  {formError}
                </p>
              )}

              <div className="space-y-1.5">
                <label htmlFor="announcement-title" className="block text-xs font-semibold text-brand-ink">
                  Title
                </label>
                <Input
                  id="announcement-title"
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  placeholder="Example: Scheduled maintenance in Brgy. Poblacion"
                  required
                  className="h-10 rounded-xl border-brand-line !bg-white px-3.5 text-sm text-brand-ink placeholder:text-brand-muted focus-visible:border-brand-blue"
                />
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="announcement-category" className="block text-xs font-semibold text-brand-ink">
                    Category
                  </label>
                  <select
                    id="announcement-category"
                    name="category"
                    value={form.category}
                    onChange={updateForm}
                    className="h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none transition-colors focus:border-brand-blue cursor-pointer"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="announcement-barangay" className="block text-xs font-semibold text-brand-ink">
                    Affected area <span className="font-normal text-brand-muted">(optional)</span>
                  </label>
                  <select
                    id="announcement-barangay"
                    name="barangay"
                    value={form.barangay}
                    onChange={updateForm}
                    className="h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none transition-colors focus:border-brand-blue cursor-pointer"
                  >
                    <option value="">All barangays</option>
                    {barangays.map((barangay) => (
                      <option key={barangay.code ?? barangay.name} value={barangay.name}>
                        Brgy. {barangay.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {barangayError && (
                <p className="text-xs text-[#b42318]">{barangayError}</p>
              )}
              {!isBarangayLoading && !barangayError && barangays.length === 0 && (
                <p className="text-xs text-[#9a6500]">
                  To target a specific barangay, add it first in the{' '}
                  <a href="/admin/barangay" className="font-semibold underline underline-offset-4">
                    barangay registry
                  </a>
                  .
                </p>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="announcement-body" className="text-xs font-semibold text-brand-ink">
                    Message
                  </label>
                  <span className="text-[11px] tabular-nums text-brand-muted">
                    {form.body.length}/1000
                  </span>
                </div>
                <textarea
                  id="announcement-body"
                  name="body"
                  value={form.body}
                  onChange={updateForm}
                  rows={4}
                  maxLength={1000}
                  placeholder="What residents need to know regarding this advisory…"
                  className="w-full resize-none rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm leading-relaxed text-brand-ink placeholder:text-brand-muted outline-none transition-colors focus:border-brand-blue"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-brand-line bg-brand-paper/60 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="h-10 rounded-xl border-brand-line bg-white px-4 text-xs font-semibold text-brand-ink hover:bg-brand-paper cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 rounded-xl bg-brand-blue px-4 text-xs font-semibold text-white hover:bg-brand-navy cursor-pointer"
              >
                {isSubmitting ? 'Publishing…' : editingId ? 'Save changes' : 'Publish announcement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingAnnouncement} onOpenChange={(open) => { if (!open) setDeletingAnnouncement(null) }}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-brand-line bg-white p-0 shadow-2xl ring-0 sm:max-w-[420px]">
          <DialogHeader className="border-b border-brand-line px-6 py-5">
            <DialogTitle className="text-lg font-bold tracking-[-0.02em] text-brand-navy">
              Delete announcement?
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-brand-muted">
              This announcement will be permanently removed and hidden from the resident portal.
            </DialogDescription>
          </DialogHeader>

          {deletingAnnouncement && (
            <div className="px-6 py-4">
              <div className="rounded-xl border border-brand-line bg-brand-paper/60 px-4 py-3">
                <p className="truncate text-sm font-bold text-brand-ink">
                  {deletingAnnouncement.title || 'Untitled announcement'}
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  {deletingAnnouncement.barangay ? `Brgy. ${deletingAnnouncement.barangay}` : 'All barangays'} ·{' '}
                  {formatPublishedAt(deletingAnnouncement.publishedAt)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-brand-line bg-brand-paper/60 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingAnnouncement(null)}
              disabled={isDeleting}
              className="h-10 rounded-xl border-brand-line bg-white px-4 text-xs font-semibold text-brand-ink hover:bg-brand-paper cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteCurrentAnnouncement}
              disabled={isDeleting}
              className="h-10 rounded-xl bg-[#b42318] px-4 text-xs font-semibold text-white hover:bg-[#912018] cursor-pointer"
            >
              {isDeleting ? 'Deleting…' : 'Delete announcement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
