import {
  Compass,
  Focus,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'
import { loadAllReports } from '../../lib/reports'
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

function ReportPopup({ report }) {
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

export default function AdminMap() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
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

    loadAllReports()
      .then((rows) => {
        if (active) setReports(rows)
      })
      .catch(() => {
        if (active) {
          setReports([])
          setLoadError('We could not load report locations. Check your connection and try again.')
        }
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
    if (mappedReports.length === 0) return
    mapRef.current?.fitBounds(
      mappedReports.map((report) => report.position),
      { padding: [48, 48], maxZoom: 13 },
    )
  }, [mappedReports])

  const resetView = useCallback(() => {
    mapRef.current?.flyTo(VALENCIA_CENTER, 12, { duration: 0.8 })
    setFlyTarget(null)
  }, [])

  const locateMe = useCallback(() => {
    mapRef.current?.locate({ setView: true, maxZoom: 15 })
  }, [])

  const fitReports = useCallback(() => {
    if (visibleReports.length === 0) {
      resetView()
      return
    }
    mapRef.current?.fitBounds(
      visibleReports.map((report) => report.position),
      { padding: [48, 48], maxZoom: 14 },
    )
  }, [resetView, visibleReports])

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
        <AdminNavbar title="Operations" section="Report location map" />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:overflow-hidden">
          <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-brand-muted">Operations</p>
                <h1 className="mt-0.5 text-xl font-black tracking-tight text-brand-navy sm:text-2xl">Report location map</h1>
                <p className="mt-1 text-xs text-brand-muted">
                  Every resident outage report plotted from its captured pin.
                </p>
              </div>
            </div>

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

                  {visibleReports.map((report) => (
                    <Marker
                      key={report.id}
                      position={report.position}
                      icon={reportIcons[report.tone] ?? reportIcons.pending}
                    >
                      <Popup>
                        <ReportPopup report={report} />
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] hidden rounded-xl border border-brand-line bg-white/95 px-3 py-2 shadow-md backdrop-blur sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Legend</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
                    {STATUS_ORDER.map((status) => (
                      <span key={status} className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-muted">
                        <span className="size-2 rounded-full" style={{ background: statusMeta[status].color }} />
                        {statusMeta[status].label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={fitReports}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper"
                    title="Fit all pins"
                  >
                    <Focus className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={resetView}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper"
                    title="Reset view"
                  >
                    <Compass className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={locateMe}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper"
                    title="My location"
                  >
                    <LocateFixed className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper"
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
                      Loading report locations…
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
                        className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="flex max-h-[520px] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xs lg:max-h-none lg:min-h-0 lg:w-[340px]">
                <div className="shrink-0 border-b border-brand-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold text-brand-ink">Reports on map</h2>
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
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
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
                        className={`rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors ${
                          basemap === option.key ? 'bg-white text-brand-navy shadow-xs' : 'text-brand-muted hover:text-brand-ink'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-brand-muted">
                    <input
                      type="checkbox"
                      checked={showBarangays}
                      onChange={(event) => setShowBarangays(event.target.checked)}
                      className="size-3.5 rounded border-brand-line accent-brand-blue"
                    />
                    Show barangay centers
                  </label>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {visibleReports.map((report) => {
                    const meta = statusMeta[report.tone] ?? statusMeta.pending
                    const isActive = flyTarget?.id === report.id
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
                        className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
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
              </aside>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
