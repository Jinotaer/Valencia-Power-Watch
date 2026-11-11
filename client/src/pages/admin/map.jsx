import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Focus,
  HardHat,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Truck,
} from 'lucide-react'
import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'
import { loadAllReports } from '../../lib/reports'
import { loadTeams } from '../../lib/teams'
import { VALENCIA_CENTER, barangayCenters } from '../../lib/geo'
import { icons } from '../../components/admin/mapData'
import { FlyToControl } from '../../components/admin/mapControls'

const STATUS_ORDER = ['pending', 'verified', 'resolved', 'rejected']

const statusMeta = {
  pending: { label: 'Pending', color: '#d97706', badge: 'bg-[#fff1a8] text-[#9a6500]' },
  verified: { label: 'Verified', color: '#2563eb', badge: 'bg-[#e5e9f6] text-brand-blue' },
  resolved: { label: 'Resolved', color: '#16a34a', badge: 'bg-[#d9f9e8] text-[#137a48]' },
  rejected: { label: 'Rejected', color: '#dc2626', badge: 'bg-red-50 text-[#b42318]' },
}

function normalizeName(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function timeAgo(dateString) {
  if (!dateString) return 'Just now'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString()
}

function makeReportIcon(color) {
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 5px rgba(15,23,42,.35);"></div>`,
  })
}

const reportIcons = Object.fromEntries(
  STATUS_ORDER.map((status) => [status, makeReportIcon(statusMeta[status].color)]),
)

// Field Team Map Marker ("Aha na sila")
function makeTeamIcon(team) {
  const isDispatched = team.status === 'dispatched'
  const isAvailable = team.status === 'available'
  const bg = isDispatched ? '#2563eb' : isAvailable ? '#16a34a' : '#64748b'

  const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`

  const pingHtml = isDispatched
    ? `<span style="position:absolute;inset:-4px;border-radius:9999px;background:#3b82f6;opacity:0.6;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;"></span>`
    : ''

  const safeName = (team.name || 'Team').replace(/"/g, '&quot;')

  return L.divIcon({
    className: 'team-leaflet-marker',
    iconSize: [38, 48],
    iconAnchor: [19, 20],
    popupAnchor: [0, -22],
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="position:relative;width:36px;height:36px;border-radius:50%;background:${bg};border:2.5px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          ${pingHtml}
          ${truckSvg}
        </div>
        <div style="margin-top:3px;background:rgba(15,23,42,0.92);color:#ffffff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;box-shadow:0 2px 5px rgba(0,0,0,0.3);white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis;">
          ${safeName}
        </div>
      </div>
    `,
  })
}

function ReportPopup({ report, teamName }) {
  const meta = statusMeta[report.tone] ?? statusMeta.pending

  return (
    <div className="min-w-[190px] space-y-1 text-xs text-brand-ink">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-brand-navy">{report.id}</strong>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>{meta.label}</span>
      </div>
      <p className="font-bold text-brand-ink">{report.outageType}</p>
      <p className="text-brand-muted">{report.barangay ? `Brgy. ${report.barangay}` : 'Barangay not provided'}</p>
      <p className="text-brand-muted">Reported by {report.residentName || 'Unknown resident'}</p>
      {teamName && (
        <p className="font-semibold text-brand-blue flex items-center gap-1">
          <Truck className="size-3" />
          <span>Assigned: {teamName}</span>
        </p>
      )}
      <p className="text-brand-muted">{report.pinnedLocation || report.landmark || 'No landmark provided'}</p>
      {report.approximate && (
        <p className="font-semibold text-[#9a6500]">
          No pin captured — plotted at the barangay center.
        </p>
      )}
      <a href="/admin/reports" className="inline-block pt-1 font-bold text-brand-blue underline underline-offset-2">
        Review report
      </a>
    </div>
  )
}

function TeamPopup({ team, assignedReports = [] }) {
  const isDispatched = team.status === 'dispatched'
  const isAvailable = team.status === 'available'
  const lastUpdated = team.lastKnownLocation?.updated_at
    ? timeAgo(team.lastKnownLocation.updated_at)
    : 'Unknown'

  return (
    <div className="min-w-[220px] max-w-[280px] space-y-2 p-0.5 text-xs text-brand-ink">
      <div className="flex items-center justify-between gap-2 border-b border-brand-line pb-1.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Field Team</span>
          <h3 className="text-sm font-extrabold text-brand-navy leading-none">{team.name}</h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isDispatched
              ? 'bg-blue-100 text-blue-800'
              : isAvailable
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isDispatched ? 'Dispatched' : isAvailable ? 'Available' : 'Offline'}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        {team.vehiclePlate && (
          <div className="flex items-center justify-between text-brand-muted">
            <span>Vehicle:</span>
            <span className="font-mono font-bold text-brand-navy">{team.vehiclePlate}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-brand-muted">
          <span>Crew Leader:</span>
          <span className="font-semibold text-brand-ink">{team.leaderName || 'Unassigned'}</span>
        </div>
        <div className="flex items-center justify-between text-brand-muted">
          <span>Crew Strength:</span>
          <span className="font-semibold text-brand-ink">{team.memberCount} lineman{team.memberCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center justify-between text-brand-muted">
          <span>Live GPS Ping:</span>
          <span className="font-semibold text-brand-blue">{lastUpdated}</span>
        </div>
      </div>

      {assignedReports.length > 0 && (
        <div className="rounded-lg bg-amber-50/80 p-2 border border-amber-200/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Active Incidents ({assignedReports.length})
          </p>
          <div className="mt-1 space-y-1">
            {assignedReports.slice(0, 2).map((rep) => (
              <a
                key={rep.id}
                href="/admin/reports"
                className="block truncate text-[11px] font-bold text-amber-900 hover:underline"
              >
                {rep.id} · {rep.outageType} ({rep.barangay})
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="pt-1.5 flex items-center justify-between border-t border-brand-line text-[11px] font-bold">
        <a href="/admin/teams" className="text-brand-blue hover:underline">
          Manage Team &rarr;
        </a>
        <a href="/admin/reports" className="text-brand-navy hover:underline">
          Dispatch Job &rarr;
        </a>
      </div>
    </div>
  )
}

export default function AdminMap() {
  const [reports, setReports] = useState([])
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [sidebarTab, setSidebarTab] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('focusTeam')
      ? 'teams'
      : 'reports',
  )
  const [showTeams, setShowTeams] = useState(true)
  const [showReports, setShowReports] = useState(true)
  const [statusFilter, setStatusFilter] = useState(() =>
    Object.fromEntries(STATUS_ORDER.map((status) => [status, true])),
  )
  const [basemap, setBasemap] = useState('street')
  const [showBarangays, setShowBarangays] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    Promise.all([loadAllReports(), loadTeams()])
      .then(([reportRows, teamRows]) => {
        if (!active) return
        setReports(reportRows)
        setTeams(teamRows)

        const focusTeamId = new URLSearchParams(window.location.search).get('focusTeam')
        if (focusTeamId) {
          const targetTeam = teamRows.find((t) => t.id === focusTeamId)
          if (targetTeam?.lastKnownLocation) {
            setFlyTarget({
              id: targetTeam.id,
              lat: targetTeam.lastKnownLocation.latitude,
              lng: targetTeam.lastKnownLocation.longitude,
              zoom: 15,
            })
          }
        }
      })
      .catch(() => {
        if (!active) return
        setReports([])
        setTeams([])
        setLoadError('We could not load map data. Check your connection and try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!isFullscreen) return undefined
    const timer = setTimeout(() => mapRef.current?.invalidateSize(), 150)
    return () => clearTimeout(timer)
  }, [isFullscreen])

  const centerByBarangay = useMemo(
    () => Object.fromEntries(barangayCenters.map((barangay) => [normalizeName(barangay.name), barangay])),
    [],
  )

  // Map teams that have valid coordinates
  const mappedTeams = useMemo(
    () =>
      teams.filter(
        (t) =>
          t.lastKnownLocation &&
          Number.isFinite(t.lastKnownLocation.latitude) &&
          Number.isFinite(t.lastKnownLocation.longitude),
      ),
    [teams],
  )

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t.name])),
    [teams],
  )

  const reportsByTeam = useMemo(() => {
    const map = {}
    reports.forEach((r) => {
      if (r.assignedTeamId) {
        if (!map[r.assignedTeamId]) map[r.assignedTeamId] = []
        map[r.assignedTeamId].push(r)
      }
    })
    return map
  }, [reports])

  // Every report gets a pin: its captured coordinates, or its barangay center when no pin exists.
  const mappedReports = useMemo(
    () =>
      reports.flatMap((report) => {
        if (report.coordinates) {
          return [{
            ...report,
            position: [report.coordinates.latitude, report.coordinates.longitude],
            approximate: false,
          }]
        }

        const center = centerByBarangay[normalizeName(report.barangay)]
        if (!center) return []
        return [{ ...report, position: [center.lat, center.lng], approximate: true }]
      }),
    [centerByBarangay, reports],
  )

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]))
    reports.forEach((report) => {
      if (byStatus[report.tone] !== undefined) byStatus[report.tone] += 1
    })
    return byStatus
  }, [reports])

  const visibleReports = useMemo(
    () => mappedReports.filter((report) => statusFilter[report.tone] !== false),
    [mappedReports, statusFilter],
  )

  const approximateCount = visibleReports.filter((report) => report.approximate).length
  const unmappedCount = reports.length - mappedReports.length

  useEffect(() => {
    if (mappedReports.length === 0 && mappedTeams.length === 0) return
    const points = [
      ...mappedReports.map((report) => report.position),
      ...mappedTeams.map((t) => [t.lastKnownLocation.latitude, t.lastKnownLocation.longitude]),
    ]
    mapRef.current?.fitBounds(points, { padding: [48, 48], maxZoom: 13 })
  }, [mappedReports, mappedTeams])

  const resetView = useCallback(() => {
    mapRef.current?.flyTo(VALENCIA_CENTER, 12, { duration: 0.8 })
    setFlyTarget(null)
  }, [])

  const locateMe = useCallback(() => {
    mapRef.current?.locate({ setView: true, maxZoom: 15 })
  }, [])

  const fitAllPoints = useCallback(() => {
    const points = []
    if (showReports) {
      visibleReports.forEach((r) => points.push(r.position))
    }
    if (showTeams) {
      mappedTeams.forEach((t) =>
        points.push([t.lastKnownLocation.latitude, t.lastKnownLocation.longitude]),
      )
    }

    if (points.length === 0) {
      resetView()
      return
    }
    mapRef.current?.fitBounds(points, { padding: [48, 48], maxZoom: 14 })
  }, [mappedTeams, resetView, showReports, showTeams, visibleReports])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  const tileUrl = basemap === 'satellite' ? satelliteTiles : streetTiles
  const tileAttribution =
    basemap === 'satellite'
      ? 'Tiles &copy; Esri'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/map" />
      <SidebarInset className="flex h-screen flex-col overflow-hidden bg-brand-paper">
        <AdminNavbar title="Operations" section="Report & Team Location Map" />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:overflow-hidden">
          <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
            <PageHeader
              title="Report & Field Team Map"
              description="Real-time incident pins and live field team positions ('Aha na sila')."
            />

            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
              <div
                ref={mapContainerRef}
                className="relative min-h-[420px] flex-1 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xs lg:min-h-0"
              >
                <MapContainer
                  ref={mapRef}
                  center={VALENCIA_CENTER}
                  zoom={12}
                  className="h-full w-full"
                  zoomControl
                  attributionControl
                >
                  <TileLayer url={tileUrl} attribution={tileAttribution} />
                  <FlyToControl target={flyTarget} />

                  {/* Barangay Centers Layer */}
                  {showBarangays &&
                    barangayCenters.map((barangay) => (
                      <Marker key={barangay.name} position={[barangay.lat, barangay.lng]} icon={icons.barangay}>
                        <Popup>
                          <div className="text-xs text-brand-ink">
                            <strong className="block text-brand-navy">Brgy. {barangay.name}</strong>
                            <span className="text-brand-muted">
                              {barangay.households.toLocaleString()} households
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                  {/* Field Team Markers ("Aha na sila") */}
                  {showTeams &&
                    mappedTeams.map((team) => (
                      <Marker
                        key={`team-${team.id}`}
                        position={[team.lastKnownLocation.latitude, team.lastKnownLocation.longitude]}
                        icon={makeTeamIcon(team)}
                      >
                        <Popup>
                          <TeamPopup
                            team={team}
                            assignedReports={reportsByTeam[team.id] || []}
                          />
                        </Popup>
                      </Marker>
                    ))}

                  {/* Incident Report Markers */}
                  {showReports &&
                    visibleReports.map((report) => (
                      <Marker
                        key={`report-${report.id}`}
                        position={report.position}
                        icon={reportIcons[report.tone] ?? reportIcons.pending}
                      >
                        <Popup>
                          <ReportPopup
                            report={report}
                            teamName={teamMap[report.assignedTeamId]}
                          />
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>

                {/* Map Legend */}
                <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] hidden rounded-xl border border-brand-line bg-white/95 px-3 py-2 shadow-md backdrop-blur sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Map Legend</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
                    {STATUS_ORDER.map((status) => (
                      <span key={status} className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-muted">
                        <span className="size-2 rounded-full" style={{ background: statusMeta[status].color }} />
                        {statusMeta[status].label}
                      </span>
                    ))}
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-blue col-span-2 pt-1 border-t border-brand-line">
                      <span className="size-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300" />
                      Field Team (GPS Truck)
                    </span>
                  </div>
                </div>

                {/* Quick Map Controls */}
                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={fitAllPoints}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
                    title="Fit all markers"
                  >
                    <Focus className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={resetView}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
                    title="Reset view"
                  >
                    <Compass className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={locateMe}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
                    title="My location"
                  >
                    <LocateFixed className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="size-4" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 z-[1100] grid place-items-center bg-white/70 backdrop-blur-sm">
                    <p className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-muted shadow-sm">
                      Loading map and live team positions…
                    </p>
                  </div>
                )}

                {!isLoading && loadError && (
                  <div className="absolute inset-0 z-[1100] grid place-items-center bg-white/80 p-6 backdrop-blur-sm">
                    <div className="max-w-sm rounded-xl border border-brand-line bg-white p-4 text-center shadow-sm">
                      <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                      <button
                        type="button"
                        onClick={reload}
                        className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Panel with Tabs: Reports & Field Teams */}
              <aside className="flex max-h-[520px] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xs lg:max-h-none lg:min-h-0 lg:w-[350px]">
                {/* Tab switcher */}
                <div className="grid grid-cols-2 border-b border-brand-line bg-brand-paper/50 p-1.5 gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('reports')}
                    className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                      sidebarTab === 'reports'
                        ? 'bg-white text-brand-navy shadow-xs border border-brand-line'
                        : 'text-brand-muted hover:text-brand-ink'
                    }`}
                  >
                    Reports ({visibleReports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('teams')}
                    className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      sidebarTab === 'teams'
                        ? 'bg-white text-brand-blue shadow-xs border border-brand-line'
                        : 'text-brand-muted hover:text-brand-ink'
                    }`}
                  >
                    <Truck className="size-3.5" />
                    Field Teams ({mappedTeams.length})
                  </button>
                </div>

                {sidebarTab === 'reports' ? (
                  <>
                    <div className="shrink-0 border-b border-brand-line p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-extrabold text-brand-ink">Incident Reports</h2>
                        <span className="rounded-full bg-[#e5e9f6] px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand-blue">
                          {visibleReports.length}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {STATUS_ORDER.map((status) => {
                          const isOn = statusFilter[status] !== false
                          return (
                            <button
                              key={status}
                              type="button"
                              aria-pressed={isOn}
                              onClick={() => setStatusFilter((current) => ({ ...current, [status]: !current[status] }))}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                                isOn
                                  ? 'border-brand-line bg-white text-brand-ink'
                                  : 'border-transparent bg-brand-paper text-brand-muted opacity-60'
                              }`}
                            >
                              <span className="size-2 rounded-full" style={{ background: statusMeta[status].color }} />
                              {statusMeta[status].label}
                              <span className="tabular-nums text-brand-muted">{counts[status]}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-brand-paper p-1">
                        {[
                          { key: 'street', label: 'Street' },
                          { key: 'satellite', label: 'Satellite' },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setBasemap(option.key)}
                            className={`rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                              basemap === option.key ? 'bg-white text-brand-navy shadow-xs' : 'text-brand-muted hover:text-brand-ink'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-brand-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showTeams}
                            onChange={(event) => setShowTeams(event.target.checked)}
                            className="size-3.5 rounded border-brand-line accent-brand-blue cursor-pointer"
                          />
                          Show field teams ({mappedTeams.length} active GPS)
                        </label>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-brand-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showBarangays}
                            onChange={(event) => setShowBarangays(event.target.checked)}
                            className="size-3.5 rounded border-brand-line accent-brand-blue cursor-pointer"
                          />
                          Show barangay centers
                        </label>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-2">
                      {visibleReports.map((report) => {
                        const meta = statusMeta[report.tone] ?? statusMeta.pending
                        const isActive = flyTarget?.id === report.id
                        const assignedTeam = teamMap[report.assignedTeamId]
                        return (
                          <button
                            key={report.id}
                            type="button"
                            onClick={() =>
                              setFlyTarget({
                                id: report.id,
                                lat: report.position[0],
                                lng: report.position[1],
                              })
                            }
                            className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                              isActive ? 'bg-[#e5e9f6]' : 'hover:bg-brand-paper'
                            }`}
                          >
                            <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-bold text-brand-ink">{report.outageType}</span>
                                <span className="shrink-0 text-[10px] font-semibold text-brand-muted">{report.id}</span>
                              </span>
                              <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-brand-muted">
                                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                {report.barangay ? `Brgy. ${report.barangay}` : 'Barangay not provided'}
                                {report.approximate ? ' · approximate' : ''}
                              </span>
                              {assignedTeam && (
                                <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-brand-blue">
                                  <Truck className="size-2.5 shrink-0" />
                                  {assignedTeam}
                                </span>
                              )}
                              <span className="mt-0.5 block text-[10px] font-medium text-brand-muted">
                                {report.date} · {report.status}
                              </span>
                            </span>
                          </button>
                        )
                      })}

                      {!isLoading && !loadError && visibleReports.length === 0 && (
                        <div className="px-3 py-8 text-center text-xs text-brand-muted">
                          {reports.length === 0
                            ? 'No resident reports yet. New reports appear here as soon as they are submitted.'
                            : 'No reports match the selected status filters.'}
                        </div>
                      )}
                    </div>

                    {(approximateCount > 0 || unmappedCount > 0) && (
                      <div className="shrink-0 border-t border-brand-line p-3 text-[10px] leading-4 text-brand-muted">
                        {approximateCount > 0 && (
                          <p>{approximateCount} report{approximateCount === 1 ? '' : 's'} had no pin and are plotted at the barangay center.</p>
                        )}
                        {unmappedCount > 0 && (
                          <p>{unmappedCount} report{unmappedCount === 1 ? '' : 's'} could not be placed on the map.</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Field Teams Tab ("Aha na sila") */}
                    <div className="shrink-0 border-b border-brand-line p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-extrabold text-brand-ink">Field Teams ("Aha na sila")</h2>
                          <p className="text-[11px] text-brand-muted mt-0.5">
                            {mappedTeams.length} of {teams.length} teams transmitting live GPS
                          </p>
                        </div>
                        <a
                          href="/admin/teams"
                          className="text-[11px] font-bold text-brand-blue hover:underline"
                        >
                          Manage &rarr;
                        </a>
                      </div>

                      <div className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-brand-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showTeams}
                            onChange={(event) => setShowTeams(event.target.checked)}
                            className="size-3.5 rounded border-brand-line accent-brand-blue cursor-pointer"
                          />
                          Show field teams on map
                        </label>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-brand-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showReports}
                            onChange={(event) => setShowReports(event.target.checked)}
                            className="size-3.5 rounded border-brand-line accent-brand-blue cursor-pointer"
                          />
                          Show incident report pins
                        </label>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-2">
                      {teams.map((team) => {
                        const hasGps = Boolean(
                          team.lastKnownLocation &&
                            Number.isFinite(team.lastKnownLocation.latitude) &&
                            Number.isFinite(team.lastKnownLocation.longitude),
                        )
                        const isActive = flyTarget?.id === team.id
                        const isDispatched = team.status === 'dispatched'
                        const isAvailable = team.status === 'available'

                        return (
                          <div
                            key={team.id}
                            className={`rounded-xl border p-3 transition-colors ${
                              isActive
                                ? 'border-brand-blue bg-[#e5e9f6]/60 shadow-xs'
                                : 'border-brand-line bg-white hover:bg-brand-paper/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                                  <Truck className="size-3.5 text-brand-blue" />
                                  {team.name}
                                </h3>
                                {team.vehiclePlate && (
                                  <span className="font-mono text-[10px] text-brand-muted mt-0.5 block">
                                    Plate: {team.vehiclePlate}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isDispatched
                                    ? 'bg-blue-100 text-blue-800'
                                    : isAvailable
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isDispatched ? 'Dispatched' : isAvailable ? 'Available' : 'Offline'}
                              </span>
                            </div>

                            <div className="mt-2 text-[11px] text-brand-muted space-y-0.5">
                              <p className="flex items-center gap-1.5">
                                <HardHat className="size-3 text-amber-600" />
                                <span>Leader: <strong>{team.leaderName || 'None'}</strong> · {team.memberCount} crew</span>
                              </p>
                              {team.activeJobCount > 0 ? (
                                <p className="flex items-center gap-1.5 text-amber-800 font-semibold">
                                  <AlertTriangle className="size-3" />
                                  <span>{team.activeJobCount} active assignment{team.activeJobCount !== 1 ? 's' : ''}</span>
                                </p>
                              ) : (
                                <p className="flex items-center gap-1.5 text-emerald-700">
                                  <CheckCircle2 className="size-3" />
                                  <span>Standby / Ready</span>
                                </p>
                              )}
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-brand-line/60 flex items-center justify-between">
                              {hasGps ? (
                                <>
                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-blue">
                                    <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                                    {timeAgo(team.lastKnownLocation?.updated_at)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowTeams(true)
                                      setFlyTarget({
                                        id: team.id,
                                        lat: team.lastKnownLocation.latitude,
                                        lng: team.lastKnownLocation.longitude,
                                        zoom: 15,
                                      })
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline cursor-pointer"
                                  >
                                    <LocateFixed className="size-3" />
                                    Locate on map
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-brand-muted italic">
                                  No GPS ping yet (waiting for crew app)
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {!isLoading && teams.length === 0 && (
                        <div className="px-3 py-8 text-center text-xs text-brand-muted">
                          No field teams registered yet.{' '}
                          <a href="/admin/teams" className="text-brand-blue underline font-bold">
                            Create a field team
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </aside>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
