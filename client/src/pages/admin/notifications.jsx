import { Bell, Check, Plus, RefreshCw, Search, Send, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  createAdminNotification,
  deleteAdminNotification,
  loadAdminNotifications,
  loadNotificationRecipients,
  markAdminNotificationRead,
} from '../../lib/notifications'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [recipients, setRecipients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('All recipients')
  const [readFilter, setReadFilter] = useState('All')
  const [isComposing, setIsComposing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ recipients: 'all', selectedUserId: '', title: '', body: '' })

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    Promise.all([loadAdminNotifications().catch(() => []), loadNotificationRecipients().catch(() => [])])
      .then(([rows, users]) => {
        if (!active) return
        setNotifications(rows)
        setRecipients(users)
      })
      .catch(() => {
        if (active) {
          setNotifications([])
          setRecipients([])
          setLoadError('We could not load notifications. Run supabase/admin_management.sql and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((row) => !row.readAt).length,
    read: notifications.filter((row) => row.readAt).length,
    manual: notifications.filter((row) => row.type === 'manual').length,
  }), [notifications])

  const visibleNotifications = useMemo(() => notifications.filter((row) => {
    const search = query.trim().toLowerCase()
    const matchesQuery = !search || [row.title, row.body, row.recipientName, row.recipientRole, row.type].some((value) => String(value || '').toLowerCase().includes(search))
    const matchesRecipient = recipientFilter === 'All recipients' || row.recipientRole === recipientFilter.toLowerCase()
    const matchesRead = readFilter === 'All' || (readFilter === 'Unread' ? !row.readAt : Boolean(row.readAt))
    return matchesQuery && matchesRecipient && matchesRead
  }), [notifications, query, recipientFilter, readFilter])

  const selectedRecipients = useMemo(() => {
    if (form.recipients === 'all') return recipients.filter((recipient) => recipient.isActive)
    if (form.recipients === 'resident') return recipients.filter((recipient) => recipient.isActive && recipient.role === 'resident')
    if (form.recipients === 'staff') return recipients.filter((recipient) => recipient.isActive && recipient.role === 'staff')
    if (form.recipients === 'one' && form.selectedUserId) return recipients.filter((recipient) => recipient.id === form.selectedUserId)
    return []
  }, [form.recipients, form.selectedUserId, recipients])

  const sendNotification = async (event) => {
    event.preventDefault()
    if (isSending) return

    setIsSending(true)
    setFormError('')
    try {
      const count = await createAdminNotification({
        recipientIds: selectedRecipients.map((recipient) => recipient.id),
        title: form.title,
        body: form.body,
      })
      setIsComposing(false)
      setForm({ recipients: 'all', selectedUserId: '', title: '', body: '' })
      showToast(`Notification sent to ${count} recipient${count === 1 ? '' : 's'}.`)
      reload()
    } catch (error) {
      setFormError(error.message || 'Could not send this notification.')
    } finally {
      setIsSending(false)
    }
  }

  const markRead = async (id) => {
    try {
      await markAdminNotificationRead(id)
      setNotifications((current) => current.map((row) => (row.id === id ? { ...row, readAt: new Date().toISOString() } : row)))
      showToast('Notification marked as read.')
    } catch {
      showToast('Could not mark this notification as read.')
    }
  }

  const removeNotification = async (id) => {
    try {
      await deleteAdminNotification(id)
      setNotifications((current) => current.filter((row) => row.id !== id))
      showToast('Notification deleted.')
    } catch {
      showToast('Could not delete this notification.')
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/notifications" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Administration" section="Notifications" />

        {toast && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl">
            <Check className="size-4 text-brand-yellow" />
            <span>{toast}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-[-.03em] text-brand-navy">Notifications</h1>
                <p className="mt-1 max-w-xl text-sm text-brand-muted">Send manual messages and review every notification delivery record.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={reload} aria-label="Refresh notifications" className="grid size-10 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy">
                  <RefreshCw className="size-4" />
                </button>
                <button type="button" onClick={() => setIsComposing(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy">
                  <Plus className="size-4" />
                  New notification
                </button>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Total deliveries', stats.total],
                ['Unread', stats.unread],
                ['Read', stats.read],
                ['Manual messages', stats.manual],
              ].map(([label, value]) => (
                <section key={label} className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
                  <p className="text-sm font-medium text-brand-muted">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-brand-ink">{value}</p>
                </section>
              ))}
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xs">
              <div className="flex flex-col gap-3 border-b border-brand-line p-4 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notifications or recipients..." className="h-10 w-full rounded-lg border border-brand-line bg-white pl-9 pr-3 text-sm text-brand-ink outline-none focus:border-brand-blue" />
                </div>
                <select value={readFilter} onChange={(event) => setReadFilter(event.target.value)} aria-label="Filter by read status" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue">
                  <option>All</option>
                  <option>Unread</option>
                  <option>Read</option>
                </select>
                <select value={recipientFilter} onChange={(event) => setRecipientFilter(event.target.value)} aria-label="Filter by recipient role" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue">
                  <option>All recipients</option>
                  <option>Resident</option>
                  <option>Staff</option>
                  <option>Admin</option>
                </select>
              </div>

              {isLoading ? (
                <p className="p-10 text-center text-sm font-semibold text-brand-muted">Loading notification history…</p>
              ) : loadError ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button type="button" onClick={reload} className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4">Try again</button>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
                    <Bell className="size-7" />
                  </div>
                  <h2 className="font-bold text-brand-navy">No notification history</h2>
                  <p className="mt-1 max-w-sm text-sm text-brand-muted">Report status updates and manual messages will appear here for delivery review.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f4f6fb] text-[11px] font-bold uppercase tracking-[.08em] text-brand-muted">
                        <th className="px-5 py-3">Message</th>
                        <th className="px-5 py-3">Recipient</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Sent</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {visibleNotifications.map((row) => (
                        <tr key={row.id} className="hover:bg-brand-paper/60">
                          <td className="max-w-[420px] px-5 py-3">
                            <p className="font-semibold text-brand-ink">{row.title}</p>
                            <p className="mt-0.5 truncate text-xs text-brand-muted">{row.body}</p>
                          </td>
                          <td className="px-5 py-3 text-brand-ink">
                            <p className="font-semibold">{row.recipientName}</p>
                            <p className="text-xs text-brand-muted capitalize">{row.recipientRole || 'user'}</p>
                          </td>
                          <td className="px-5 py-3"><span className="rounded-full bg-[#e5e9f6] px-2 py-0.5 text-[11px] font-bold text-brand-blue">{row.type}</span></td>
                          <td className="px-5 py-3 font-semibold text-brand-ink">{row.readAt ? `Read ${formatDate(row.readAt)}` : 'Unread'}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-brand-muted">{formatDate(row.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-2">
                              {!row.readAt && (
                                <button type="button" onClick={() => markRead(row.id)} title="Mark read" aria-label="Mark read" className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy">
                                  <Check className="size-4" />
                                </button>
                              )}
                              <button type="button" onClick={() => removeNotification(row.id)} title="Delete" aria-label="Delete notification" className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] hover:bg-red-50">
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </SidebarInset>

      {isComposing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={sendNotification} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-label="New notification">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-brand-navy">New notification</h2>
                <p className="mt-1 text-xs text-brand-muted">Send an in-app message to active users.</p>
              </div>
              <button type="button" onClick={() => setIsComposing(false)} className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-paper">Close</button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Recipients
                <select value={form.recipients} onChange={(event) => setForm({ ...form, recipients: event.target.value })} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue">
                  <option value="all">All active users</option>
                  <option value="resident">Residents</option>
                  <option value="staff">Staff</option>
                  <option value="one">One user</option>
                </select>
              </label>

              {form.recipients === 'one' && (
                <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                  User
                  <select value={form.selectedUserId} onChange={(event) => setForm({ ...form, selectedUserId: event.target.value })} className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue">
                    <option value="">Select a user</option>
                    {recipients.filter((recipient) => recipient.isActive).map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.fullName} · {recipient.email} · {recipient.role}</option>)}
                  </select>
                </label>
              )}

              <p className="text-xs text-brand-muted">{selectedRecipients.length} active recipient{selectedRecipients.length === 1 ? '' : 's'} selected.</p>

              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue" />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-brand-muted">
                Message
                <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} required rows={4} className="w-full resize-none rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue" />
              </label>

              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-[#b42318]">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsComposing(false)} disabled={isSending} className="h-10 rounded-lg border border-brand-line px-4 text-sm font-semibold text-brand-muted hover:bg-brand-paper">Cancel</button>
                <button type="submit" disabled={isSending || selectedRecipients.length === 0} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-60">
                  <Send className="size-4" />
                  {isSending ? 'Sending…' : `Send to ${selectedRecipients.length}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </SidebarProvider>
  )
}
