import {
  AlertTriangle,
  Bell,
  Check,
  ExternalLink,
  Search,
  Trash2,
  X,
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
  deleteAdminNotification,
  loadAdminNotifications,
  markAdminNotificationRead,
} from '../../lib/notifications'
import { loadAllReports } from '../../lib/reports'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const typeFilterOptions = [
  { value: 'All', label: 'All notifications' },
  { value: 'new_report', label: 'New resident reports' },
  { value: 'report_status', label: 'Status updates' },
  { value: 'assignment', label: 'Staff dispatches' },
]

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [readFilter, setReadFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [toast, setToast] = useState('')

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

    Promise.all([
      loadAdminNotifications(200).catch(() => []),
      loadAllReports().catch(() => []),
    ])
      .then(([notifRows, reportRows]) => {
        if (!active) return

        // Synthesize notification items from newly submitted resident reports
        // so admins are immediately notified of new reports and their priorities
        const reportNotifs = reportRows.map((report) => ({
          id: `report-${report.id}`,
          type: 'new_report',
          title: `New Outage Report: ${report.id}`,
          body: `${report.outageType} reported in Brgy. ${report.barangay} by ${report.residentName || 'Resident'} (${report.priority || 'medium'} priority).`,
          reportReference: report.id,
          recipientName: 'Administrator',
          recipientRole: 'admin',
          readAt: report.status !== 'pending' ? report.updatedAt : null,
          createdAt: report.createdAt,
          priority: report.priority,
          status: report.status,
          isSynthetic: true,
        }))

        // Filter persisted notifications to relevant incident & dispatch events
        const dbNotifs = notifRows
          .filter((row) => row.type !== 'manual')
          .map((row) => ({ ...row, isSynthetic: false }))

        // Merge, de-duplicate, and sort newest first
        const merged = [...reportNotifs, ...dbNotifs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        setNotifications(merged)
      })
      .catch(() => {
        if (active) {
          setNotifications([])
          setLoadError('We could not load notifications. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const visibleNotifications = useMemo(() => {
    return notifications.filter((row) => {
      const search = query.trim().toLowerCase()
      const matchesQuery =
        !search ||
        [row.title, row.body, row.reportReference, row.recipientName].some((value) =>
          String(value || '').toLowerCase().includes(search),
        )
      const matchesType =
        typeFilter === 'All' || row.type === typeFilter
      const matchesRead =
        readFilter === 'All' || (readFilter === 'Unread' ? !row.readAt : Boolean(row.readAt))
      return matchesQuery && matchesType && matchesRead
    })
  }, [notifications, query, typeFilter, readFilter])

  const totalPages = Math.max(1, Math.ceil(visibleNotifications.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedNotifications = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return visibleNotifications.slice(start, start + pageSize)
  }, [visibleNotifications, safePage, pageSize])

  const markRead = async (notification) => {
    if (notification.isSynthetic) {
      setNotifications((current) =>
        current.map((row) =>
          row.id === notification.id ? { ...row, readAt: new Date().toISOString() } : row,
        ),
      )
      showToast('Notification marked as read.')
      return
    }

    try {
      await markAdminNotificationRead(notification.id)
      setNotifications((current) =>
        current.map((row) =>
          row.id === notification.id ? { ...row, readAt: new Date().toISOString() } : row,
        ),
      )
      showToast('Notification marked as read.')
    } catch {
      showToast('Could not mark this notification as read.')
    }
  }

  const removeNotification = async (notification) => {
    if (notification.isSynthetic) {
      setNotifications((current) => current.filter((row) => row.id !== notification.id))
      showToast('Notification dismissed.')
      return
    }

    try {
      await deleteAdminNotification(notification.id)
      setNotifications((current) => current.filter((row) => row.id !== notification.id))
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
          <div
            role="status"
            className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-3"
          >
            <Check className="size-4 text-brand-yellow" aria-hidden="true" />
            <span>{toast}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <PageHeader
              className="mb-6"
              title="Notifications"
              description="Real-time notifications for incoming resident outage reports, verifications, and staff dispatches."
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
                      placeholder="Search notifications or report ID..."
                      aria-label="Search notifications"
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
                      value={typeFilter}
                      onChange={(event) => {
                        setTypeFilter(event.target.value)
                        setPage(1)
                      }}
                      aria-label="Filter by notification type"
                      className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                    >
                      {typeFilterOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={readFilter}
                      onChange={(event) => {
                        setReadFilter(event.target.value)
                        setPage(1)
                      }}
                      aria-label="Filter by status"
                      className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
                    >
                      <option value="All">All statuses</option>
                      <option value="Unread">Unread</option>
                      <option value="Read">Read</option>
                    </select>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <p className="p-12 text-center text-sm font-semibold text-brand-muted">
                  Loading notifications…
                </p>
              ) : loadError ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button
                    type="button"
                    onClick={reload}
                    className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
                    <Bell className="size-7" />
                  </div>
                  <h2 className="text-base font-bold text-brand-navy">No notifications</h2>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-brand-muted">
                    New resident outage reports and dispatch activity will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-brand-line bg-brand-paper/80 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        <th className="h-11 px-5">Event</th>
                        <th className="h-11 px-5">Type</th>
                        <th className="h-11 px-5">Status</th>
                        <th className="h-11 px-5">Time</th>
                        <th className="h-11 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {paginatedNotifications.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-brand-paper/70">
                          <td className="max-w-[460px] px-5 py-3.5">
                            <div className="flex items-start gap-2.5">
                              {row.type === 'new_report' ? (
                                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                                  <AlertTriangle className="size-3.5" />
                                </span>
                              ) : (
                                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[#e5e9f6] text-brand-blue">
                                  <Bell className="size-3.5" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-bold text-brand-ink">{row.title}</p>
                                  {row.reportReference && (
                                    <a
                                      href="/admin/reports"
                                      className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-brand-blue hover:underline"
                                      title="Open in reports review"
                                    >
                                      <span>{row.reportReference}</span>
                                      <ExternalLink className="size-3" />
                                    </a>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-brand-muted line-clamp-2">
                                  {row.body}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                row.type === 'new_report'
                                  ? 'bg-amber-100 text-amber-800'
                                  : row.type === 'assignment'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-[#e5e9f6] text-brand-blue'
                              }`}
                            >
                              {row.type === 'new_report'
                                ? 'New Report'
                                : row.type === 'assignment'
                                  ? 'Dispatch'
                                  : 'Status Update'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                row.readAt ? 'text-brand-muted' : 'text-emerald-700'
                              }`}
                            >
                              {!row.readAt && <span className="size-1.5 rounded-full bg-emerald-600" />}
                              {row.readAt ? 'Reviewed' : 'Unread'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs tabular-nums text-brand-muted">
                            {formatDate(row.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!row.readAt && (
                                <button
                                  type="button"
                                  onClick={() => markRead(row)}
                                  title="Mark as reviewed"
                                  aria-label="Mark as reviewed"
                                  className="grid size-9 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper hover:text-brand-navy cursor-pointer"
                                >
                                  <Check className="size-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeNotification(row)}
                                title="Dismiss notification"
                                aria-label="Dismiss notification"
                                className="grid size-9 place-items-center rounded-lg border border-[#f3c7c3] bg-white text-[#b42318] transition-colors hover:bg-red-50 cursor-pointer"
                              >
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

              {!isLoading && !loadError && (
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={visibleNotifications.length}
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
    </SidebarProvider>
  )
}
