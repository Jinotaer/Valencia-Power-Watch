import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { countUnreadNotifications } from '../../lib/notifications'

// Bell button for resident headers: opens the notifications page and shows the
// live unread count (stored notifications + new advisories).
export function BellLink() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    countUnreadNotifications()
      .then((count) => {
        if (active) setUnread(count)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <a
      href="/community/notifications"
      className="relative grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-muted transition-colors hover:bg-brand-paper sm:size-10"
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
    >
      <Bell className="size-[17px] sm:size-[19px]" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand-yellow px-0.5 text-[9px] font-black text-brand-navy ring-2 ring-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </a>
  )
}
