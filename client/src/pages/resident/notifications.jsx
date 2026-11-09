import { Bell, Check, ClipboardList, Megaphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'
import { useLanguage } from '../../lib/i18n'
import { loadAnnouncements } from '../../lib/announcements'
import {
  getLastSeenAnnouncements,
  loadNotifications,
  loadNotificationPreferences,
  markAllNotificationsRead,
} from '../../lib/notifications'
import { loadActiveSchedules } from '../../lib/schedules'

function timeAgo(value, locale, t) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return t('just now')
  if (minutes < 60) return t('{minutes} min ago', { minutes })
  if (minutes < 1440) return t('{hours} h ago', { hours: Math.round(minutes / 60) })
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ResidentNotifications() {
  const { t, locale } = useLanguage()
  const [mountTime] = useState(() => Date.now())
  const [stored, setStored] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [schedules, setSchedules] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isMarking, setIsMarking] = useState(false)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    Promise.all([
      loadNotifications().catch(() => []),
      loadAnnouncements(10).catch(() => []),
      loadActiveSchedules().catch(() => []),
      loadNotificationPreferences().catch(() => null),
    ])
      .then(([notifications, notices, nextSchedules, prefs]) => {
        if (!active) return
        setStored(notifications)
        setAnnouncements(notices)
        setSchedules(nextSchedules)
        setPreferences(prefs)
      })
      .catch(() => {
        if (active) setLoadError('We could not load your notifications. Check your connection and try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const items = useMemo(() => {
    const list = stored.map((row) => ({
      id: row.id,
      icon: ClipboardList,
      title: row.title,
      body: row.body,
      when: row.createdAt,
      read: Boolean(row.readAt),
      href: row.reportReference ? `/community/reports/${row.reportReference}` : null,
    }))

    const lastSeen = getLastSeenAnnouncements()
    const fourteenDaysAgo = mountTime - 14 * 24 * 60 * 60 * 1000

    if (preferences?.outageAlerts !== false) {
      announcements.forEach((row) => {
        const isRead =
          lastSeen > 0
            ? new Date(row.publishedAt).getTime() <= lastSeen
            : new Date(row.publishedAt).getTime() <= fourteenDaysAgo
        list.push({
          id: `announcement-${row.id}`,
          icon: Megaphone,
          title: row.title,
          body: `${t(row.category === 'restoration' ? 'Restoration update' : 'Advisory')}${row.barangay ? ` · ${t('Brgy. {barangay}', { barangay: row.barangay })}` : ''}`,
          when: row.publishedAt,
          read: isRead,
          href: '/community/announcements',
        })
      })
    }

    if (preferences?.scheduledReminders) {
      schedules.forEach((row) => {
        list.push({
          id: `schedule-${row.id}`,
          icon: Bell,
          title: row.title || t('Scheduled outage'),
          body: `${row.barangay ? `${t('Brgy. {barangay}', { barangay: row.barangay })} · ` : ''}${row.dateLabel} · ${row.timeLabel}`,
          when: row.date,
          read: false,
          href: '/community/schedule',
        })
      })
    }

    return list
  }, [stored, announcements, schedules, preferences, mountTime, t])

  const handleMarkAllRead = async () => {
    if (isMarking) return
    setIsMarking(true)
    try {
      await markAllNotificationsRead()
      reload()
    } catch {
      setLoadError('We could not mark notifications as read. Try again.')
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community" className="no-underline"><PortalMark role="resident" /></a>
          <span className="grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-muted sm:size-10" aria-hidden="true">
            <Bell className="size-[17px] sm:size-[19px]" />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-brand-navy">{t('Notifications')}</h1>
            <p className="mt-1 text-[11px] leading-4 text-brand-muted sm:mt-2 sm:text-sm sm:leading-6">{t('Report updates, outage alerts and advisories.')}</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarking || (!items.some((item) => !item.read) && !isLoading)}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-brand-line bg-white px-3 text-[11px] font-bold text-brand-blue disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <Check className="size-3.5" />
            <span>{isMarking ? t('Marking…') : t('Mark all read')}</span>
          </button>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {isLoading && (
            <div className="rounded-2xl border border-brand-line bg-white px-5 py-10 text-center text-sm font-semibold text-brand-muted">
              {t('Loading notifications…')}
            </div>
          )}

          {!isLoading && loadError && (
            <div className="rounded-2xl border border-[#f3c7c3] bg-white px-5 py-10 text-center">
              <p className="text-sm font-bold text-[#b42318]">{t(loadError)}</p>
              <button type="button" onClick={reload} className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer">
                {t('Try again')}
              </button>
            </div>
          )}

          {!isLoading && !loadError && items.map((item) => {
            const Icon = item.icon
            const card = (
              <>
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.read ? 'bg-[#e5e9f6] text-brand-muted' : 'bg-[#fff1a8] text-[#9a6500]'}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-brand-navy">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-brand-muted">{item.body}</span>
                  <span className="mt-1 block text-[10px] font-semibold text-brand-muted">{timeAgo(item.when, locale, t)}</span>
                </span>
                {!item.read && <span className="size-2 shrink-0 rounded-full bg-brand-blue" aria-label={t('Unread')} />}
              </>
            )
            const className = 'flex items-start gap-3 rounded-2xl border border-brand-line bg-white p-3.5 shadow-[0_6px_18px_rgba(23,43,104,0.04)] sm:p-5'
            return item.href
              ? <a key={item.id} href={item.href} className={`${className} no-underline`}>{card}</a>
              : <article key={item.id} className={className}>{card}</article>
          })}

          {!isLoading && !loadError && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-line bg-white px-5 py-10 text-center">
              <Bell className="mx-auto size-8 text-brand-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-brand-muted">{t("You're all caught up.")}</p>
              <p className="mt-1 text-xs leading-5 text-brand-muted">{t('Report status changes and new advisories will appear here.')}</p>
            </div>
          )}
        </div>
      </main>

      <PortalMobileNav role="resident" />
    </div>
  )
}
