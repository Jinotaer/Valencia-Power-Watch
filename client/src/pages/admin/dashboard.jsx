import { Activity, AlertTriangle, FileText, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import { loadAnalyticsOverview } from '../../lib/analytics'

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    loadAnalyticsOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch(() => {
        if (active) setLoadError('We could not load live totals. Check your connection and try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const metrics = [
    { label: 'Active incidents', value: overview?.activeIncidents ?? 0, detail: overview ? `${overview.pendingReports} pending · ${overview.verifiedReports} verified` : 'Loading…', icon: AlertTriangle },
    { label: 'Reports today', value: overview?.reportsToday ?? 0, detail: overview ? `${overview.reports} total reports` : 'Loading…', icon: FileText },
    { label: 'Field teams', value: overview?.staffUsers ?? 0, detail: overview ? `${overview.adminUsers} admins · ${overview.totalUsers} total users` : 'Loading…', icon: Users },
    { label: 'Areas monitored', value: overview?.barangays ?? 0, detail: 'Valencia City coverage', icon: MapPin },
  ]

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin" />
      <SidebarInset className="bg-brand-paper">
        <AdminNavbar section="Overview" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <PageHeader
              className="mb-7"
              title="Good morning, administrator."
              description="A live view of outage activity across Valencia City."
            />

            {loadError && <p className="mb-5 rounded-xl border border-[#f3c7c3] bg-white px-4 py-3 text-sm font-semibold text-[#b42318]">{loadError}</p>}

            {isLoading ? (
              <p className="rounded-xl border border-brand-line bg-white p-10 text-center text-sm font-semibold text-brand-muted">Loading live totals…</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metrics.map(({ label, value, detail, icon: Icon }) => (
                    <section key={label} className="rounded-xl border border-brand-line bg-white p-5 shadow-sm shadow-slate-200/40">
                      <div className="mb-5 flex items-center justify-between">
                        <p className="text-sm font-medium text-brand-muted">{label}</p>
                        <span className="grid size-9 place-items-center rounded-full bg-[#e5e9f6] text-brand-blue"><Icon className="size-4" /></span>
                      </div>
                      <p className="text-3xl font-bold tracking-tight text-brand-ink">{value}</p>
                      <p className="mt-1 text-xs text-brand-muted">{detail}</p>
                    </section>
                  ))}
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
                  <section className="rounded-xl border border-brand-line bg-white p-6 shadow-sm shadow-slate-200/40">
                    <div className="flex items-start justify-between border-b border-brand-line pb-4">
                      <div><h3 className="font-semibold text-brand-ink">Incident status</h3><p className="mt-1 text-xs text-brand-muted">Current reports by state</p></div>
                      <Activity className="size-4 text-brand-blue" />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                      {[
                        ['Pending', overview?.pendingReports ?? 0],
                        ['Verified', overview?.verifiedReports ?? 0],
                        ['Resolved', overview?.resolvedReports ?? 0],
                        ['Rejected', overview?.rejectedReports ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-brand-paper p-4">
                          <p className="text-2xl font-bold text-brand-ink">{value}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-muted">{label}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-xl border border-brand-line bg-white p-6 shadow-sm shadow-slate-200/40">
                    <div className="border-b border-brand-line pb-4"><h3 className="font-semibold text-brand-ink">Recent activity</h3><p className="mt-1 text-xs text-brand-muted">Latest report, schedule and announcement updates</p></div>
                    <div className="mt-2 divide-y divide-brand-line">
                      {overview?.recent?.length > 0 ? overview.recent.slice(0, 6).map((item, index) => (
                        <div key={`${item.type}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <span className="min-w-0 truncate font-semibold text-brand-ink">{item.title}</span>
                          <span className="shrink-0 rounded-full bg-[#e5e9f6] px-2 py-0.5 text-[11px] font-bold text-brand-blue">{item.type}</span>
                        </div>
                      )) : <p className="py-10 text-center text-sm text-brand-muted">No recent activity.</p>}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
