import { Bell, ChevronRight, CircleHelp, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { SidebarTrigger } from '../ui/sidebar'

function AdminNavbar({ title = 'Dashboard', section = 'Overview' }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="text-slate-500 hover:bg-blue-50 hover:text-brand-blue" />
        <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
          <span>{title}</span>
          <ChevronRight className="size-4" />
          <strong className="font-semibold text-slate-700">{section}</strong>
        </div>
        <h1 className="truncate text-sm font-semibold text-slate-800 sm:hidden">{section}</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <div className="hidden items-center gap-2 border-r border-slate-200 pr-3 text-[11px] text-slate-500 md:flex">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>System operational</span>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-brand-blue" aria-label="Search">
          <Search />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-blue-50 hover:text-brand-blue" aria-label="Notifications">
          <Bell />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-brand-navy text-xs font-bold text-white hover:bg-brand-blue" aria-label="Open account menu">
          AD
        </Button>
        <CircleHelp className="ml-1 hidden size-4 text-slate-400 lg:block" aria-hidden="true" />
      </div>
    </header>
  )
}

export default AdminNavbar
