import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  countUnreadNotifications,
  getLastSeenAnnouncements,
  loadNotifications,
} from '../../lib/notifications'
import { loadAnnouncements } from '../../lib/announcements'
import { loadAssignedReports } from '../../lib/reports'
import { useLanguage } from '../../lib/i18n'

export function StaffNotificationsButton({ assignedReports }) {
  const { t } = useLanguage()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    async function computeUnread() {
      try {
        const [notifRows, advRows, reports] = await Promise.all([
          loadNotifications(50).catch(() => []),
          loadAnnouncements(15).catch(() => []),
          Array.isArray(assignedReports) && assignedReports.length > 0
            ? Promise.resolve(assignedReports)
            : loadAssignedReports().catch(() => []),
        ])

        if (!active) return

        const existingRefs = new Set((notifRows || []).map((n) => n.reportReference).filter(Boolean))

        // Synthesize pending assignments not already in DB notifications
        const pendingSynthesized = (reports || []).filter(
          (r) => !existingRefs.has(r.id) && r.tone === 'pending',
        )

        const lastSeen = getLastSeenAnnouncements()
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
        const unreadAdvisories = (advRows || []).filter((adv) =>
          lastSeen > 0
            ? new Date(adv.publishedAt).getTime() > lastSeen
            : new Date(adv.publishedAt).getTime() > fourteenDaysAgo,
        )

        const unreadDb = (notifRows || []).filter((n) => !n.readAt)

        const total = unreadDb.length + pendingSynthesized.length + unreadAdvisories.length
        setUnreadCount(total)
      } catch {
        // Fallback to simple unread count
        countUnreadNotifications()
          .then((c) => {
            if (active) setUnreadCount(c)
          })
          .catch(() => {})
      }
    }

    computeUnread()

    return () => {
      active = false
    }
  }, [assignedReports])

  return (
    <a
      href="/staff/notifications"
      className="relative grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-navy shadow-xs transition-colors hover:bg-brand-paper sm:size-10 no-underline"
      aria-label={unreadCount > 0 ? t('Notifications ({count} unread)', { count: unreadCount }) : t('Notifications')}
    >
      <Bell className="size-4.5 text-brand-navy" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-navy shadow-xs ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </a>
  )
}

export default StaffNotificationsButton
