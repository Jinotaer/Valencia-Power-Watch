import {
  AlertTriangle,
  Check,
  ClipboardList,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'

// Valencia City / Guinuyoran coordinates
const GUINYORAN_SITE = [7.8900, 125.0550]
const POBLACION_HAZARD = [7.9095, 125.0935]
const LUROGAN_JOB = [7.8780, 125.0980]
const STAFF_DEFAULT_GPS = [7.8760, 125.0880]

// Simulated route path from staff GPS to Guinyoran
const navigationRoute = [
  STAFF_DEFAULT_GPS,
  [7.8790, 125.0830],
  [7.8835, 125.0740],
  [7.8870, 125.0640],
  [7.8890, 125.0590],
  GUINYORAN_SITE,
]

// Custom Leaflet Markers
const icons = {
  outageHotspot: L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <div style="width:38px;height:38px;border-radius:50%;background:#ffd500;border:3px solid #172b68;box-shadow:0 4px 12px rgba(23,43,104,.25);display:flex;align-items:center;justify-content:center;">
          <svg style="width:20px;height:20px;fill:#172b68;" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
      </div>
    `,
  }),
  hazardMarker: L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `
      <div style="width:36px;height:36px;border-radius:50%;background:#ffffff;border:2.5px solid #dc2626;box-shadow:0 4px 12px rgba(220,38,38,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg style="width:18px;height:18px;stroke:#dc2626;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;" viewBox="0 0 24 24">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
  }),
  jobMarker: L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="width:34px;height:34px;border-radius:50%;background:#1b3d8f;border:2.5px solid white;box-shadow:0 4px 12px rgba(27,61,143,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg style="width:16px;height:16px;stroke:white;fill:none;stroke-width:2;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
    `,
  }),
  staffGps: L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(27,61,143,0.25);animation:ping 2s cubic-bezier(0,0,.2,1) infinite;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#1b3d8f;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);"></div>
      </div>
    `,
  }),
}

function MapController({ targetCoord, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, zoom || 14, { duration: 1.2 })
    }
  }, [targetCoord, zoom, map])
  return null
}

export default function StaffMap() {
  const [filter, setFilter] = useState('all') // 'all' | 'hazard'
  const [staffPosition, setStaffPosition] = useState(STAFF_DEFAULT_GPS)
  const [isNavigating, setIsNavigating] = useState(true)
  const [hasArrived, setHasArrived] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [targetCoord, setTargetCoord] = useState(null)
  const [targetZoom, setTargetZoom] = useState(13)

  const mapRef = useRef(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Real GPS Geolocation tracking
  const handleLocateStaff = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude]
          setStaffPosition(coords)
          setTargetCoord(coords)
          setTargetZoom(15)
          showToast('Updated live GPS coordinates')
        },
        () => {
          // Fallback to crew simulated location
          setTargetCoord(staffPosition)
          setTargetZoom(14)
          showToast('Centered on Line Crew 2 location')
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      setTargetCoord(staffPosition)
      showToast('Centered on Line Crew 2 location')
    }
  }

  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()

  const handleStartNav = () => {
    setIsNavigating(true)
    setTargetCoord(GUINYORAN_SITE)
    setTargetZoom(14)
    showToast('Navigation started: Heading to Brgy. Guinuyoran')
  }

  const handleArrived = () => {
    setHasArrived(true)
    setIsNavigating(false)
    showToast("Status updated: Line Crew 2 marked 'On site'")
  }

  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#eaf2fb] text-[#172b68] select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-[#172b68] px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-[#ffd500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FULLSCREEN LEAFLET MAP */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <MapContainer
          ref={mapRef}
          center={GUINYORAN_SITE}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url={streetTiles} attribution="&copy; OpenStreetMap" />

          <MapController targetCoord={targetCoord} zoom={targetZoom} />

          {/* Navigation Blue Route Line */}
          {isNavigating && (
            <Polyline
              positions={navigationRoute}
              pathOptions={{
                color: '#1b3d8f',
                weight: 6,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Staff GPS Position */}
          <Marker position={staffPosition} icon={icons.staffGps} />

          {/* Guinyoran Outage Hotspot & Aura */}
          {(filter === 'all' || filter === 'jobs') && (
            <>
              <Circle
                center={GUINYORAN_SITE}
                radius={850}
                pathOptions={{
                  fillColor: '#ffd500',
                  fillOpacity: 0.35,
                  color: '#f0b400',
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
              <Marker
                position={GUINYORAN_SITE}
                icon={icons.outageHotspot}
                eventHandlers={{
                  click: () => {
                    setTargetCoord(GUINYORAN_SITE)
                    showToast('Selected: Brgy. Guinuyoran job site')
                  },
                }}
              />
            </>
          )}

          {/* Poblacion Hazard Marker */}
          {(filter === 'all' || filter === 'hazard') && (
            <Marker
              position={POBLACION_HAZARD}
              icon={icons.hazardMarker}
              eventHandlers={{
                click: () => {
                  setTargetCoord(POBLACION_HAZARD)
                  showToast('Hazard reported: Damaged line near chapel')
                },
              }}
            />
          )}

          {/* Lurogan Job Marker */}
          {(filter === 'all' || filter === 'jobs') && (
            <Marker
              position={LUROGAN_JOB}
              icon={icons.jobMarker}
              eventHandlers={{
                click: () => {
                  setTargetCoord(LUROGAN_JOB)
                  showToast('Job order: Flickering lights in Brgy. Lurogan')
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* TOP FLOATING NAVIGATION BAR & FILTERS */}
      <header className="absolute top-0 inset-x-0 z-[500] p-3 sm:p-4 pointer-events-none">
        <div className="mx-auto max-w-md space-y-2.5 pointer-events-auto">
          {/* Active Navigation Header Card */}
          {isNavigating && (
            <div className="flex items-center justify-between rounded-2xl bg-[#0c1a38] px-3.5 py-2.5 text-white shadow-[0_8px_25px_rgba(12,26,56,0.3)] border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#ffd500] text-[#0c1a38]">
                  <Navigation className="size-4.5 fill-current rotate-45" />
                </span>
                <div>
                  <h1 className="text-sm font-black leading-tight text-white">To Guinyoran</h1>
                  <p className="text-[11px] font-semibold text-[#b0c6e8]">2.4 km · about 8 min</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsNavigating(false)
                  showToast('Navigation ended')
                }}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              >
                End
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#1b3d8f] text-white'
                  : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="size-3.5" />
              <span>My jobs 3</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter(filter === 'hazard' ? 'all' : 'hazard')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                filter === 'hazard'
                  ? 'bg-[#1b3d8f] text-white'
                  : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="size-3.5 text-[#dc2626]" />
              <span>Hazard 1</span>
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING MAP NAVIGATION BUTTONS (Right Edge) */}
      <div className="absolute right-4 top-[38%] -translate-y-1/2 z-[500] flex flex-col items-center gap-3">
        {/* Zoom In & Out Pill */}
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-[#e2eaf4]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="grid size-11 place-items-center text-[#172b68] hover:bg-[#f4f7fb] active:bg-[#e8f0fe] transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            <Plus className="size-5" />
          </button>
          <div className="h-px w-full bg-[#edf2f8]" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="grid size-11 place-items-center text-[#172b68] hover:bg-[#f4f7fb] active:bg-[#e8f0fe] transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            <Minus className="size-5" />
          </button>
        </div>

        {/* Locate Staff GPS Button */}
        <button
          type="button"
          onClick={handleLocateStaff}
          className="grid size-11 place-items-center rounded-2xl bg-white text-[#24449a] shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-[#e2eaf4] hover:bg-[#f4f7fb] active:bg-[#e8f0fe] transition-colors cursor-pointer"
          aria-label="My GPS location"
        >
          <LocateFixed className="size-5" />
        </button>
      </div>

      {/* BOTTOM FLOATING CARD: Current Work Order Summary */}
      <aside
        aria-label="Job navigation summary"
        className="absolute bottom-[92px] sm:bottom-[100px] inset-x-0 z-[500] px-3 sm:px-4 pointer-events-none"
      >
        <div className="mx-auto w-full max-w-md pointer-events-auto">
          <div className="rounded-3xl border border-[#e2eaf4] bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(23,43,104,0.16)] transition-all">
            {/* Top Sheet Drag Handle */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />

            {/* Header: Title + Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-[#172b68] leading-snug">
                Power interruption near Guinyoran
              </h2>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  hasArrived ? 'bg-emerald-50 text-emerald-700' : 'bg-[#dce7ff] text-[#1e40af]'
                }`}
              >
                {hasArrived ? 'On site' : 'In progress'}
              </span>
            </div>

            {/* Subtitle / Work Order info */}
            <p className="mt-1 text-xs text-[#58708a] leading-relaxed">
              WO-2026-0418 · Brgy. Guinuyoran · 3 related reports
            </p>

            {/* Action Buttons Row */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleStartNav}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#1b3d8f] px-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#142e6d] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Navigation className="size-4 rotate-45" />
                <span>Start navigation</span>
              </button>

              <button
                type="button"
                onClick={handleArrived}
                className="flex h-11 items-center justify-center rounded-2xl bg-[#ffd500] px-3 text-xs sm:text-sm font-black text-[#172b68] shadow-xs hover:bg-[#ffdc00] active:scale-[0.98] transition-all cursor-pointer"
              >
                {hasArrived ? "Marked on site" : "I've arrived"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="staff" />
    </div>
  )
}
