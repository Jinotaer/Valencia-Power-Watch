import { Bell, ChevronRight, LogOut, Settings, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { SidebarTrigger } from '../ui/sidebar'
import { loadAdminNotifications } from '../../lib/notifications'
import { supabase } from '../../lib/supabase'

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
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true
    loadAdminNotifications(200)
      .then((rows) => {
        if (active) setUnreadCount(rows.filter((row) => !row.readAt).length)
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
          button={
            <span className="relative grid size-8 place-items-center">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand-yellow px-0.5 text-[9px] font-black text-brand-navy ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
          }
        >
          <MenuLink href="/admin/notifications" icon={Bell}>All notifications</MenuLink>
          <MenuLink href="/admin/notifications" icon={Settings}>Notification settings</MenuLink>
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
