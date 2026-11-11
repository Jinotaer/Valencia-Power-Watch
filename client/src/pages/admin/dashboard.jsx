import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  FileText,
  MapPin,
  Radio,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import { Button } from '../../components/ui/button'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import { loadAnalyticsOverview } from '../../lib/analytics'
import { loadAllReports } from '../../lib/reports'
import { generateExecutiveBriefing } from '../../lib/adminAiAssistant'
import DashboardCharts from '../../components/admin/dashboard/DashboardCharts'

function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [briefing, setBriefing] = useState(null)
  const [isBriefingOpen, setIsBriefingOpen] = useState(false)
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false)
  const [lastSynced, setLastSynced] = useState(() => new Date())

  const fetchOverview = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await loadAnalyticsOverview()
      setOverview(data)
      setLastSynced(new Date())
    } catch {
      setLoadError('Unable to refresh live totals. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleBriefing = async () => {
    if (isBriefingOpen && briefing) {
      setIsBriefingOpen(false)
      return
    }

    setIsBriefingOpen(true)
    if (!briefing && !isGeneratingBriefing) {
      setIsGeneratingBriefing(true)
      try {
        const reports = await loadAllReports()
        const result = await generateExecutiveBriefing({ reports, overview: overview || {} })
        if (result) setBriefing(result)
      } catch (err) {
        console.warn('Failed to generate executive briefing:', err)
      } finally {
        setIsGeneratingBriefing(false)
      }
    }
  }

  const handleRefreshBriefing = async () => {
    if (isGeneratingBriefing) return
    setIsGeneratingBriefing(true)
    try {
      const reports = await loadAllReports()
      const result = await generateExecutiveBriefing({ reports, overview: overview || {} })
      if (result) setBriefing(result)
    } catch (err) {
      console.warn('Failed to refresh briefing:', err)
    } finally {
      setIsGeneratingBriefing(false)
    }
  }

  useEffect(() => {
    let active = true
    loadAnalyticsOverview()
      .then((data) => {
        if (active) {
          setOverview(data)
          setLastSynced(new Date())
        }
      })
      .catch(() => {
        if (active) setLoadError('Unable to load live totals. Check your connection.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const metrics = [
    {
      label: 'Active incidents',
      value: overview?.activeIncidents ?? 0,
      detail: overview
        ? `${overview.pendingReports} pending · ${overview.verifiedReports} verified`
        : 'Loading…',
      icon: AlertTriangle,
    },
    {
      label: 'Reports today',
      value: overview?.reportsToday ?? 0,
      detail: overview ? `${overview.reports} total reports` : 'Loading…',
      icon: FileText,
    },
    {
      label: 'Field teams',
      value: overview?.staffUsers ?? 0,
      detail: overview
        ? `${overview.adminUsers} admins · ${overview.totalUsers} total users`
        : 'Loading…',
      icon: Users,
    },
    {
      label: 'Areas monitored',
      value: overview?.barangays ?? 0,
      detail: 'Valencia City coverage',
      icon: MapPin,
    },
  ]

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin" />
      <SidebarInset className="bg-brand-paper min-h-screen">
        <AdminNavbar title="Dashboard" section="Overview" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header: Title + Action Buttons matching barangay.jsx */}
            <PageHeader
              title="Operations Overview"
              description="Real-time incident intake, grid telemetry, and restoration coordination across Valencia City."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchOverview}
                    disabled={isLoading}
                    className="h-10 gap-2 rounded-lg border border-brand-line bg-white px-3.5 text-xs font-semibold text-brand-navy hover:bg-brand-paper transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`size-4 text-brand-muted ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleBriefing}
                    className={`h-10 gap-2 rounded-lg border px-3.5 text-xs font-semibold cursor-pointer transition-colors ${
                      isBriefingOpen
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-brand-line bg-white text-brand-navy hover:bg-brand-paper'
                    }`}
                  >
                    <Bot className={`size-4 ${isBriefingOpen ? 'text-white' : 'text-brand-blue'}`} />
                    <span>{isBriefingOpen ? 'Hide Briefing' : 'Executive Briefing'}</span>
                  </Button>

                  <a
                    href="/admin/announcements"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-blue hover:bg-brand-navy px-4 font-semibold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Radio className="size-4" />
                    <span>Broadcast Advisory</span>
                  </a>
                </div>
              }
            />

            {loadError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                {loadError}
              </div>
            )}

            {/* Collapsible Executive Briefing (Restrained, high-density, no generic slop) */}
            {isBriefingOpen && (
              <section className="relative rounded-2xl border border-brand-navy/30 bg-white p-6 shadow-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setIsBriefingOpen(false)}
                  className="absolute right-4 top-4 grid size-7 place-items-center rounded-lg text-brand-muted hover:bg-brand-paper hover:text-brand-navy transition-colors cursor-pointer"
                  aria-label="Dismiss briefing"
                >
                  <X className="size-4" />
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line pb-3 pr-8">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-md bg-brand-navy text-white text-[11px] font-bold">
                      EB
                    </span>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                        Executive Grid Situation Briefing
                      </h2>
                      <p className="text-[11px] text-brand-muted">
                        {briefing?.generatedAt
                          ? `Generated ${new Date(briefing.generatedAt).toLocaleTimeString()} from active incident telemetry`
                          : 'Synthesizing live reports across Valencia City…'}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={handleRefreshBriefing}
                    disabled={isGeneratingBriefing}
                    className="text-xs font-semibold text-brand-blue hover:text-brand-navy cursor-pointer"
                  >
                    <RefreshCw className={`size-3 mr-1 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingBriefing ? 'Updating…' : 'Re-analyze Grid'}</span>
                  </Button>
                </div>

                {isGeneratingBriefing && !briefing ? (
                  <div className="py-8 text-center text-xs text-brand-muted animate-pulse">
                    Analyzing active reports, spatial clusters, and field coverage across 31 barangays…
                  </div>
                ) : briefing ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-brand-navy">{briefing.headline}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-brand-ink">{briefing.summary}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pt-1 border-t border-brand-line/60">
                      {briefing.hotspots?.length > 0 && (
                        <div className="rounded-xl border border-brand-line bg-brand-paper p-3.5">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-navy">
                            Active Impact Hotspots
                          </h4>
                          <ul className="mt-2 space-y-1.5 text-xs text-brand-ink">
                            {briefing.hotspots.map((h) => (
                              <li key={h.barangay} className="flex items-center justify-between">
                                <span className="font-semibold text-brand-navy">Brgy. {h.barangay}</span>
                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                  {h.incidentCount} active report{h.incidentCount !== 1 ? 's' : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {briefing.recommendations?.length > 0 && (
                        <div className="rounded-xl border border-brand-line bg-brand-paper p-3.5">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-navy">
                            Operational Dispatch Directives
                          </h4>
                          <ul className="mt-2 space-y-1.5 text-xs text-brand-ink list-disc list-inside">
                            {briefing.recommendations.map((rec, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span className="font-medium text-brand-navy">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {/* Preserved KPI Cards Design */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, detail, icon: Icon }) => (
                <section
                  key={label}
                  className="rounded-xl border border-brand-line bg-white p-5 shadow-sm shadow-slate-200/40"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm font-medium text-brand-muted">{label}</p>
                    <span className="grid size-9 place-items-center rounded-full bg-[#e5e9f6] text-brand-blue">
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-brand-ink">{value}</p>
                  <p className="mt-1 text-xs text-brand-muted">{detail}</p>
                </section>
              ))}
            </div>

            {/* Primary Visualizations */}
            <DashboardCharts overview={overview} />

            {/* Operational Event Ledger (High density, real data, clickable) */}
            <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-brand-line pb-4">
                <div>
                  <h2 className="text-sm font-bold text-brand-navy">Operational Dispatch Ledger</h2>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    Real-time log of citizen reports, scheduled outages, and public broadcasts
                  </p>
                </div>
                <a
                  href="/admin/reports"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
                >
                  <span>View all incident reports</span>
                  <ArrowUpRight className="size-3" />
                </a>
              </div>

              <div className="mt-3 divide-y divide-brand-line">
                {overview?.recent?.length > 0 ? (
                  overview.recent.slice(0, 7).map((item, index) => {
                    const isReport = item.type === 'Report'
                    const isAnnouncement = item.type === 'Announcement'
                    const targetLink = isReport
                      ? '/admin/reports'
                      : isAnnouncement
                        ? '/admin/announcements'
                        : '/admin/schedules'

                    return (
                      <div
                        key={`${item.type}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs transition-colors hover:bg-brand-paper/60 px-1 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isReport
                                ? 'bg-[#e5e9f6] text-brand-blue'
                                : isAnnouncement
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.type}
                          </span>
                          <div className="min-w-0">
                            <a
                              href={targetLink}
                              className="font-bold text-brand-navy hover:text-brand-blue hover:underline truncate block max-w-[320px] sm:max-w-md lg:max-w-xl"
                            >
                              {item.title}
                            </a>
                            <p className="text-[11px] text-brand-muted truncate mt-0.5">{item.detail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                          <span className="font-mono text-[11px] text-brand-muted">
                            {formatTimeAgo(item.when)}
                          </span>
                          <a
                            href={targetLink}
                            className="text-brand-muted hover:text-brand-navy transition-colors"
                            aria-label={`Open ${item.type}`}
                          >
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-12 text-center text-xs text-brand-muted">No recent operations logged.</p>
                )}
              </div>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
