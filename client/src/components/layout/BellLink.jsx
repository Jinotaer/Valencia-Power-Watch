import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../../lib/i18n'
import {
  countUnreadNotifications,
  LAST_SEEN_KEY,
  NOTIFICATIONS_UPDATED_EVENT,
} from '../../lib/notifications'

// Bell button for resident headers: opens the notifications page and shows the
// live unread count (stored notifications + new advisories).
export function BellLink() {
  const { t } = useLanguage()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true

    const refresh = () => {
      countUnreadNotifications()
        .then((count) => {
          if (active) setUnread(count)
        })
        .catch(() => {})
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const handleStorage = (event) => {
      if (event.key === LAST_SEEN_KEY) refresh()
    }

    refresh()
    window.addEventListener('pageshow', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      active = false
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <a
      href="/community/notifications"
      className="relative grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-navy shadow-xs transition-colors hover:bg-brand-paper sm:size-10 no-underline"
      aria-label={unread > 0 ? t('Notifications ({count} unread)', { count: unread }) : t('Notifications')}
    >
      <Bell className="size-4.5 text-brand-navy" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-navy shadow-xs ring-2 ring-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </a>
  )
}
