import { Activity, AlertTriangle, FileText, MapPin, Users } from 'lucide-react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'

const metrics = [
  { label: 'Active incidents', value: '0', detail: 'No unresolved incidents', icon: AlertTriangle },
  { label: 'Reports today', value: '0', detail: 'Awaiting community reports', icon: FileText },
  { label: 'Teams available', value: '0', detail: 'Field personnel online', icon: Users },
  { label: 'Areas monitored', value: '1', detail: 'Valencia City coverage', icon: MapPin },
]

function AdminDashboard() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-[#f8fafc]">
        <AdminNavbar section="Overview" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-brand-blue">Operations overview</p>
                <h2 className="text-3xl font-bold tracking-[-.04em] text-brand-navy">Good morning, administrator.</h2>
                <p className="mt-2 text-sm text-slate-500">A clear view of outage activity across Valencia City.</p>
              </div>
              <a href="/admin/reports" className="inline-flex h-10 items-center rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy">Review reports</a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, detail, icon: Icon }) => (
                <section key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <span className="grid size-9 place-items-center rounded-full bg-blue-50 text-brand-blue"><Icon className="size-4" /></span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-800">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{detail}</p>
                </section>
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div><h3 className="font-semibold text-slate-800">Incident status</h3><p className="mt-1 text-xs text-slate-400">Current reports by state</p></div>
                  <Activity className="size-4 text-brand-blue" />
                </div>
                <div className="grid min-h-56 place-items-center text-center"><div><p className="text-4xl font-bold text-slate-700">0</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-slate-400">Active incidents</p></div></div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <div className="border-b border-slate-100 pb-4"><h3 className="font-semibold text-slate-800">Recent activity</h3><p className="mt-1 text-xs text-slate-400">Latest report and field updates</p></div>
                <div className="grid min-h-56 place-items-center text-center"><div><p className="text-sm font-medium text-slate-600">No recent activity</p><p className="mt-1 text-xs text-slate-400">New updates will appear here.</p></div></div>
              </section>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminDashboard
