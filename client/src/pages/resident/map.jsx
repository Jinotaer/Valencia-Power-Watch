import { Calendar, Check, Clock, Layers, LocateFixed, MapPin, Minus, Plus, Search, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { VALENCIA_CENTER, barangayCenters } from '../../lib/geo'
import { useLanguage } from '../../lib/i18n'
import { loadPublicOutages } from '../../lib/reports'
import { loadActiveSchedules } from '../../lib/schedules'
import { icons } from '../../components/resident/mapData'

const VALENCIA_FALLBACK = VALENCIA_CENTER

function normalizeName(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
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

export default function ResidentMap() {
  const { t, locale } = useLanguage()
  const [outages, setOutages] = useState([])
  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('active') // 'active' | 'scheduled' | 'resolved' | 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [targetCoord, setTargetCoord] = useState(null)
  const [targetZoom, setTargetZoom] = useState(13)
  const [toastMessage, setToastMessage] = useState('')
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [basemap, setBasemap] = useState('street')
  const [reloadKey, setReloadKey] = useState(0)

  const mapRef = useRef(null)
  const layerMenuRef = useRef(null)

  useEffect(() => {
    if (!showLayerMenu) return

    const handlePointerDown = (event) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target)) {
        setShowLayerMenu(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowLayerMenu(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLayerMenu])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  useEffect(() => {
    let active = true

    Promise.all([loadPublicOutages(), loadActiveSchedules()])
      .then(([nextOutages, nextSchedules]) => {
        if (active) {
          setOutages(nextOutages)
          setSchedules(nextSchedules)
        }
      })
      .catch(() => {
        if (active) {
          setLoadError('We could not load the outage map. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const retryLoad = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  const centerByBarangay = useMemo(() => {
    const entries = Object.fromEntries(barangayCenters.map((barangay) => [normalizeName(barangay.name), barangay]))
    entries.guinyoran = entries.guinoyuran
    entries.lurogan = entries.lurugan
    return entries
  }, [])

  // Public outages (reports) + published schedules, both pinned to their real
  // coordinates or the barangay center when no pin exists.
  const items = useMemo(() => {
    const list = []

    outages.forEach((outage) => {
      const position = outage.coordinates
        ? [outage.coordinates.latitude, outage.coordinates.longitude]
        : centerByBarangay[normalizeName(outage.barangay)]
          ? [centerByBarangay[normalizeName(outage.barangay)].lat, centerByBarangay[normalizeName(outage.barangay)].lng]
          : null
      if (position) {
        list.push({
          kind: 'outage',
          id: outage.id,
          title: t(outage.outageType),
          name: outage.barangay,
          location: outage.barangay ? t('Brgy. {barangay}', { barangay: outage.barangay }) : t('Valencia City'),
          status: t(outage.status),
          tone: outage.tone,
          date: outage.updatedAt ?? outage.createdAt,
          position,
          approximate: !outage.coordinates,
          outage,
        })
      }
    })

    schedules.forEach((schedule) => {
      const center = schedule.barangay ? centerByBarangay[normalizeName(schedule.barangay)] : null
      if (!center) return
      list.push({
        kind: 'schedule',
        id: schedule.id,
        title: schedule.title || t('Scheduled outage'),
        name: schedule.barangay ?? t('Multiple barangays'),
        location: schedule.barangay ? t('Brgy. {barangay}', { barangay: schedule.barangay }) : t('Multiple barangays'),
        status: t('Scheduled'),
        tone: 'scheduled',
        date: schedule.date,
        position: [center.lat, center.lng],
        approximate: true,
        schedule,
      })
    })

    return list
  }, [outages, schedules, centerByBarangay, t])

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      const matchesFilter = filter === 'all'
        ? true
        : filter === 'active'
          ? item.tone === 'pending' || item.tone === 'verified'
          : filter === 'scheduled'
            ? item.kind === 'schedule'
            : item.tone === 'resolved'

      const matchesSearch = !query
        || item.name.toLowerCase().includes(query)
        || item.title.toLowerCase().includes(query)
        || item.location.toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })
  }, [items, filter, searchQuery])

  const selectedItem = selected ?? visibleItems[0] ?? null

  const handleSelectItem = useCallback((item) => {
    setSelected(item)
    setTargetCoord(item.position)
    setTargetZoom(14)
  }, [])

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      showToast(t('Location is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setTargetCoord([coords.latitude, coords.longitude])
        setTargetZoom(15)
        showToast(t('Centered on your location'))
      },
      () => showToast(t('Could not access GPS — check location permission.')),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()

  const activeCount = items.filter((item) => item.tone === 'pending' || item.tone === 'verified').length
  const scheduledCount = items.filter((item) => item.kind === 'schedule').length
  const resolvedCount = items.filter((item) => item.tone === 'resolved').length

  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

  const statusMeta = {
    pending: { label: t('Pending'), badge: 'bg-[#fff1a8] text-[#9a6500]', icon: Clock },
    verified: { label: t('Verified'), badge: 'bg-[#d9f9e8] text-[#137a48]', icon: Check },
    resolved: { label: t('Resolved'), badge: 'bg-[#e5e9f6] text-brand-ink', icon: Check },
    scheduled: { label: t('Scheduled'), badge: 'bg-[#e5e9f6] text-brand-blue', icon: Calendar },
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[e5e9f6] text-brand-navy select-none">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <Check className="size-4 text-brand-yellow" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="absolute inset-0 z-0 h-full w-full">
        <MapContainer
          ref={mapRef}
          center={VALENCIA_FALLBACK}
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

          {visibleItems.map((item) => {
            const isActive = item.tone === 'pending' || item.tone === 'verified'
            const icon = item.kind === 'schedule' || item.tone === 'resolved'
              ? icons.scheduled
              : isActive
                ? icons.activeMedium
                : icons.scheduled
            const radius = item.tone === 'verified' ? 450 : 300
            return (
              <span key={`${item.kind}-${item.id}`}>
                {isActive && (
                  <Circle
                    center={item.position}
                    radius={radius}
                    pathOptions={{ fillColor: '#ffd500', fillOpacity: 0.3, color: '#f0b400', weight: 2, dashArray: '4, 4' }}
                    eventHandlers={{ click: () => handleSelectItem(item) }}
                  />
                )}
                <Marker
                  position={item.position}
                  icon={icon}
                  eventHandlers={{ click: () => handleSelectItem(item) }}
                />
              </span>
            )
          })}
        </MapContainer>
      </div>

      <header className="absolute top-0 inset-x-0 z-[600] p-3 sm:p-4 pointer-events-none">
        <div className="mx-auto max-w-md space-y-2 pointer-events-auto">
          <div ref={layerMenuRef} className="relative flex items-center rounded-2xl bg-white px-3.5 py-2 shadow-[0_6px_20px_rgba(23,43,104,0.12)] border border-brand-line">
            <Search className="size-4.5 text-brand-muted shrink-0 mr-2.5" />
            <input
              type="text"
              placeholder={t('Search barangay or place')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent text-sm font-medium text-brand-navy placeholder:text-brand-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowLayerMenu((open) => !open)}
              className="ml-2 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e5e9f6] text-brand-blue transition-colors hover:bg-[#dce2f4] active:scale-95 cursor-pointer"
              title={t('Map layers')}
              aria-label={t('Map layers')}
              aria-expanded={showLayerMenu}
            >
              <Layers className="size-4.5" />
            </button>
            {showLayerMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-brand-line bg-white p-2 shadow-xl z-50">
                <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('Basemap View')}</span>
                {[
                  ['street', t('Street Map')],
                  ['satellite', t('Satellite View')],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setBasemap(key)
                      setShowLayerMenu(false)
                    }}
                    className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-between cursor-pointer ${basemap === key ? 'bg-[#e5e9f6] text-brand-blue' : 'hover:bg-brand-paper text-brand-ink'}`}
                  >
                    {label}
                    {basemap === key && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${filter === 'active' ? 'bg-brand-blue text-white' : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'}`}
            >
              <Zap className="size-3.5 fill-brand-yellow text-brand-yellow" />
              <span>{t('Active {count}', { count: activeCount })}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter(filter === 'scheduled' ? 'all' : 'scheduled')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${filter === 'scheduled' ? 'bg-brand-blue text-white' : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'}`}
            >
              <Calendar className="size-3.5 text-brand-blue" />
              <span>{t('Scheduled {count}', { count: scheduledCount })}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter(filter === 'resolved' ? 'all' : 'resolved')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap ${filter === 'resolved' ? 'bg-brand-blue text-white' : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'}`}
            >
              <Check className="size-3.5 text-[#137a48]" />
              <span>{t('Resolved {count}', { count: resolvedCount })}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="absolute right-4 top-[38%] -translate-y-1/2 z-[500] flex flex-col items-center gap-3">
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line">
          <button type="button" onClick={handleZoomIn} className="grid size-11 place-items-center text-brand-navy hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer" aria-label={t('Zoom in')}>
            <Plus className="size-5" />
          </button>
          <div className="h-px w-full bg-brand-paper" />
          <button type="button" onClick={handleZoomOut} className="grid size-11 place-items-center text-brand-navy hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer" aria-label={t('Zoom out')}>
            <Minus className="size-5" />
          </button>
        </div>
        <button type="button" onClick={handleLocateMe} className="grid size-11 place-items-center rounded-2xl bg-white text-brand-blue shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line hover:bg-brand-paper active:bg-[e5e9f6] transition-colors cursor-pointer" aria-label={t('Center on my location')}>
          <LocateFixed className="size-5" />
        </button>
      </div>

      {(isLoading || loadError) && (
        <div className="absolute top-[120px] inset-x-0 z-[500] px-4 pointer-events-none">
          <div className="mx-auto max-w-md rounded-2xl border border-brand-line bg-white p-4 text-center shadow-sm pointer-events-auto">
            {isLoading
              ? <p className="text-xs font-semibold text-brand-muted">{t('Loading outage locations…')}</p>
              : <><p className="text-xs font-bold text-[#b42318]">{t(loadError)}</p><button type="button" onClick={retryLoad} className="mt-1.5 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer">{t('Try again')}</button></>}
          </div>
        </div>
      )}

      {!isLoading && !loadError && visibleItems.length === 0 && (
        <div className="absolute top-[120px] inset-x-0 z-[500] px-4 pointer-events-none">
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-brand-line bg-white p-6 text-center text-xs text-brand-muted shadow-sm pointer-events-auto">
            {outages.length === 0 && schedules.length === 0
              ? t('No outage markers yet. Resident reports and published schedules will appear here as they happen.')
              : t('No locations match this filter or search.')}
          </div>
        </div>
      )}

      {!isLoading && !loadError && selectedItem && (
        <aside aria-label={t('Incident summary')} className="absolute bottom-[92px] sm:bottom-[100px] inset-x-0 z-[500] px-3 sm:px-4 pointer-events-none">
          <div className="mx-auto w-full max-w-md pointer-events-auto">
            <div className="rounded-3xl border border-brand-line bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(23,43,104,0.16)]">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-brand-navy leading-snug">{selectedItem.title}</h2>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusMeta[selectedItem.tone]?.badge ?? statusMeta.pending.badge}`}>
                  <MapPin className="size-3" />
                  <span>{selectedItem.status}</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-brand-muted leading-relaxed">
                {selectedItem.location}
                {selectedItem.kind === 'schedule'
                  ? ` · ${selectedItem.schedule.dateLabel} · ${selectedItem.schedule.timeLabel}`
                  : ` · ${new Date(selectedItem.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                {selectedItem.approximate ? ` · ${t('marker at barangay center')}` : ''}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-brand-muted">
                {selectedItem.kind === 'schedule'
                  ? (selectedItem.schedule.description ?? t('Scheduled maintenance published by the utility.'))
                  : t('A resident reported this outage. Status updates appear here as crews respond.')}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                <a href="/community/reports/new" className="flex h-11 items-center justify-center rounded-2xl bg-brand-blue px-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-navy transition-all">
                  {t('Report this outage')}
                </a>
                <a href="/community/notifications" className="flex h-11 items-center justify-center rounded-2xl bg-brand-yellow px-3 text-xs sm:text-sm font-black text-brand-navy shadow-xs hover:bg-brand-yellow active:scale-[0.98] transition-all">
                  {t('Get updates')}
                </a>
              </div>
            </div>
          </div>
        </aside>
      )}

      <PortalMobileNav role="resident" />
    </div>
  )
}
