import {
  ArrowRight,
  Compass,
  Flame,
  Layers,
  LocateFixed,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'

// Valencia City Center Coordinates
const VALENCIA_CENTER = [7.9042, 125.0961]

// Official 31 Barangays of Valencia City with coordinates
const barangayCenters = [
  { name: 'Poblacion', lat: 7.9095, lng: 125.0935, households: 8420 },
  { name: 'Bagontapay', lat: 7.9210, lng: 125.1150, households: 3100 },
  { name: 'Batangan', lat: 7.8755, lng: 125.0890, households: 2850 },
  { name: 'Catumbalon', lat: 7.9305, lng: 125.0700, households: 2100 },
  { name: 'Colonia', lat: 7.8980, lng: 125.0600, households: 1950 },
  { name: 'Concepcion', lat: 7.9180, lng: 125.1050, households: 1800 },
  { name: 'Dagat-Kidavao', lat: 7.9400, lng: 125.0800, households: 1650 },
  { name: 'Guinoyuran', lat: 7.8900, lng: 125.0550, households: 2900 },
  { name: 'Laligan', lat: 7.9250, lng: 125.1200, households: 2200 },
  { name: 'Lilingayon', lat: 7.8700, lng: 125.0950, households: 2450 },
  { name: 'Lourdes', lat: 7.9150, lng: 125.0880, households: 3600 },
  { name: 'Lumbayao', lat: 7.9200, lng: 125.1100, households: 3100 },
  { name: 'Mailag', lat: 7.9350, lng: 125.0750, households: 2750 },
  { name: 'San Carlos', lat: 7.8950, lng: 125.0650, households: 2300 },
  { name: 'Sugod', lat: 7.9000, lng: 125.0920, households: 3200 },
  { name: 'Tongantongan', lat: 7.9060, lng: 125.0980, households: 2950 },
  { name: 'Bantuanon', lat: 7.8800, lng: 125.0850, households: 1500 },
  { name: 'Barobo', lat: 7.8850, lng: 125.0600, households: 1400 },
  { name: 'Datu Salumay', lat: 7.9380, lng: 125.0680, households: 1200 },
  { name: 'Kahaponan', lat: 7.9300, lng: 125.0900, households: 2400 },
  { name: 'Musuan', lat: 7.8705, lng: 125.0500, households: 1100 },
  { name: 'Lumbo', lat: 7.9120, lng: 125.0800, households: 1800 },
  { name: 'Tugaya', lat: 7.8930, lng: 125.1100, households: 1300 },
  { name: 'Sinayawan', lat: 7.9450, lng: 125.1150, households: 1250 },
  { name: 'Dampas', lat: 7.8680, lng: 125.0750, households: 980 },
  { name: 'San Isidro', lat: 7.9500, lng: 125.1000, households: 1600 },
  { name: 'Vintar', lat: 7.8600, lng: 125.0680, households: 850 },
  { name: 'Mt. Nebo', lat: 7.8550, lng: 125.0800, households: 750 },
  { name: 'Pinatilan', lat: 7.9130, lng: 125.1020, households: 2100 },
  { name: 'Lurugan', lat: 7.8780, lng: 125.0980, households: 1050 },
  { name: 'Mabuhay', lat: 7.9420, lng: 125.0920, households: 1350 },
]

const activeOutages = [
  { id: 'OUT-001', lat: 7.9210, lng: 125.1150, barangay: 'Bagontapay', cause: 'Fallen tree on 13.2kV line', affected: 1250, since: '10:24 AM' },
  { id: 'OUT-002', lat: 7.9150, lng: 125.0880, barangay: 'Lourdes', cause: 'Feeder FDR-03 fault', affected: 980, since: '11:02 AM' },
]

const scheduledOutages = [
  { id: 'SCH-001', lat: 7.8900, lng: 125.0550, barangay: 'Guinoyuran', reason: 'Substation maintenance', date: 'Today, 2:00–5:00 PM' },
]

const openReports = [
  { id: 'RPT-001', lat: 7.8980, lng: 125.0600, barangay: 'Colonia', type: 'Flickering lights', submitted: '9:45 AM' },
  { id: 'RPT-002', lat: 7.9060, lng: 125.0980, barangay: 'Tongantongan', type: 'No power', submitted: '10:15 AM' },
  { id: 'RPT-003', lat: 7.9305, lng: 125.0700, barangay: 'Catumbalon', type: 'Voltage fluctuation', submitted: '10:50 AM' },
]

const resolvedIncidents = [
  { id: 'RES-001', lat: 7.9000, lng: 125.0920, barangay: 'Sugod', resolved: 'Yesterday, 4:30 PM' },
  { id: 'RES-002', lat: 7.9350, lng: 125.0750, barangay: 'Mailag', resolved: 'Yesterday, 6:15 PM' },
]

// Feeder 13.2kV Primary Lines Network
const feederLines = [
  [
    [7.9095, 125.0935],
    [7.9210, 125.1150],
    [7.9350, 125.0750],
    [7.9305, 125.0700],
    [7.9095, 125.0935],
  ],
  [
    [7.9095, 125.0935],
    [7.8900, 125.0550],
    [7.8705, 125.0500],
    [7.8755, 125.0890],
    [7.9095, 125.0935],
  ],
  [
    [7.9095, 125.0935],
    [7.9150, 125.0880],
    [7.8980, 125.0600],
    [7.8850, 125.0600],
    [7.8700, 125.0950],
    [7.9060, 125.0980],
    [7.9095, 125.0935],
  ],
]

function makeDotIcon(color, size = 12) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>`,
  })
}

const icons = {
  activeOutage: makeDotIcon('#ef4444', 14),
  scheduled: makeDotIcon('#3b82f6', 12),
  openReport: makeDotIcon('#f59e0b', 12),
  resolved: makeDotIcon('#22c55e', 10),
  barangay: makeDotIcon('#334155', 8),
}

function FlyToControl({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 14, { duration: 1.2 })
    }
  }, [target, map])
  return null
}

function ScadaBar() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto bg-[#0a1120] px-4 py-2 font-mono text-[11px] tracking-wide text-slate-300 scrollbar-none border-b border-slate-800">
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)]" />
        <span className="text-slate-400">SCADA GRID:</span>
        <span className="font-semibold text-emerald-400">NOMINAL 100%</span>
      </span>
      <span className="text-slate-700">|</span>
      <span className="shrink-0">
        <span className="text-slate-400">LOAD:</span>{' '}
        <span className="font-semibold text-sky-400">68.4 MW</span>
        <span className="text-slate-500"> / 75.0 MW</span>
      </span>
      <span className="text-slate-700">|</span>
      <span className="shrink-0">
        <span className="text-slate-400">FREQ:</span>{' '}
        <span className="font-semibold text-white">60.01 Hz</span>
      </span>
      <span className="text-slate-700">|</span>
      <span className="shrink-0">
        <span className="text-slate-400">FEEDERS:</span>{' '}
        <span className="font-semibold text-sky-400">3/4 OK</span>
        <span className="text-slate-600"> · </span>
        <span className="font-semibold text-red-400">1 FAULT (FDR-03)</span>
      </span>
      <span className="text-slate-700">|</span>
      <span className="shrink-0">
        <span className="text-slate-400">NODES:</span>{' '}
        <span className="font-semibold text-sky-400">31/31 BGRYS SYNCED</span>
      </span>
      <span className="text-slate-700">|</span>
      <span className="shrink-0">
        <span className="text-slate-400">AI ENGINE:</span>{' '}
        <span className="font-semibold text-emerald-400">OPTIMAL (99.4%)</span>
      </span>
    </div>
  )
}

function LayerToggle({ label, checked, onChange, icon, tag, tagColor, count }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-slate-300 text-brand-blue accent-brand-blue cursor-pointer"
      />
      {icon && <span className="text-sm">{icon}</span>}
      <span className="flex-1 text-[13px] text-slate-700 group-hover:text-slate-900 font-medium">
        {label}
      </span>
      {tag && (
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tagColor || 'bg-slate-100 text-slate-500'}`}>
          {tag}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs tabular-nums text-slate-400 font-medium">{count}</span>
      )}
    </label>
  )
}

export default function AdminMap() {
  const [layers, setLayers] = useState({
    feeders: true,
    darkMatrix: false,
    heatmap: true,
    activeOutages: true,
    openReports: true,
    resolved: true,
    scheduled: true,
    barangays: false,
    roads: true,
    satellite: false,
  })
  const [flyTarget, setFlyTarget] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && mapContainerRef.current) {
      mapContainerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const resetView = useCallback(() => {
    mapRef.current?.flyTo(VALENCIA_CENTER, 12, { duration: 0.8 })
    setFlyTarget(null)
  }, [])

  const locateMe = useCallback(() => {
    mapRef.current?.locate({ setView: true, maxZoom: 14 })
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Basemap Tile Providers
  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  const tileUrl = layers.darkMatrix
    ? darkTiles
    : layers.satellite
    ? satelliteTiles
    : streetTiles

  const tileAttribution = layers.satellite
    ? 'Tiles &copy; Esri'
    : layers.darkMatrix
    ? '&copy; CARTO'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/map" />
      <SidebarInset className="bg-[#f8fafc] min-h-screen flex flex-col">
        <AdminNavbar title="Operations" section="Incident Map" />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Page Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">OPERATIONS</p>
              <h1 className="text-lg font-bold text-slate-900">Power Outage Map & GIS Hotspots</h1>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Layers className="size-4" />
              <span>Layers</span>
            </button>
          </div>

          {/* Dark SCADA Telemetry Bar */}
          <ScadaBar />

          {/* Main Map + Right Control Panel Layout */}
          <div ref={mapContainerRef} className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Real Leaflet Map Container */}
            <div className="flex-1 relative min-h-[450px]">
              <MapContainer
                ref={mapRef}
                center={VALENCIA_CENTER}
                zoom={12}
                className="h-full w-full"
                zoomControl={true}
                attributionControl={true}
              >
                <TileLayer url={tileUrl} attribution={tileAttribution} />
                <FlyToControl target={flyTarget} />

                {/* 13.2kV Feeders Polylines */}
                {layers.feeders &&
                  feederLines.map((line, idx) => (
                    <Polyline
                      key={idx}
                      positions={line}
                      pathOptions={{
                        color: idx === 0 ? '#64748b' : idx === 1 ? '#475569' : '#334155',
                        weight: 2.5,
                        dashArray: '6, 6',
                      }}
                    />
                  ))}

                {/* Outage Density Heatmap Auras */}
                {layers.heatmap && (
                  <>
                    <Circle
                      center={[7.9210, 125.1150]}
                      radius={1200}
                      pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.25, stroke: false }}
                    />
                    <Circle
                      center={[7.9150, 125.0880]}
                      radius={900}
                      pathOptions={{ fillColor: '#f59e0b', fillOpacity: 0.28, stroke: false }}
                    />
                  </>
                )}

                {/* Active Outage Markers */}
                {layers.activeOutages &&
                  activeOutages.map((o) => (
                    <Marker key={o.id} position={[o.lat, o.lng]} icon={icons.activeOutage}>
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong className="text-red-600 block">{o.id} — Active Outage</strong>
                          <div><strong>Barangay:</strong> {o.barangay}</div>
                          <div><strong>Cause:</strong> {o.cause}</div>
                          <div><strong>Affected:</strong> {o.affected} households</div>
                          <div><strong>Reported:</strong> {o.since}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Scheduled Outage Markers */}
                {layers.scheduled &&
                  scheduledOutages.map((s) => (
                    <Marker key={s.id} position={[s.lat, s.lng]} icon={icons.scheduled}>
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong className="text-blue-600 block">{s.id} — Scheduled Outage</strong>
                          <div><strong>Barangay:</strong> {s.barangay}</div>
                          <div><strong>Reason:</strong> {s.reason}</div>
                          <div><strong>Window:</strong> {s.date}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Open Reports Markers */}
                {layers.openReports &&
                  openReports.map((r) => (
                    <Marker key={r.id} position={[r.lat, r.lng]} icon={icons.openReport}>
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong className="text-amber-600 block">{r.id} — Open Report</strong>
                          <div><strong>Barangay:</strong> {r.barangay}</div>
                          <div><strong>Type:</strong> {r.type}</div>
                          <div><strong>Submitted:</strong> {r.submitted}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Resolved Incident Markers */}
                {layers.resolved &&
                  resolvedIncidents.map((r) => (
                    <Marker key={r.id} position={[r.lat, r.lng]} icon={icons.resolved}>
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong className="text-emerald-600 block">{r.id} — Resolved</strong>
                          <div><strong>Barangay:</strong> {r.barangay}</div>
                          <div><strong>Resolved:</strong> {r.resolved}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Barangay Center Markers */}
                {layers.barangays &&
                  barangayCenters.map((b) => (
                    <Marker key={b.name} position={[b.lat, b.lng]} icon={icons.barangay}>
                      <Popup>
                        <div className="text-xs space-y-1">
                          <strong className="text-slate-800 block">Brgy. {b.name}</strong>
                          <div><strong>Total households:</strong> {b.households.toLocaleString()}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>

              {/* Floating Action Buttons on Map Edge */}
              <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={resetView}
                  className="flex size-10 items-center justify-center rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 shadow-md transition-colors"
                  title="Reset compass"
                >
                  <Compass className="size-4.5" />
                </button>
                <button
                  type="button"
                  onClick={locateMe}
                  className="flex size-10 items-center justify-center rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 shadow-md transition-colors"
                  title="My location"
                >
                  <LocateFixed className="size-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer('activeOutages')}
                  className="flex size-10 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors"
                  title="Active outages"
                >
                  <Flame className="size-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer('feeders')}
                  className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-colors"
                  title="Feeders network"
                >
                  <Zap className="size-4.5" />
                </button>
              </div>
            </div>

            {/* Right Control Sidebar (Desktop & Slide-over) */}
            <aside
              className={`w-full lg:w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 sm:p-5 space-y-5 ${
                showMobileSidebar ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Legend Section */}
              <section>
                <h2 className="text-sm font-extrabold text-slate-800 mb-2.5">Legend</h2>
                <div className="space-y-2">
                  {[
                    { color: '#ef4444', label: 'Active Outage', count: activeOutages.length },
                    { color: '#3b82f6', label: 'Scheduled Outage', count: scheduledOutages.length },
                    { color: '#f59e0b', label: 'Open Reports & Verification', count: openReports.length },
                    { color: '#22c55e', label: 'Resolved Incident', count: resolvedIncidents.length },
                    { color: '#334155', label: 'Barangay Centers', count: 31 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        {item.label}
                      </span>
                      <span className="tabular-nums font-semibold text-slate-400">{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Outage Density Heatmap Gradient Bar */}
              <section className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
                  🔥 Outage Density Heatmap
                </h2>
                <div
                  className="h-2.5 w-full rounded-full shadow-inner"
                  style={{ background: 'linear-gradient(to right, #3b82f6, #f59e0b, #ef4444)' }}
                />
                <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-semibold uppercase">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Critical Hotspot</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Current incidents and open unlinked reports only; scheduled and resolved outages are excluded.
                </p>
              </section>

              {/* Map Controls */}
              <section className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-800">Map Controls</h2>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-navy"
                  >
                    {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    🎯 Fly to Barangay:
                  </label>
                  <select
                    value={flyTarget?.name || ''}
                    onChange={(e) => {
                      const b = barangayCenters.find((bc) => bc.name === e.target.value)
                      setFlyTarget(b || null)
                    }}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
                  >
                    <option value="">Select a barangay to focus...</option>
                    {barangayCenters.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Layers & Smart Grid Checkboxes */}
              <section className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-extrabold text-slate-800 mb-2">Layers & Smart Grid</h2>
                <div className="space-y-0.5">
                  <LayerToggle
                    label="13.2kV Feeders"
                    icon="⚡"
                    checked={layers.feeders}
                    onChange={() => toggleLayer('feeders')}
                    tag="2030"
                    tagColor="bg-slate-800 text-white"
                  />
                  <LayerToggle
                    label="Cyber 2030 Dark Matrix"
                    icon="🌐"
                    checked={layers.darkMatrix}
                    onChange={() => toggleLayer('darkMatrix')}
                    tag="Sci-Fi"
                    tagColor="bg-violet-100 text-violet-700"
                  />
                  <LayerToggle
                    label="Outage Density Heatmap"
                    icon="🔥"
                    checked={layers.heatmap}
                    onChange={() => toggleLayer('heatmap')}
                    tag="Current"
                    tagColor="bg-emerald-100 text-emerald-700"
                  />
                  <div className="border-t border-slate-100 my-1.5" />
                  <LayerToggle
                    label="Active Outages"
                    checked={layers.activeOutages}
                    onChange={() => toggleLayer('activeOutages')}
                    count={activeOutages.length}
                  />
                  <LayerToggle
                    label="Open Reports & Verification"
                    checked={layers.openReports}
                    onChange={() => toggleLayer('openReports')}
                    count={openReports.length}
                  />
                  <LayerToggle
                    label="Resolved Incidents"
                    checked={layers.resolved}
                    onChange={() => toggleLayer('resolved')}
                    count={resolvedIncidents.length}
                  />
                  <LayerToggle
                    label="Scheduled Outages"
                    checked={layers.scheduled}
                    onChange={() => toggleLayer('scheduled')}
                    count={scheduledOutages.length}
                  />
                  <div className="border-t border-slate-100 my-1.5" />
                  <LayerToggle
                    label="Barangay Centers"
                    checked={layers.barangays}
                    onChange={() => toggleLayer('barangays')}
                    count={31}
                  />
                  <LayerToggle
                    label="Satellite View"
                    checked={layers.satellite}
                    onChange={() => toggleLayer('satellite')}
                  />
                </div>
              </section>

              {/* Help Information Note */}
              <p className="text-[11px] leading-relaxed text-slate-400 border-t border-slate-100 pt-4">
                Pins open individual outage or report details and dispatch actions. Heatmap shows current incidents and open unlinked reports. Satellite View adds aerial context for field response.
              </p>

              {/* Bottom Quick Link */}
              <a
                href="/admin/reports"
                className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-700 hover:text-brand-blue transition-colors"
              >
                <span>Open outage monitoring</span>
                <ArrowRight className="size-4" />
              </a>
            </aside>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
