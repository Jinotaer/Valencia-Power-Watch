import {
  ArrowRight,
  Compass,
  Flame,
  Layers,
  LocateFixed,
  Maximize2,
  Minimize2,
  Share2,
  Wrench,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import {
  VALENCIA_CENTER,
  activeOutages,
  barangayCenters,
  feederLines,
  icons,
  openReports,
  resolvedIncidents,
  scheduledOutages,
} from './mapData'
import { FlyToControl, LayerToggle } from './mapControls'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'

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
      <SidebarInset className="bg-brand-paper min-h-screen flex flex-col">
        <AdminNavbar title="OPERATIONS" section="Power Outage Map & GIS Hotspots" />

        <main className="flex-1 p-3 sm:p-5 flex flex-col gap-3 overflow-hidden">
          {/* Header Title Bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-brand-muted">
                OPERATIONS
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-brand-ink tracking-tight">
                Power Outage Map & GIS Hotspots
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden flex items-center gap-1.5 rounded-xl border border-brand-line bg-white px-3 py-1.5 text-xs font-bold text-brand-ink shadow-xs"
            >
              <Layers className="size-4" />
              <span>Layers</span>
            </button>
          </div>

          {/* Floating Dark SCADA Telemetry Bar */}
          <div className="flex items-center gap-3.5 overflow-x-auto rounded-xl bg-brand-navy px-4 py-2.5 font-mono text-[11px] tracking-wide text-brand-line shadow-md scrollbar-none border border-brand-navy shrink-0">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]" />
              <span className="text-brand-muted">SCADA GRID:</span>
              <span className="font-extrabold text-emerald-400">NOMINAL 100%</span>
            </span>
            <span className="text-brand-ink">|</span>
            <span className="shrink-0">
              <span className="text-brand-muted">LOAD:</span>{' '}
              <span className="font-extrabold text-brand-blue">68.4 MW</span>
              <span className="text-brand-muted"> / 75.0 MW</span>
            </span>
            <span className="text-brand-ink">|</span>
            <span className="shrink-0">
              <span className="text-brand-muted">FREQ:</span>{' '}
              <span className="font-extrabold text-white">60.01 Hz</span>
            </span>
            <span className="text-brand-ink">|</span>
            <span className="shrink-0">
              <span className="text-brand-muted">FEEDERS:</span>{' '}
              <span className="font-extrabold text-brand-blue">3/4 OK</span>
              <span className="text-brand-muted"> · </span>
              <span className="font-extrabold text-red-400">1 FAULT (FDR-03)</span>
            </span>
            <span className="text-brand-ink">|</span>
            <span className="shrink-0">
              <span className="text-brand-muted">NODES:</span>{' '}
              <span className="font-extrabold text-brand-blue">31/31 BGRYS SYNCED</span>
            </span>
            <span className="text-brand-ink">|</span>
            <span className="shrink-0">
              <span className="text-brand-muted">AI ENGINE:</span>{' '}
              <span className="font-extrabold text-emerald-400">OPTIMAL (99.4%)</span>
            </span>
          </div>

          {/* Map + Sidebar Layout Card */}
          <div
            ref={mapContainerRef}
            className="flex-1 flex flex-col lg:flex-row gap-3 min-h-[550px] relative overflow-hidden"
          >
            {/* Real Leaflet Map Container Card */}
            <div className="flex-1 relative rounded-2xl border border-brand-line/90 bg-white overflow-hidden shadow-xs min-h-[450px]">
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
                        color: idx === 0 ? '#555b66' : idx === 1 ? '#172b68' : '#101114',
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
                          <strong className="text-brand-blue block">{s.id} — Scheduled Outage</strong>
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
                          <strong className="text-brand-ink block">Brgy. {b.name}</strong>
                          <div><strong>Total households:</strong> {b.households.toLocaleString()}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>

              {/* Floating Action Buttons on Map Right Edge (Matching Reference Screenshot) */}
              <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
                {/* 1. Compass / Reset View */}
                <button
                  type="button"
                  onClick={resetView}
                  className="flex size-10 items-center justify-center rounded-xl bg-white border border-brand-line text-brand-ink hover:bg-brand-paper shadow-md transition-all cursor-pointer"
                  title="Reset compass"
                >
                  <Compass className="size-4.5 text-brand-muted" />
                </button>

                {/* 2. Locate My Location */}
                <button
                  type="button"
                  onClick={locateMe}
                  className="flex size-10 items-center justify-center rounded-xl bg-white border border-brand-line text-brand-ink hover:bg-brand-paper shadow-md transition-all cursor-pointer"
                  title="Locate"
                >
                  <LocateFixed className="size-4.5 text-brand-muted" />
                </button>

                {/* 3. Flame / Hotspots (Red) */}
                <button
                  type="button"
                  onClick={() => toggleLayer('activeOutages')}
                  className="flex size-10 items-center justify-center rounded-xl bg-[#dc2626] text-white hover:bg-red-700 shadow-md transition-all cursor-pointer"
                  title="Outage fire report"
                >
                  <Flame className="size-4.5" />
                </button>

                {/* 4. Dispatch / Tools (Yellow/Amber) */}
                <button
                  type="button"
                  onClick={() => window.open('/admin/response', '_self')}
                  className="flex size-10 items-center justify-center rounded-xl bg-[#d97706] text-white hover:bg-amber-700 shadow-md transition-all cursor-pointer"
                  title="Field dispatch"
                >
                  <Wrench className="size-4.5" />
                </button>

                {/* 5. Matrix / Feeder Layer (Blue) */}
                <button
                  type="button"
                  onClick={() => toggleLayer('darkMatrix')}
                  className="flex size-10 items-center justify-center rounded-xl bg-brand-blue text-white hover:bg-brand-navy shadow-md transition-all cursor-pointer"
                  title="Matrix mode"
                >
                  <Share2 className="size-4.5" />
                </button>

                {/* 6. Active Feeders (Bright Red/Yellow) */}
                <button
                  type="button"
                  onClick={() => toggleLayer('feeders')}
                  className="flex size-10 items-center justify-center rounded-xl bg-[#b91c1c] text-white hover:bg-red-800 shadow-md transition-all cursor-pointer"
                  title="13.2kV Feeders"
                >
                  <Zap className="size-4.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Right Operations Sidebar Card */}
            <aside
              className={`w-full lg:w-80 shrink-0 overflow-y-auto rounded-2xl border border-brand-line/90 bg-white p-4 sm:p-5 space-y-5 shadow-xs ${
                showMobileSidebar ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Legend Section */}
              <section>
                <h2 className="text-sm font-extrabold text-brand-ink mb-2.5">Legend</h2>
                <div className="space-y-2">
                  {[
                    { color: '#ef4444', label: 'Active Outage', count: activeOutages.length },
                    { color: '#24449a', label: 'Scheduled Outage', count: scheduledOutages.length },
                    { color: '#f59e0b', label: 'Open Reports & Verification', count: openReports.length },
                    { color: '#22c55e', label: 'Resolved Incident', count: resolvedIncidents.length },
                    { color: '#172b68', label: 'Barangay Centers', count: 31 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs text-brand-muted">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        {item.label}
                      </span>
                      <span className="tabular-nums font-semibold text-brand-muted">{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Outage Density Heatmap Gradient Bar */}
              <section className="border-t border-brand-line pt-4">
                <h2 className="text-sm font-extrabold text-brand-ink mb-2 flex items-center gap-1.5">
                  🔥 Outage Density Heatmap
                </h2>
                <div
                  className="h-2.5 w-full rounded-full shadow-inner"
                  style={{ background: 'linear-gradient(to right, #24449a, #f59e0b, #ef4444)' }}
                />
                <div className="flex justify-between mt-1 text-[10px] text-brand-muted font-semibold uppercase">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Critical Hotspot</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-brand-muted">
                  Current incidents and open unlinked reports only; scheduled and resolved outages are excluded.
                </p>
              </section>

              {/* Map Controls */}
              <section className="border-t border-brand-line pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-brand-ink">Map Controls</h2>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-navy cursor-pointer"
                  >
                    {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    <span>Fullscreen</span>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-muted block mb-1">
                    🎯 Fly to Barangay:
                  </label>
                  <select
                    value={flyTarget?.name || ''}
                    onChange={(e) => {
                      const b = barangayCenters.find((bc) => bc.name === e.target.value)
                      setFlyTarget(b || null)
                    }}
                    className="w-full h-9 rounded-lg border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
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
              <section className="border-t border-brand-line pt-4">
                <h2 className="text-sm font-extrabold text-brand-ink mb-2">Layers & Smart Grid</h2>
                <div className="space-y-0.5">
                  <LayerToggle
                    label="13.2kV Feeders"
                    icon="⚡"
                    checked={layers.feeders}
                    onChange={() => toggleLayer('feeders')}
                    tag="2030"
                    tagColor="bg-brand-navy text-white"
                  />
                  <LayerToggle
                    label="Cyber 2030 Dark Matrix"
                    icon="🌐"
                    checked={layers.darkMatrix}
                    onChange={() => toggleLayer('darkMatrix')}
                    tag="Sci-Fi"
                    tagColor="bg-[#e5e9f6] text-brand-blue"
                  />
                  <LayerToggle
                    label="Outage Density Heatmap"
                    icon="🔥"
                    checked={layers.heatmap}
                    onChange={() => toggleLayer('heatmap')}
                    tag="Current"
                    tagColor="bg-[#fff1a8] text-[#221506]"
                  />
                  <div className="border-t border-brand-line my-1.5" />
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
                  <div className="border-t border-brand-line my-1.5" />
                  <LayerToggle
                    label="Barangay Centers"
                    checked={layers.barangays}
                    onChange={() => toggleLayer('barangays')}
                    count={31}
                  />
                  <LayerToggle
                    label="Roads"
                    checked={layers.roads}
                    onChange={() => toggleLayer('roads')}
                  />
                  <LayerToggle
                    label="Street Map"
                    checked={!layers.satellite}
                    onChange={() => setLayers((prev) => ({ ...prev, satellite: false }))}
                  />
                  <LayerToggle
                    label="Satellite View"
                    checked={layers.satellite}
                    onChange={() => setLayers((prev) => ({ ...prev, satellite: true }))}
                  />
                </div>
              </section>

              {/* Help Information Note */}
              <p className="text-[11px] leading-relaxed text-brand-muted border-t border-brand-line pt-4">
                Pins open individual outage or report details and dispatch actions. Heatmap shows current incidents and open unlinked reports only; scheduled and resolved outages are excluded. Street Map uses labeled roads and places, not 360-degree Street View; Satellite View adds aerial context for field response. Official barangay boundary polygons are not configured; barangay centers are shown instead.
              </p>

              {/* Bottom Quick Link Button */}
              <a
                href="/admin/reports"
                className="flex items-center justify-between rounded-xl border border-brand-line bg-white p-3 text-xs font-bold text-brand-ink hover:text-brand-blue hover:border-brand-blue/40 shadow-xs transition-all cursor-pointer"
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
