import {
  ArrowLeft,
  Bell,
  CheckCheck,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Navigation,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PortalMark, PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { loadAnnouncements } from '../../lib/announcements'
import {
  getLastSeenAnnouncements,
  loadNotifications,
  markAllNotificationsRead,
  markAnnouncementsSeen,
} from '../../lib/notifications'
import { loadAssignedReports } from '../../lib/reports'
import { localeFor, useLanguage } from '../../lib/i18n'

function formatRelativeTime(iso, t, locale) {
  if (!iso) return t('Just now')
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000)
  if (diffMinutes < 1) return t('Just now')
  if (diffMinutes < 60) return t('{minutes}m ago', { minutes: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return t('{hours}h ago', { hours: diffHours })
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export default function StaffNotifications() {
  const { language, t } = useLanguage()
  const locale = localeFor(language)
  const [mountTime] = useState(() => Date.now())
  const [items, setItems] = useState([])
  const [advisories, setAdvisories] = useState([])
  const [assignedReports, setAssignedReports] = useState([])
  const [tab, setTab] = useState('all') // 'all' | 'assignments' | 'updates'
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isMarking, setIsMarking] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [arrivalLastSeen, setArrivalLastSeen] = useState(() => getLastSeenAnnouncements())
  const [arrivalUnreadIds, setArrivalUnreadIds] = useState(null)
  const hasAutoMarkedRef = useRef(false)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((prev) => prev + 1)
  }

  useEffect(() => {
    let active = true

    Promise.all([
      loadNotifications(50).catch(() => []),
      loadAnnouncements(15).catch(() => []),
      loadAssignedReports().catch(() => []),
    ])
      .then(([notifs, notices, reports]) => {
        if (!active) return
        setItems(notifs)
        setAdvisories(notices)
        setAssignedReports(reports)

        if (!hasAutoMarkedRef.current) {
          hasAutoMarkedRef.current = true
          const unreadDbIds = notifs.filter((n) => !n.readAt).map((n) => n.id)
          setArrivalUnreadIds(new Set(unreadDbIds))
          const latestNoticeMs = notices.reduce((max, row) => {
            const ts = new Date(row.publishedAt).getTime()
            return Number.isFinite(ts) ? Math.max(max, ts) : max
          }, 0)

          if (unreadDbIds.length > 0) {
            markAllNotificationsRead(latestNoticeMs).catch(() => {})
          } else if (notices.length > 0) {
            markAnnouncementsSeen(latestNoticeMs)
          }
        }
      })
      .catch(() => {
        if (active) {
          setLoadError('We could not load your notifications. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const latestAdvisoryTimestamp = useMemo(
    () =>
      advisories.reduce((max, row) => {
        const ts = new Date(row.publishedAt).getTime()
        return Number.isFinite(ts) ? Math.max(max, ts) : max
      }, 0),
    [advisories],
  )

  const handleMarkAllRead = async () => {
    if (isMarking) return
    setIsMarking(true)
    try {
      await markAllNotificationsRead(latestAdvisoryTimestamp).catch(() => {})
      setArrivalUnreadIds(new Set())
      setArrivalLastSeen(Math.max(Date.now(), latestAdvisoryTimestamp))
      setItems((prev) =>
        prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })),
      )
      reload()
    } finally {
      setIsMarking(false)
    }
  }

  const combinedFeed = useMemo(() => {
    const existingRefs = new Set(items.map((n) => n.reportReference).filter(Boolean))

    const synthesizedAssignments = assignedReports
      .filter((r) => !existingRefs.has(r.id))
      .map((r) => ({
        id: `assign-${r.id}`,
        type: 'assignment',
        title:
          r.tone === 'pending'
            ? t('New assignment: {id}', { id: r.id })
            : r.tone === 'verified'
              ? t('Active work order: {id}', { id: r.id })
              : t('Completed job: {id}', { id: r.id }),
        body: `${t('{type} in Brgy. {barangay}', { type: r.outageType, barangay: r.barangay })}${r.landmark ? ` · ${r.landmark}` : ''}`,
        reportReference: r.id,
        readAt: r.tone === 'pending' ? null : r.updatedAt,
        createdAt: r.updatedAt || r.createdAt,
      }))

    const fourteenDaysAgo = mountTime - 14 * 24 * 60 * 60 * 1000
    const advisoryFeed = advisories.map((adv) => ({
      id: `adv-${adv.id}`,
      type: 'announcement',
      title: adv.title,
      body: adv.body,
      reportReference: null,
      readAt:
        arrivalLastSeen > 0
          ? new Date(adv.publishedAt).getTime() <= arrivalLastSeen
            ? adv.publishedAt
            : null
          : new Date(adv.publishedAt).getTime() <= fourteenDaysAgo
            ? adv.publishedAt
            : null,
      createdAt: adv.publishedAt,
    }))

    const storedWithArrival = items.map((item) => {
      const stillUnreadOnArrival = arrivalUnreadIds ? arrivalUnreadIds.has(item.id) : !item.readAt
      return stillUnreadOnArrival ? { ...item, readAt: null } : { ...item, readAt: item.readAt || item.createdAt }
    })

    return [...storedWithArrival, ...synthesizedAssignments, ...advisoryFeed].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )
  }, [items, assignedReports, advisories, mountTime, arrivalLastSeen, arrivalUnreadIds, t])

  const unreadCount = useMemo(() => combinedFeed.filter((n) => !n.readAt).length, [combinedFeed])
  const assignmentCount = useMemo(
    () => combinedFeed.filter((n) => n.type === 'assignment').length,
    [combinedFeed],
  )
  const updateCount = useMemo(
    () => combinedFeed.filter((n) => n.type !== 'assignment').length,
    [combinedFeed],
  )

  const filteredFeed = useMemo(() => {
    if (tab === 'assignments') {
      return combinedFeed.filter((n) => n.type === 'assignment')
    }
    if (tab === 'updates') {
      return combinedFeed.filter((n) => n.type !== 'assignment')
    }
    return combinedFeed
  }, [combinedFeed, tab])

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy flex flex-col justify-between">
      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md sm:max-w-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/staff"
              className="grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-navy shadow-xs transition-colors hover:bg-brand-paper"
              aria-label={t('Back to staff workspace')}
            >
              <ArrowLeft className="size-4" />
            </a>
            <PortalMark role="staff" />
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarking}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-3 py-1.5 text-xs font-bold text-brand-blue shadow-xs hover:bg-[#e5e9f6] transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              <span>{isMarking ? t('Marking…') : t('Mark all read')}</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-md sm:max-w-xl px-4 pb-32 pt-5 flex-1">
        {/* PAGE TITLE */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-navy">
              {t('Notifications')}
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-extrabold text-brand-blue">
                {t('{count} unread', { count: unreadCount })}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-brand-muted font-medium">
            {t('Assignments, report updates, and dispatch instructions')}
          </p>
        </div>

        {/* FILTER TABS */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: t('All ({count})', { count: combinedFeed.length }) },
            { key: 'assignments', label: t('Assignments ({count})', { count: assignmentCount }) },
            { key: 'updates', label: t('Dispatch & Updates ({count})', { count: updateCount }) },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTab(option.key)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                tab === option.key
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'border border-brand-line bg-white text-brand-navy hover:bg-brand-paper'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* CONTENT STATES */}
        {isLoading && (
          <div className="rounded-2xl border border-brand-line bg-white px-5 py-12 text-center text-xs font-semibold text-brand-muted shadow-xs">
            {t('Loading notifications…')}
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-red-200 bg-white px-5 py-10 text-center shadow-xs">
            <p className="text-xs font-bold text-[#b42318]">{t(loadError)}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer"
            >
              {t('Try again')}
            </button>
          </div>
        )}

        {/* NOTIFICATIONS LIST */}
        {!isLoading && !loadError && (
          <div className="space-y-3">
            {filteredFeed.map((item) => {
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
                <article
                  key={item.id}
                  className={`rounded-2xl border transition-all p-4 shadow-xs ${
                    isUnread
                      ? 'border-brand-blue/30 bg-[#f4f7ff]'
                      : 'border-brand-line bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                        item.type === 'assignment'
                          ? 'bg-brand-yellow text-brand-navy'
                          : 'bg-[#e5e9f6] text-brand-blue'
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-sm font-extrabold text-brand-navy leading-snug">
                          {item.title}
                        </h2>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUnread && (
                            <span className="size-2 rounded-full bg-brand-blue" aria-label={t('Unread')} />
                          )}
                          <span className="text-[10px] font-semibold text-brand-muted">
                            {formatRelativeTime(item.createdAt, t, locale)}
                          </span>
                        </div>
                      </div>

                      {item.body && (
                        <p className="mt-1 text-xs text-brand-muted leading-relaxed">
                          {item.body}
                        </p>
                      )}

                      {item.reportReference && (
                        <div className="mt-3 flex items-center gap-2 pt-1 border-t border-brand-line/50">
                          <a
                            href="/staff/jobs"
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-paper px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-[#e5e9f6] no-underline transition-colors"
                          >
                            <ClipboardList className="size-3.5" />
                            <span>{t('View job')}</span>
                          </a>
                          <a
                            href={`/staff/map?job=${encodeURIComponent(item.reportReference)}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-navy no-underline transition-colors"
                          >
                            <Navigation className="size-3.5" />
                            <span>{t('Navigate')}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}

            {filteredFeed.length === 0 && (
              <div className="rounded-2xl border border-dashed border-brand-line bg-white px-5 py-12 text-center">
                <Bell className="mx-auto size-9 text-brand-muted" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-bold text-brand-navy">{t('All caught up')}</h2>
                <p className="mt-1 text-xs leading-5 text-brand-muted">
                  {t('New job assignments and dispatch instructions will appear here.')}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="staff" />
    </div>
  )
}
