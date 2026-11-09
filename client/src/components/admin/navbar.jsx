import {
  AlertTriangle,
  Bell,
  ChevronRight,
  ExternalLink,
  LogOut,
  Settings,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { SidebarTrigger } from '../ui/sidebar'
import { loadAdminNotifications } from '../../lib/notifications'
import { loadAllReports } from '../../lib/reports'
import { supabase } from '../../lib/supabase'

function formatShortTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function NavDropdown({ button, label, children, width = 'w-56', buttonClassName = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`transition-colors duration-150 hover:bg-[#e5e9f6] hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/35 active:bg-[#dbe4f7] active:text-brand-navy ${open ? 'bg-[#e5e9f6] text-brand-blue shadow-[inset_0_0_0_1px_rgba(36,68,154,0.18)]' : 'text-brand-muted'} ${buttonClassName}`}
      >
        {button}
      </Button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`absolute right-0 top-full z-50 mt-2 ${width} rounded-2xl border border-brand-line bg-white p-2 shadow-xl`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function MenuLink({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      role="menuitem"
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-paper hover:text-brand-blue"
    >
      <Icon className="size-4 text-brand-muted" />
      <span>{children}</span>
    </a>
  )
}

function AdminNavbar({ title = 'Dashboard', section = 'Overview' }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    Promise.all([
      loadAdminNotifications(50).catch(() => []),
      loadAllReports().catch(() => []),
    ])
      .then(([notifRows, reportRows]) => {
        if (!active) return

        const reportNotifs = (reportRows || []).map((report) => ({
          id: `report-${report.id}`,
          type: 'new_report',
          title: `New Report: ${report.id}`,
          body: `${report.outageType} · Brgy. ${report.barangay}`,
          reportReference: report.id,
          readAt: report.status !== 'pending' ? report.updatedAt : null,
          createdAt: report.createdAt,
          priority: report.priority,
        }))

        const dbNotifs = (notifRows || []).filter((r) => r.type !== 'manual')

        const merged = [...reportNotifs, ...dbNotifs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        setNotifications(merged)
        setUnreadCount(merged.filter((r) => !r.readAt).length)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-line bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-blue" />
        <div className="hidden items-center gap-2 text-sm text-brand-muted sm:flex">
          <span>{title}</span>
          <ChevronRight className="size-4" />
          <strong className="font-semibold text-brand-ink">{section}</strong>
        </div>
        <h1 className="truncate text-sm font-semibold text-brand-ink sm:hidden">{section}</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <div className="hidden items-center gap-2 border-r border-brand-line pr-3 text-[11px] text-brand-muted md:flex">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>System operational</span>
        </div>
        <NavDropdown
          label="Notifications"
          width="w-80 sm:w-96"
          buttonClassName="border border-brand-line/80 rounded-xl bg-white hover:bg-brand-paper hover:border-brand-line"
          button={
            <span className="relative grid size-8 place-items-center">
              <Bell className="size-4 text-brand-ink" />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-navy shadow-xs ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
          }
        >
          <div className="flex items-center justify-between border-b border-brand-line px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-navy">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <a
              href="/admin/notifications"
              className="text-[11px] font-semibold text-brand-blue hover:underline"
            >
              View all
            </a>
          </div>

          <div className="max-h-80 divide-y divide-brand-line/60 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-brand-muted">
                No recent notifications
              </div>
            ) : (
              recentNotifications.map((n) => (
                <a
                  key={n.id}
                  href="/admin/notifications"
                  className={`block px-3.5 py-2.5 transition-colors hover:bg-brand-paper ${
                    !n.readAt ? 'bg-[#e5e9f6]/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {n.type === 'new_report' ? (
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                        <AlertTriangle className="size-3.5" />
                      </span>
                    ) : (
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[#e5e9f6] text-brand-blue">
                        <Bell className="size-3.5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-brand-ink">{n.title}</p>
                        {!n.readAt && (
                          <span className="size-1.5 shrink-0 rounded-full bg-brand-blue" />
                        )}
                      </div>
                      <p className="line-clamp-1 text-[11px] text-brand-muted">{n.body}</p>
                      <p className="mt-1 text-[10px] tabular-nums text-brand-muted">
                        {formatShortTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          <div className="border-t border-brand-line p-1.5">
            <a
              href="/admin/notifications"
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-paper hover:text-brand-navy"
            >
              <span>Go to notification center</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </NavDropdown>
        <NavDropdown
          label="Profile"
          button={
            <span className="grid size-8 place-items-center rounded-full bg-brand-blue text-white shadow-sm">
              <UserRound className="size-4 text-white" />
            </span>
          }
        >
          <MenuLink href="/admin/profile" icon={UserRound}>Profile</MenuLink>
          <MenuLink href="/admin/settings" icon={Settings}>Settings</MenuLink>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </button>
        </NavDropdown>
      </div>
    </header>
  )
}

export default AdminNavbar
