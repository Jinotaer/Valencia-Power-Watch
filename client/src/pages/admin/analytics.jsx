import { Activity, BarChart3, Download, FileText, MapPin, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import { loadAnalyticsOverview } from '../../lib/analytics'
import { downloadCsv } from '../../lib/adminUsers'

const statusLabels = { pending: 'Pending', verified: 'Verified', resolved: 'Resolved', rejected: 'Rejected' }

function Distribution({ title, items, total }) {
  const max = Math.max(...Object.values(items), 1)
  return (
    <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
      <h2 className="font-bold text-brand-navy">{title}</h2>
      <div className="mt-4 space-y-3">
        {Object.entries(items).length === 0 && <p className="text-sm text-brand-muted">No data yet.</p>}
        {Object.entries(items).map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-semibold text-brand-muted">{statusLabels[label] ?? label}</span>
              <span className="font-bold text-brand-ink">{value}{total ? ` · ${Math.round((value / total) * 100)}%` : ''}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e5e9f6]">
              <div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AdminAnalytics() {
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
        if (active) setLoadError('We could not load analytics. Check your connection and try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => overview ? [
    { label: 'Total users', value: overview.totalUsers, icon: Users },
    { label: 'Staff', value: overview.staffUsers, icon: Activity },
    { label: 'Reports', value: overview.reports, icon: FileText },
    { label: 'Pending verifications', value: overview.pendingReports, icon: BarChart3 },
    { label: 'Active incidents', value: overview.activeIncidents, icon: Trash2 },
    { label: 'Resolved', value: overview.resolvedReports, icon: MapPin },
    { label: 'Barangays', value: overview.barangays, icon: MapPin },
    { label: 'Published schedules', value: overview.publishedSchedules, icon: Activity },
  ] : [], [overview])

  const exportReports = () => {
    if (!overview) return
    downloadCsv('powerwatch-reports.csv', [
      ['Type', 'Count'],
      ...Object.entries(overview.byType).map(([type, count]) => [type, count]),
    ])
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/analytics" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Administration" section="Analytics" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <PageHeader
              className="mb-6"
              title="Analytics"
              description="Live totals and distributions from reports, users, schedules, barangays and announcements."
              actions={
                <button type="button" onClick={exportReports} disabled={!overview} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-navy disabled:opacity-60">
                  <Download className="size-4" />
                  Export report CSV
                </button>
              }
            />

            {isLoading && <p className="rounded-2xl border border-brand-line bg-white p-10 text-center text-sm font-semibold text-brand-muted">Loading analytics…</p>}
            {loadError && <p className="rounded-2xl border border-[#f3c7c3] bg-white p-10 text-center text-sm font-bold text-[#b42318]">{loadError}</p>}

            {overview && !isLoading && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <section key={label} className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-brand-muted">{label}</p>
                        <span className="grid size-9 place-items-center rounded-full bg-[#e5e9f6] text-brand-blue">
                          <Icon className="size-4" />
                        </span>
                      </div>
                      <p className="mt-4 text-3xl font-bold tracking-tight text-brand-ink">{value}</p>
                    </section>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Distribution title="Reports by status" items={overview.byStatus} total={overview.reports} />
                  <Distribution title="Reports by outage type" items={overview.byType} total={overview.reports} />
                  <Distribution title="Reports by barangay" items={overview.byBarangay} total={overview.reports} />
                  <Distribution title="Reports by assigned staff" items={overview.byStaff} total={overview.reports} />
                </div>

                <section className="mt-6 rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
                  <h2 className="font-bold text-brand-navy">Recent activity</h2>
                  <div className="mt-4 divide-y divide-brand-line">
                    {overview.recent.length === 0 && <p className="py-8 text-center text-sm text-brand-muted">No recent activity.</p>}
                    {overview.recent.map((item, index) => (
                      <div key={`${item.type}-${item.title}-${index}`} className="flex items-start justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-ink">{item.title}</p>
                          <p className="mt-0.5 truncate text-xs text-brand-muted">{item.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#e5e9f6] px-2 py-0.5 text-[11px] font-bold text-brand-blue">{item.type}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
