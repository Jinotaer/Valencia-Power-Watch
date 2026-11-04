import {
  Bell,
  Calendar,
  Check,
  Clock,
  Layers,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Search,
  Share2,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'

// Valencia City Center Coordinates
const VALENCIA_CENTER = [7.9042, 125.0961]

// Incident data centered on Valencia City
const incidentsData = [
  {
    id: 'inc-1',
    type: 'active',
    name: 'Guinyoran',
    title: 'Power interruption near Guinyoran',
    location: 'Brgy. Guinuyoran',
    time: 'Reported 8:42 AM',
    reportsCount: 3,
    status: 'Verified',
    statusColor: 'bg-[#d9f9e8] text-[#137a48]',
    statusIcon: Check,
    affectedHouseholds: 420,
    eta: 'Today, 11:30 AM',
    cause: 'Fallen acacia branch on secondary line',
    crew: 'Quick Response Team Alpha',
    lat: 7.8900,
    lng: 125.0550,
    radiusMeters: 750,
  },
  {
    id: 'inc-2',
    type: 'active',
    name: 'Purok 3',
    title: 'Transformer trip at Purok 3',
    location: 'Brgy. Poblacion (Purok 3)',
    time: 'Reported 9:15 AM',
    reportsCount: 2,
    status: 'Verified',
    statusColor: 'bg-[#d9f9e8] text-[#137a48]',
    statusIcon: Check,
    affectedHouseholds: 180,
    eta: 'Today, 1:00 PM',
    cause: 'Overload trip during peak demand',
    crew: 'Feeder Patrol 02',
    lat: 7.9150,
    lng: 125.0880,
    radiusMeters: 450,
  },
  {
    id: 'inc-3',
    type: 'scheduled',
    name: 'Lurogan',
    title: 'Scheduled maintenance in Lurogan',
    location: 'Brgy. Lurugan',
    time: 'Tomorrow, 8:00 AM - 12:00 PM',
    reportsCount: 0,
    status: 'Scheduled',
    statusColor: 'bg-[#edf4ff] text-[#24449a]',
    statusIcon: Calendar,
    affectedHouseholds: 650,
    eta: '12:00 PM (Planned)',
    cause: 'Pole relocation and line clearing',
    crew: 'Contractor Unit 4',
    lat: 7.8780,
    lng: 125.0980,
    radiusMeters: 350,
  },
  {
    id: 'inc-4',
    type: 'resolved',
    name: 'Catumbalon',
    title: 'Power restored in Catumbalon',
    location: 'Brgy. Catumbalon',
    time: 'Resolved at 7:30 AM',
    reportsCount: 5,
    status: 'Resolved',
    statusColor: 'bg-slate-100 text-slate-700',
    statusIcon: Check,
    affectedHouseholds: 310,
    eta: 'Service Normal',
    cause: 'Blown fuse replaced',
    crew: 'Line Crew Bravo',
    lat: 7.9305,
    lng: 125.0700,
    radiusMeters: 300,
  },
]

// Custom Leaflet HTML Marker Icons
const icons = {
  activeLarge: L.divIcon({
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
  activeMedium: L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <div style="width:32px;height:32px;border-radius:50%;background:#ffd500;border:2.5px solid #172b68;box-shadow:0 3px 10px rgba(23,43,104,.2);display:flex;align-items:center;justify-content:center;">
          <svg style="width:16px;height:16px;fill:#172b68;" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
      </div>
    `,
  }),
  scheduled: L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="width:34px;height:34px;border-radius:50%;background:#1b3d8f;border:2.5px solid white;box-shadow:0 4px 12px rgba(27,61,143,.35);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg style="width:16px;height:16px;stroke:white;fill:none;stroke-width:2;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
    `,
  }),
  userLocation: L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(36,68,154,0.25);animation:ping 2s cubic-bezier(0,0,.2,1) infinite;"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:#24449a;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>
      </div>
    `,
  }),
}

// Map Controller for Flying to Coordinates
function MapController({ targetCoord, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, zoom || 14, { duration: 1.2 })
    }
  }, [targetCoord, zoom, map])
  return null
}

export default function ResidentMap() {
  const [filter, setFilter] = useState('active') // 'active' | 'scheduled' | 'resolved' | 'all'
  const [selectedIncident, setSelectedIncident] = useState(incidentsData[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [targetCoord, setTargetCoord] = useState(null)
  const [targetZoom, setTargetZoom] = useState(13)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [basemap, setBasemap] = useState('street') // 'street' | 'satellite'

  const mapRef = useRef(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Filter incidents based on pill selector and search
  const visibleIncidents = useMemo(() => {
    return incidentsData.filter((inc) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'active'
          ? inc.type === 'active'
          : filter === 'scheduled'
          ? inc.type === 'scheduled'
          : filter === 'resolved'
          ? inc.type === 'resolved'
          : true

      const matchesSearch =
        searchQuery.trim() === '' ||
        inc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.location.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesFilter && matchesSearch
    })
  }, [filter, searchQuery])

  // Map Controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const handleLocateMe = () => {
    setTargetCoord([7.8900, 125.0550])
    setTargetZoom(14)
    setSelectedIncident(incidentsData[0])
    showToast('Centered on your home area (Brgy. Guinuyoran)')
  }

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident)
    setTargetCoord([incident.lat, incident.lng])
    setTargetZoom(14)
  }

  const handleToggleUpdates = () => {
    const next = !isSubscribed
    setIsSubscribed(next)
    showToast(next ? `Subscribed to alerts for ${selectedIncident.location}` : 'Unsubscribed from updates')
  }

  // Tile Providers
  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#eaf2fb] text-[#172b68] select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-[#172b68] px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-[#ffd500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FULLSCREEN LEAFLET MAP (absolute inset-0) */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <MapContainer
          ref={mapRef}
          center={VALENCIA_CENTER}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer
            url={basemap === 'satellite' ? satelliteTiles : streetTiles}
            attribution="&copy; OpenStreetMap"
          />

          <MapController targetCoord={targetCoord} zoom={targetZoom} />

          {/* User Location Beacon */}
          <Marker position={[7.8920, 125.0580]} icon={icons.userLocation} />

          {/* Outage Circles & Markers */}
          {visibleIncidents.map((inc) => (
            <div key={inc.id}>
              {/* Hotspot Radius Glow Circle */}
              {inc.type === 'active' && (
                <Circle
                  center={[inc.lat, inc.lng]}
                  radius={inc.radiusMeters}
                  pathOptions={{
                    fillColor: '#ffd500',
                    fillOpacity: 0.35,
                    color: '#f0b400',
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                  eventHandlers={{
                    click: () => handleSelectIncident(inc),
                  }}
                />
              )}

              {/* Marker Icon */}
              <Marker
                position={[inc.lat, inc.lng]}
                icon={
                  inc.id === 'inc-1'
                    ? icons.activeLarge
                    : inc.type === 'active'
                    ? icons.activeMedium
                    : icons.scheduled
                }
                eventHandlers={{
                  click: () => handleSelectIncident(inc),
                }}
              />
            </div>
          ))}
        </MapContainer>
      </div>

      {/* TOP FLOATING SEARCH & FILTER BAR (floats above map) */}
      <header className="absolute top-0 inset-x-0 z-[500] p-3 sm:p-4 pointer-events-none">
        <div className="mx-auto max-w-md space-y-2 pointer-events-auto">
          {/* Search Bar */}
          <div className="relative flex items-center rounded-2xl bg-white px-3.5 py-2 shadow-[0_6px_20px_rgba(23,43,104,0.12)] border border-[#e2eaf4]">
            <Search className="size-4.5 text-[#738ba4] shrink-0 mr-2.5" />
            <input
              type="text"
              placeholder="Search barangay or place"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#172b68] placeholder:text-[#8ea4bd] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Layer button on right */}
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="ml-2 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e5edff] text-[#24449a] transition-colors hover:bg-[#d8e6ff] active:scale-95 cursor-pointer"
              title="Map layers"
            >
              <Layers className="size-4.5" />
            </button>

            {/* Layers Dropdown Menu */}
            {showLayerMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Basemap View
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBasemap('street')
                    setShowLayerMenu(false)
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                    basemap === 'street' ? 'bg-[#e7f2ff] text-[#24449a]' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Street Map
                  {basemap === 'street' && <Check className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasemap('satellite')
                    setShowLayerMenu(false)
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                    basemap === 'satellite' ? 'bg-[#e7f2ff] text-[#24449a]' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Satellite View
                  {basemap === 'satellite' && <Check className="size-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Active Outages Pill */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                filter === 'active'
                  ? 'bg-[#1b3d8f] text-white'
                  : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
              }`}
            >
              <Zap className="size-3.5 fill-[#ffdc00] text-[#ffdc00]" />
              <span>Active 2</span>
            </button>

            {/* Scheduled Outages Pill */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'scheduled' ? 'all' : 'scheduled')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                filter === 'scheduled'
                  ? 'bg-[#1b3d8f] text-white'
                  : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
              }`}
            >
              <Calendar className="size-3.5 text-[#24449a]" />
              <span>Scheduled 1</span>
            </button>

            {/* Resolved Incidents Pill */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'resolved' ? 'all' : 'resolved')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                filter === 'resolved'
                  ? 'bg-[#1b3d8f] text-white'
                  : 'bg-white border border-[#d6e2ef] text-[#172b68] hover:bg-slate-50'
              }`}
            >
              <Check className="size-3.5 text-[#137a48]" />
              <span>Resolved</span>
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

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="grid size-11 place-items-center rounded-2xl bg-white text-[#24449a] shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-[#e2eaf4] hover:bg-[#f4f7fb] active:bg-[#e8f0fe] transition-colors cursor-pointer"
          aria-label="Center on my location"
        >
          <LocateFixed className="size-5" />
        </button>
      </div>

      {/* BOTTOM FLOATING CARD: Active Selected Outage Details */}
      {selectedIncident && (
        <aside
          aria-label="Incident summary"
          className="absolute bottom-[92px] sm:bottom-[100px] inset-x-0 z-[500] px-3 sm:px-4 pointer-events-none"
        >
          <div className="mx-auto w-full max-w-md pointer-events-auto">
            <div className="rounded-3xl border border-[#e2eaf4] bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(23,43,104,0.16)] transition-all">
              {/* Top Sheet Drag Handle */}
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />

              {/* Header: Title + Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-[#172b68] leading-snug">
                  {selectedIncident.title}
                </h2>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${selectedIncident.statusColor}`}
                >
                  <selectedIncident.statusIcon className="size-3" />
                  <span>{selectedIncident.status}</span>
                </span>
              </div>

              {/* Subtitle / Meta information */}
              <p className="mt-1 text-xs text-[#58708a] leading-relaxed">
                {selectedIncident.location} · {selectedIncident.time} ·{' '}
                {selectedIncident.reportsCount > 0
                  ? `${selectedIncident.reportsCount} related reports grouped`
                  : 'Utility planned work'}
              </p>

              {/* Action Buttons Row */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Primary View Details Button */}
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(true)}
                  className="flex h-11 items-center justify-center rounded-2xl bg-[#1b3d8f] px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-[#142e6d] active:scale-[0.98] cursor-pointer"
                >
                  View details
                </button>

                {/* Secondary Get Updates Button */}
                <button
                  type="button"
                  onClick={handleToggleUpdates}
                  className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    isSubscribed
                      ? 'border-[#1b3d8f] bg-[#e7effc] text-[#1b3d8f]'
                      : 'border-[#d2dde8] bg-white text-[#172b68] hover:bg-[#f6f9fc]'
                  }`}
                >
                  <Bell className={`size-4 ${isSubscribed ? 'fill-[#1b3d8f]' : ''}`} />
                  <span>{isSubscribed ? 'Alerts on' : 'Get updates'}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* FULL DETAILS MODAL */}
      {showDetailsModal && selectedIncident && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6 max-h-[85vh] overflow-y-auto"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Incident Report
                </span>
                <h3 className="text-base font-extrabold text-[#172b68]">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-4 pt-4 text-xs">
              {/* Location & Status Banner */}
              <div className="flex items-center justify-between rounded-2xl bg-[#f4f7fb] p-3.5 border border-[#e2eaf4]">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#24449a]" />
                  <span className="font-bold text-[#172b68]">{selectedIncident.location}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${selectedIncident.statusColor}`}>
                  {selectedIncident.status}
                </span>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Users className="size-3" /> Affected
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-[#172b68]">
                    {selectedIncident.affectedHouseholds} households
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Clock className="size-3" /> Est. Restoration
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-[#172b68]">{selectedIncident.eta}</p>
                </div>
              </div>

              {/* Cause & Response Team */}
              <div className="space-y-2 rounded-2xl border border-slate-100 p-3.5 bg-white">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Identified Cause</span>
                  <p className="mt-0.5 font-semibold text-slate-700">{selectedIncident.cause}</p>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1">
                    <Wrench className="size-3" /> Assigned Field Response
                  </span>
                  <p className="mt-0.5 font-semibold text-slate-700">{selectedIncident.crew}</p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href)
                    showToast('Share link copied to clipboard')
                  }}
                  className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Share2 className="size-3.5" />
                  <span>Share report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 rounded-xl bg-[#1b3d8f] py-2.5 font-bold text-white shadow-xs hover:bg-[#142e6d]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="resident" />
    </div>
  )
}
