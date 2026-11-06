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
import 'leaflet/dist/leaflet.css'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { GUINYORAN_SITE, icons, navigationRoute, POBLACION_HAZARD, STAFF_DEFAULT_GPS, LUROGAN_JOB } from './mapData'


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
    <div className="relative h-screen w-full overflow-hidden bg-[e5e9f6] text-brand-navy select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-brand-yellow" />
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
                color: '#24449a',
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
            <div className="flex items-center justify-between rounded-2xl bg-brand-navy px-3.5 py-2.5 text-white shadow-[0_8px_25px_rgba(12,26,56,0.3)] border border-brand-navy">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-navy">
                  <Navigation className="size-4.5 fill-current rotate-45" />
                </span>
                <div>
                  <h1 className="text-sm font-black leading-tight text-white">To Guinyoran</h1>
                  <p className="text-[11px] font-semibold text-brand-line">2.4 km · about 8 min</p>
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
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
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
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
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
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line">
          <button
            type="button"
            onClick={handleZoomIn}
            className="grid size-11 place-items-center text-brand-navy hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            <Plus className="size-5" />
          </button>
          <div className="h-px w-full bg-brand-paper" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="grid size-11 place-items-center text-brand-navy hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            <Minus className="size-5" />
          </button>
        </div>

        {/* Locate Staff GPS Button */}
        <button
          type="button"
          onClick={handleLocateStaff}
          className="grid size-11 place-items-center rounded-2xl bg-white text-brand-blue shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer"
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
          <div className="rounded-3xl border border-brand-line bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(23,43,104,0.16)] transition-all">
            {/* Top Sheet Drag Handle */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

            {/* Header: Title + Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-brand-navy leading-snug">
                Power interruption near Guinyoran
              </h2>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  hasArrived ? 'bg-emerald-50 text-emerald-700' : 'bg-[e5e9f6] text-brand-blue'
                }`}
              >
                {hasArrived ? 'On site' : 'In progress'}
              </span>
            </div>

            {/* Subtitle / Work Order info */}
            <p className="mt-1 text-xs text-brand-muted leading-relaxed">
              WO-2026-0418 · Brgy. Guinuyoran · 3 related reports
            </p>

            {/* Action Buttons Row */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleStartNav}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-brand-blue px-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-navy active:scale-[0.98] transition-all cursor-pointer"
              >
                <Navigation className="size-4 rotate-45" />
                <span>Start navigation</span>
              </button>

              <button
                type="button"
                onClick={handleArrived}
                className="flex h-11 items-center justify-center rounded-2xl bg-brand-yellow px-3 text-xs sm:text-sm font-black text-brand-navy shadow-xs hover:bg-brand-yellow active:scale-[0.98] transition-all cursor-pointer"
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
