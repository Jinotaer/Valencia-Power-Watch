import {
  Bell,
  CheckCheck,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Navigation,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadAnnouncements } from '../../lib/announcements'
import {
  countUnreadNotifications,
  loadNotifications,
  markAllNotificationsRead,
} from '../../lib/notifications'

function formatRelativeTime(iso) {
  if (!iso) return 'Just now'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function StaffNotificationsButton({ assignedReports = [] }) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState([])
  const [advisories, setAdvisories] = useState([])
  const [tab, setTab] = useState('all') // 'all' | 'assignments' | 'updates'
  const [loading, setLoading] = useState(false)

  const pendingAssignmentsCount = useMemo(
    () => assignedReports.filter((r) => r.tone === 'pending').length,
    [assignedReports],
  )

  useEffect(() => {
    let active = true
    countUnreadNotifications()
      .then((count) => {
        if (active) setUnreadCount(count)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [assignedReports.length])

  const openModal = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const [notifRows, advRows] = await Promise.all([
        loadNotifications(40).catch(() => []),
        loadAnnouncements(15).catch(() => []),
      ])
      setItems(notifRows)
      setAdvisories(advRows)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {})
    setUnreadCount(0)
    setItems((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })),
    )
  }

  const combinedFeed = useMemo(() => {
    const existingRefs = new Set(items.map((n) => n.reportReference).filter(Boolean))

    // Synthesize assignment alerts from assignedReports when not already in DB notifications
    const synthesizedAssignments = assignedReports
      .filter((r) => !existingRefs.has(r.id))
      .map((r) => ({
        id: `assign-${r.id}`,
        type: 'assignment',
        title:
          r.tone === 'pending'
            ? `New assignment: ${r.id}`
            : r.tone === 'verified'
              ? `Active work order: ${r.id}`
              : `Completed job: ${r.id}`,
        body: `${r.outageType} in Brgy. ${r.barangay}${r.landmark ? ` · ${r.landmark}` : ''}`,
        reportReference: r.id,
        readAt: r.tone === 'pending' ? null : r.updatedAt,
        createdAt: r.updatedAt || r.createdAt,
      }))

    const advisoryFeed = advisories.map((adv) => ({
      id: `adv-${adv.id}`,
      type: 'announcement',
      title: adv.title,
      body: adv.body,
      reportReference: null,
      readAt: adv.publishedAt,
      createdAt: adv.publishedAt,
    }))

    return [...items, ...synthesizedAssignments, ...advisoryFeed].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )
  }, [items, assignedReports, advisories])

  const filteredFeed = useMemo(() => {
    if (tab === 'assignments') {
      return combinedFeed.filter((n) => n.type === 'assignment')
    }
    if (tab === 'updates') {
      return combinedFeed.filter((n) => n.type !== 'assignment')
    }
    return combinedFeed
  }, [combinedFeed, tab])

  const badgeCount = unreadCount + pendingAssignmentsCount

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="relative grid size-10 place-items-center rounded-2xl border border-brand-line bg-white text-brand-navy shadow-xs transition-colors hover:bg-brand-paper cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="size-5 text-brand-blue" />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-navy ring-2 ring-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
            aria-label="Staff notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-line px-5 py-4">
              <div>
                <h2 className="text-base font-black text-brand-navy">Staff Notifications</h2>
                <p className="text-[11px] font-semibold text-brand-muted">
                  Assignments, report updates, and dispatch instructions
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-paper px-2.5 py-1.5 text-[11px] font-bold text-brand-blue hover:bg-[#e5e9f6] cursor-pointer"
                  >
                    <CheckCheck className="size-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-brand-line bg-brand-paper/60 px-5 py-2.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'assignments', label: 'Assignments' },
                { key: 'updates', label: 'Dispatch & Updates' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTab(option.key)}
                  className={`rounded-full px-3 py-1 text-xs font-extrabold transition-colors cursor-pointer ${
                    tab === option.key
                      ? 'bg-brand-blue text-white'
                      : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto divide-y divide-brand-line/60 px-5 py-2">
              {loading && (
                <p className="py-8 text-center text-xs font-semibold text-brand-muted">
                  Loading notifications…
                </p>
              )}

              {!loading && filteredFeed.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm font-bold text-brand-navy">All caught up</p>
                  <p className="mt-1 text-xs text-brand-muted">
                    New job assignments and dispatch instructions will appear here.
                  </p>
                </div>
              )}

              {!loading &&
                filteredFeed.map((item) => {
                  const isUnread = !item.readAt
                  const Icon =
                    item.type === 'assignment'
                      ? ClipboardList
                      : item.type === 'manual'
                        ? MessageSquare
                        : item.type === 'announcement'
                          ? Megaphone
                          : Zap

                  return (
                    <div
                      key={item.id}
                      className={`py-3.5 ${isUnread ? 'bg-[#f4f7ff]/60 -mx-5 px-5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${
                            item.type === 'assignment'
                              ? 'bg-brand-yellow text-brand-navy'
                              : 'bg-[#e5e9f6] text-brand-blue'
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-extrabold text-brand-navy leading-snug">
                              {item.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold text-brand-muted">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                          {item.body && (
                            <p className="mt-1 text-xs text-brand-muted leading-relaxed">
                              {item.body}
                            </p>
                          )}
                          {item.reportReference && (
                            <div className="mt-2 flex items-center gap-2">
                              <a
                                href="/staff/jobs"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand-paper px-2.5 py-1 text-[11px] font-bold text-brand-blue hover:bg-[#e5e9f6] no-underline"
                              >
                                <ClipboardList className="size-3" />
                                <span>View job</span>
                              </a>
                              <a
                                href={`/staff/map?job=${encodeURIComponent(item.reportReference)}`}
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-navy no-underline"
                              >
                                <Navigation className="size-3" />
                                <span>Navigate</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
