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
import 'leaflet/dist/leaflet.css'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { VALENCIA_CENTER, icons, incidentsData } from './mapData'

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
    <div className="relative h-screen w-full overflow-hidden bg-[e5e9f6] text-brand-navy select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-brand-yellow" />
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
          <div className="relative flex items-center rounded-2xl bg-white px-3.5 py-2 shadow-[0_6px_20px_rgba(23,43,104,0.12)] border border-brand-line">
            <Search className="size-4.5 text-brand-muted shrink-0 mr-2.5" />
            <input
              type="text"
              placeholder="Search barangay or place"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-brand-navy placeholder:text-brand-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-brand-muted hover:text-brand-muted"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Layer button on right */}
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="ml-2 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[e5e9f6] text-brand-blue transition-colors hover:bg-[e5e9f6] active:scale-95 cursor-pointer"
              title="Map layers"
            >
              <Layers className="size-4.5" />
            </button>

            {/* Layers Dropdown Menu */}
            {showLayerMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-brand-line bg-white p-2 shadow-xl z-50">
                <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  Basemap View
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBasemap('street')
                    setShowLayerMenu(false)
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                    basemap === 'street' ? 'bg-[e5e9f6] text-brand-blue' : 'hover:bg-brand-paper text-brand-ink'
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
                    basemap === 'satellite' ? 'bg-[e5e9f6] text-brand-blue' : 'hover:bg-brand-paper text-brand-ink'
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
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
              }`}
            >
              <Zap className="size-3.5 fill-brand-yellow text-brand-yellow" />
              <span>Active 2</span>
            </button>

            {/* Scheduled Outages Pill */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'scheduled' ? 'all' : 'scheduled')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                filter === 'scheduled'
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
              }`}
            >
              <Calendar className="size-3.5 text-brand-blue" />
              <span>Scheduled 1</span>
            </button>

            {/* Resolved Incidents Pill */}
            <button
              type="button"
              onClick={() => setFilter(filter === 'resolved' ? 'all' : 'resolved')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${
                filter === 'resolved'
                  ? 'bg-brand-blue text-white'
                  : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
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

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="grid size-11 place-items-center rounded-2xl bg-white text-brand-blue shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer"
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
            <div className="rounded-3xl border border-brand-line bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(23,43,104,0.16)] transition-all">
              {/* Top Sheet Drag Handle */}
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

              {/* Header: Title + Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-brand-navy leading-snug">
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
              <p className="mt-1 text-xs text-brand-muted leading-relaxed">
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
                  className="flex h-11 items-center justify-center rounded-2xl bg-brand-blue px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-brand-navy active:scale-[0.98] cursor-pointer"
                >
                  View details
                </button>

                {/* Secondary Get Updates Button */}
                <button
                  type="button"
                  onClick={handleToggleUpdates}
                  className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    isSubscribed
                      ? 'border-brand-blue bg-[e5e9f6] text-brand-blue'
                      : 'border-brand-line bg-white text-brand-navy hover:bg-brand-paper'
                  }`}
                >
                  <Bell className={`size-4 ${isSubscribed ? 'fill-brand-blue' : ''}`} />
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
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6 max-h-[85vh] overflow-y-auto"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  Incident Report
                </span>
                <h3 className="text-base font-extrabold text-brand-navy">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-4 pt-4 text-xs">
              {/* Location & Status Banner */}
              <div className="flex items-center justify-between rounded-2xl bg-brand-paper p-3.5 border border-brand-line">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-brand-blue" />
                  <span className="font-bold text-brand-navy">{selectedIncident.location}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${selectedIncident.statusColor}`}>
                  {selectedIncident.status}
                </span>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-brand-line bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-brand-muted flex items-center gap-1">
                    <Users className="size-3" /> Affected
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-brand-navy">
                    {selectedIncident.affectedHouseholds} households
                  </p>
                </div>
                <div className="rounded-xl border border-brand-line bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-brand-muted flex items-center gap-1">
                    <Clock className="size-3" /> Est. Restoration
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-brand-navy">{selectedIncident.eta}</p>
                </div>
              </div>

              {/* Cause & Response Team */}
              <div className="space-y-2 rounded-2xl border border-brand-line p-3.5 bg-white">
                <div>
                  <span className="font-bold text-brand-muted uppercase text-[10px]">Identified Cause</span>
                  <p className="mt-0.5 font-semibold text-brand-ink">{selectedIncident.cause}</p>
                </div>
                <div className="border-t border-brand-line pt-2">
                  <span className="font-bold text-brand-muted uppercase text-[10px] flex items-center gap-1">
                    <Wrench className="size-3" /> Assigned Field Response
                  </span>
                  <p className="mt-0.5 font-semibold text-brand-ink">{selectedIncident.crew}</p>
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
                  className="flex items-center justify-center gap-1.5 flex-1 rounded-xl border border-brand-line py-2.5 font-bold text-brand-ink hover:bg-brand-paper"
                >
                  <Share2 className="size-3.5" />
                  <span>Share report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 rounded-xl bg-brand-blue py-2.5 font-bold text-white shadow-xs hover:bg-brand-navy"
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
