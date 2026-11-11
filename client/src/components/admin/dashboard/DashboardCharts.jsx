import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  PieChart as PieIcon,
  Wrench,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../../ui/chart'

const trendChartConfig = {
  reports: {
    label: 'Incident Reports',
    color: '#24449a',
  },
  resolved: {
    label: 'Restored Outages',
    color: '#10b981',
  },
}

const statusChartConfig = {
  pending: {
    label: 'Pending Triage',
    color: '#f59e0b',
  },
  verified: {
    label: 'Verified in Field',
    color: '#24449a',
  },
  resolved: {
    label: 'Resolved',
    color: '#10b981',
  },
  rejected: {
    label: 'Rejected',
    color: '#94a3b8',
  },
}

const hotspotChartConfig = {
  count: {
    label: 'Outage Reports',
    color: '#24449a',
  },
}

const outageTypeLabels = {
  'line-fault': 'Line Fault',
  'transformer-issue': 'Transformer Issue',
  'weather-disturbance': 'Weather Disturbance',
  'power-supply-interruption': 'Supply Interruption',
  'equipment-related': 'Equipment Defect',
  'scheduled-maintenance': 'Maintenance',
  unknown: 'Unknown Cause',
  other: 'Other Issue',
}

export default function DashboardCharts({ overview }) {
  const [timeRange, setTimeRange] = useState('7d')

  const daysCount = timeRange === '30d' ? 30 : timeRange === '14d' ? 14 : 7

  const filteredTrends = useMemo(() => {
    const rawTrends = overview?.dailyTrends || []
    if (rawTrends.length <= daysCount) return rawTrends
    return rawTrends.slice(rawTrends.length - daysCount)
  }, [overview, daysCount])

  const statusData = useMemo(() => {
    if (overview?.statusDistribution?.length) {
      return overview.statusDistribution
    }
    return [
      { status: 'pending', label: 'Pending Triage', count: overview?.pendingReports ?? 0, fill: '#f59e0b' },
      { status: 'verified', label: 'Verified in Field', count: overview?.verifiedReports ?? 0, fill: '#24449a' },
      { status: 'resolved', label: 'Resolved', count: overview?.resolvedReports ?? 0, fill: '#10b981' },
      { status: 'rejected', label: 'Rejected', count: overview?.rejectedReports ?? 0, fill: '#94a3b8' },
    ]
  }, [overview])

  const totalStatusCount = useMemo(() => {
    return statusData.reduce((acc, curr) => acc + curr.count, 0)
  }, [statusData])

  const resolutionRate = useMemo(() => {
    if (!totalStatusCount) return 0
    const resolved = statusData.find((s) => s.status === 'resolved')?.count || 0
    return Math.round((resolved / totalStatusCount) * 100)
  }, [statusData, totalStatusCount])

  const topBarangays = overview?.topBarangays || []

  const topTypes = useMemo(() => {
    if (overview?.topTypes?.length) return overview.topTypes
    if (overview?.byType) {
      return Object.entries(overview.byType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
    return []
  }, [overview])

  const totalTypeCount = useMemo(() => {
    return topTypes.reduce((acc, curr) => acc + curr.count, 0)
  }, [topTypes])

  return (
    <div className="space-y-6">
      {/* Primary Row: Incident Timeline & Root Cause Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Incident Activity vs Restoration Trends (2 Columns) */}
        <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-brand-navy">Outage Activity vs. Restoration Pace</h2>
              </div>
              <p className="mt-0.5 text-xs text-brand-muted">
                Incoming citizen reports tracked against resolved grid reconnections
              </p>
            </div>

            {/* Time range segmented switcher */}
            <div className="flex items-center rounded-xl border border-brand-line/80 bg-brand-paper p-0.5">
              {[
                ['7d', '7D'],
                ['14d', '14D'],
                ['30d', '30D'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTimeRange(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    timeRange === key
                      ? 'bg-white text-brand-navy shadow-xs border border-brand-line/60'
                      : 'text-brand-muted hover:text-brand-navy'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <ChartContainer config={trendChartConfig} className="h-[270px] w-full">
              <AreaChart data={filteredTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendReportsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#24449a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#24449a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trendResolvedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{ fontSize: '11px', fill: '#555b66' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: '11px', fill: '#555b66' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#24449a"
                  strokeWidth={2}
                  fill="url(#trendReportsFill)"
                  activeDot={{ r: 4, fill: '#24449a' }}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#trendResolvedFill)"
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </div>
        </section>

        {/* Primary Root Causes & Equipment Distribution (1 Column) */}
        <section className="flex flex-col justify-between rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-brand-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-brand-blue" />
                  <h2 className="text-sm font-bold text-brand-navy">Incident Root Causes</h2>
                </div>
                <p className="mt-0.5 text-xs text-brand-muted">Distribution by electrical defect type</p>
              </div>
              <span className="rounded-full bg-brand-paper px-2 py-0.5 text-[11px] font-bold text-brand-muted border border-brand-line">
                {totalTypeCount} Logged
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {topTypes.length > 0 ? (
                topTypes.map(({ type, count }) => {
                  const label = outageTypeLabels[type] || type
                  const pct = totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-brand-navy truncate max-w-[170px]">{label}</span>
                        <span className="font-mono text-brand-muted">
                          <strong className="text-brand-ink">{count}</strong>
                          <span className="ml-1 text-[11px]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-paper border border-brand-line/40">
                        <div
                          className="h-full rounded-full bg-brand-blue transition-all"
                          style={{ width: `${Math.max(6, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="py-10 text-center text-xs text-brand-muted">No outage category breakdown recorded.</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-brand-line pt-3">
            <a
              href="/admin/reports"
              className="inline-flex w-full items-center justify-between rounded-xl border border-brand-line bg-brand-paper px-3 py-2 text-xs font-bold text-brand-navy hover:bg-white hover:border-brand-blue transition-all"
            >
              <span>Inspect all categories in Reports</span>
              <ArrowUpRight className="size-3.5 text-brand-muted" />
            </a>
          </div>
        </section>
      </div>

      {/* Secondary Row: Grid Hotspots & Workflow Status Health */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Valencia City Hotspots by Barangay */}
        <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-brand-navy">Grid Hotspots by Barangay</h2>
              </div>
              <p className="mt-0.5 text-xs text-brand-muted">Sectors with highest reported power interruptions</p>
            </div>
            <a
              href="/admin/map"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
            >
              <span>Open GIS Map</span>
              <ArrowUpRight className="size-3" />
            </a>
          </div>

          <div className="mt-4">
            {topBarangays.length > 0 ? (
              <ChartContainer config={hotspotChartConfig} className="h-[210px] w-full">
                <BarChart
                  data={topBarangays}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: '11px', fill: '#555b66' }}
                  />
                  <YAxis
                    dataKey="barangay"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    style={{ fontSize: '11px', fontWeight: 600, fill: '#172b68' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="#24449a"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="py-12 text-center text-xs text-brand-muted">No barangay interruption data logged.</p>
            )}
          </div>
        </section>

        {/* Workflow Status Health */}
        <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="size-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-brand-navy">Resolution Pipeline Health</h2>
              </div>
              <p className="mt-0.5 text-xs text-brand-muted">Current report distribution across triage stages</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="size-3 text-emerald-600" />
              <span>{resolutionRate}% Closed</span>
            </span>
          </div>

          <div className="mt-4 grid items-center gap-4 sm:grid-cols-2">
            {/* Donut Chart */}
            <div className="relative mx-auto size-[180px]">
              <ChartContainer config={statusChartConfig} className="size-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-brand-navy">{totalStatusCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Total Reports</span>
              </div>
            </div>

            {/* Structured Status List */}
            <div className="space-y-2 border-t border-brand-line/60 pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              {statusData.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-xl bg-brand-paper px-3 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="font-semibold text-brand-navy">{item.label}</span>
                  </div>
                  <span className="font-mono font-bold text-brand-ink">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
