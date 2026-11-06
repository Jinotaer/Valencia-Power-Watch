import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Users,
} from 'lucide-react'
import powerWatchLogo from '../../assets/logo.png'
import { supabase } from '../../lib/supabase'
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
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Barangays', icon: Building2, href: '/admin/barangay' },
  { label: 'Outage reports', icon: FileText, href: '/admin/reports' },
  { label: 'Scheduled outages', icon: CalendarClock, href: '/admin/schedules' },
  { label: 'Incident map', icon: Map, href: '/admin/map' },
  { label: 'Field response', icon: ClipboardCheck, href: '/admin/response' },
]

const administrationItems = [
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

function AdminSidebar({ activePath = '/admin' }) {
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

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
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleSignOut}
              className="h-10 rounded-lg px-3 text-sm text-brand-muted hover:bg-red-50 hover:text-red-700"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 rounded-lg bg-brand-paper p-2 text-xs text-brand-muted group-data-[collapsible=icon]:justify-center">
          <Activity className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate">System operational</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AdminSidebar
