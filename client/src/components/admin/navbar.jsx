import { Bell, ChevronRight, CircleHelp, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { SidebarTrigger } from '../ui/sidebar'

function AdminNavbar({ title = 'Dashboard', section = 'Overview' }) {
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
        <Button variant="ghost" size="icon" className="text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-blue" aria-label="Search">
          <Search />
        </Button>
        <Button variant="ghost" size="icon" className="text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-blue" aria-label="Notifications">
          <Bell />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-brand-navy text-xs font-bold text-white hover:bg-brand-blue" aria-label="Open account menu">
          AD
        </Button>
        <CircleHelp className="ml-1 hidden size-4 text-brand-muted lg:block" aria-hidden="true" />
      </div>
    </header>
  )
}

export default AdminNavbar
