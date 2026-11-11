import { Compass, ExternalLink, Focus, Layers } from 'lucide-react'
import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { VALENCIA_CENTER, barangayCenters } from '../../../lib/geo'

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

function MapSizeFix({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    const timer = setTimeout(() => {
      map.invalidateSize()
      if (lat != null && lng != null) {
        map.setView([lat, lng], 15, { animate: false })
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [map, lat, lng])
  return null
}

function ReportPopup({ report, approximate }) {
  const meta = statusMeta[report.tone] ?? statusMeta.pending

  return (
    <div className="min-w-[190px] space-y-1 text-xs text-brand-ink">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-brand-navy">{report.id}</strong>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
          {meta.label}
        </span>
      </div>
      <p className="font-bold text-brand-ink">{report.outageType}</p>
      <p className="text-brand-muted">
        {report.barangay ? `Brgy. ${report.barangay}` : 'Barangay not provided'}
      </p>
      <p className="text-brand-muted">
        Reported by {report.residentName || 'Unknown resident'}
      </p>
      <p className="text-brand-muted">
        {report.pinnedLocation || report.landmark || 'No landmark provided'}
      </p>
      {approximate && (
        <p className="font-semibold text-[#9a6500]">
          No pin captured — plotted at the barangay center.
        </p>
      )}
    </div>
  )
}

export function ReportLocationMap({ report, fill = false }) {
  const mapRef = useRef(null)
  const [basemap, setBasemap] = useState('street')

  const centerByBarangay = useMemo(
    () =>
      Object.fromEntries(
        barangayCenters.map((barangay) => [normalizeName(barangay.name), barangay]),
      ),
    [],
  )

  const { position, approximate } = useMemo(() => {
    if (report.coordinates) {
      return {
        position: [report.coordinates.latitude, report.coordinates.longitude],
        approximate: false,
      }
    }
    const center = centerByBarangay[normalizeName(report.barangay)]
    if (center) {
      return { position: [center.lat, center.lng], approximate: true }
    }
    return { position: null, approximate: false }
  }, [centerByBarangay, report.barangay, report.coordinates])

  const focusPin = useCallback(() => {
    const target = position ?? VALENCIA_CENTER
    mapRef.current?.flyTo(target, position ? 15 : 12, { duration: 0.7 })
  }, [position])

  const resetView = useCallback(() => {
    mapRef.current?.flyTo(VALENCIA_CENTER, 12, { duration: 0.7 })
  }, [])

  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const satelliteTiles =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  const tileUrl = basemap === 'satellite' ? satelliteTiles : streetTiles
  const tileAttribution =
    basemap === 'satellite'
      ? 'Tiles &copy; Esri'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  const googleMapsUrl = position
    ? `https://www.google.com/maps?q=${position[0]},${position[1]}`
    : null

  return (
    <div
      className={
        fill
          ? 'relative h-full w-full overflow-hidden bg-white'
          : 'mt-2.5 overflow-hidden rounded-xl border border-brand-line'
      }
    >
      <MapContainer
        ref={mapRef}
        center={position ?? VALENCIA_CENTER}
        zoom={position ? 15 : 12}
        scrollWheelZoom
        doubleClickZoom
        zoomControl
        attributionControl
        className="h-full w-full"
        style={fill ? { height: '100%', width: '100%' } : { height: '240px', width: '100%' }}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <MapSizeFix lat={position?.[0]} lng={position?.[1]} />

        {position && (
          <Marker
            position={position}
            icon={reportIcons[report.tone] ?? reportIcons.pending}
          >
            <Popup>
              <ReportPopup report={report} approximate={approximate} />
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bottom-left status legend matching AdminMap */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] hidden rounded-xl border border-brand-line bg-white/95 px-3 py-2 shadow-md backdrop-blur sm:block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
          Legend
        </p>
        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
          {STATUS_ORDER.map((status) => (
            <span
              key={status}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-muted"
            >
              <span
                className="size-2 rounded-full"
                style={{ background: statusMeta[status].color }}
              />
              {statusMeta[status].label}
            </span>
          ))}
        </div>
      </div>

      {/* Top-right floating controls matching AdminMap */}
      <div className="absolute right-4 top-4 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={focusPin}
          className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
          title="Focus report pin"
        >
          <Focus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
          title="Reset Valencia view"
        >
          <Compass className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() =>
            setBasemap((current) => (current === 'street' ? 'satellite' : 'street'))
          }
          className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-ink shadow-md transition-colors hover:bg-brand-paper cursor-pointer"
          title={basemap === 'street' ? 'Switch to satellite view' : 'Switch to street view'}
        >
          <Layers className="size-4" aria-hidden="true" />
        </button>
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid size-10 place-items-center rounded-xl border border-brand-line bg-white text-brand-blue shadow-md transition-colors hover:bg-brand-navy hover:text-white"
            title="Open in Google Maps"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}
