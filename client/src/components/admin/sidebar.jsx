import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  FileText,
  FileSearch,
  HardHat,
  LayoutDashboard,
  Map,
  Megaphone,
  Users,
  UsersRound,
} from 'lucide-react'
import powerWatchLogo from '../../assets/logo.svg'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

const primaryItems = [
  // Sign-out is handled from the admin navbar profile dropdown.
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Outage reports', icon: FileText, href: '/admin/reports' },
  { label: 'Incident map', icon: Map, href: '/admin/map' },
  { label: 'Scheduled outages', icon: CalendarClock, href: '/admin/schedules' },
  { label: 'Barangays', icon: Building2, href: '/admin/barangay' },
  { label: 'Field teams', icon: HardHat, href: '/admin/teams' },
  { label: 'Announcements', icon: Megaphone, href: '/admin/announcements' },
  
]

const administrationItems = [
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Audit logs', icon: FileSearch, href: '/admin/audit-logs' },
  { label: 'Residents', icon: UsersRound, href: '/admin/residents' },
  { label: 'Users', icon: Users, href: '/admin/users' },
]

function AdminSidebar({ activePath = '/admin' }) {
  const renderItems = (items) => items.map(({ label, icon: Icon, href }) => (
    <SidebarMenuItem key={href}>
      <SidebarMenuButton
        isActive={activePath === href}
        tooltip={label}
        render={<a href={href}><Icon /><span>{label}</span></a>}
        className="h-10 rounded-lg px-3 text-sm text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-blue data-[active=true]:bg-brand-blue data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-sm"
      >
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))

  return (
    <Sidebar collapsible="icon" className="border-brand-line bg-white">
      <SidebarHeader className="border-b border-brand-line px-4 py-5 group-data-[collapsible=icon]:px-2">
        <a href="/admin" className="flex items-center gap-3 overflow-hidden">
          <img className="size-9 shrink-0 rounded-lg object-contain" src={powerWatchLogo} alt="Valencia PowerWatch" />
          <span className="whitespace-nowrap text-sm font-bold tracking-tight text-brand-navy">Valencia PowerWatch</span>
        </a>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-brand-muted">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(primaryItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-5 p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-brand-muted">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{renderItems(administrationItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-brand-line p-3">
        <div className="flex items-center gap-2 rounded-lg bg-brand-paper p-2 text-xs text-brand-muted group-data-[collapsible=icon]:justify-center">
          <Activity className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate">System operational</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AdminSidebar
