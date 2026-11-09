import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ClipboardList,
  Flag,
  LocateFixed,
  Minus,
  Navigation,
  Plus,
  RotateCw,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { loadAssignedReports, updateReportStatus } from '../../lib/reports'
import { barangayCenters } from '../../lib/geo'
import {
  fetchDrivingRoute,
  formatDistance,
  formatDuration,
  nearestRouteIndex,
  routeProgress,
} from '../../lib/routing'
import { ReportStatusBadge } from '../../components/resident/reportView'
import { useLanguage } from '../../lib/i18n'
import { icons, STAFF_DEFAULT_GPS } from '../../components/staff/mapData'
import { ResolutionEvidenceInput } from '../../components/staff/evidenceInput'

const OFF_ROUTE_METERS = 120
const REROUTE_COOLDOWN_MS = 15000

const normalizeName = (value) => (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

const barangayCenterByName = Object.fromEntries(
  barangayCenters.map((barangay) => [normalizeName(barangay.name), barangay]),
)

// Captured pin first; otherwise the barangay center, labelled approximate.
function destinationFor(report) {
  if (report.coordinates) {
    return {
      position: [report.coordinates.latitude, report.coordinates.longitude],
      approximate: false,
    }
  }

  const center = barangayCenterByName[normalizeName(report.barangay)]
  return center ? { position: [center.lat, center.lng], approximate: true } : null
}

function ManeuverIcon({ step }) {
  if (!step || step.type === 'arrive') return <Flag className="size-5" />
  if (step.type === 'roundabout' || step.type === 'rotary') return <RotateCw className="size-5" />
  if (step.modifier === 'uturn') return <Undo2 className="size-5" />
  if (step.modifier?.includes('left')) return <ArrowLeft className="size-5" />
  if (step.modifier?.includes('right')) return <ArrowRight className="size-5" />
  return <ArrowUp className="size-5" />
}

function NavEndButton({ onClick, children }) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
    >
      {children ?? t('End')}
    </button>
  )
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
  const { t } = useLanguage()
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('all') // 'all' (active) | 'done'
  const [activeJob, setActiveJob] = useState(null)
  const [staffPosition, setStaffPosition] = useState(STAFF_DEFAULT_GPS)
  const [toastMessage, setToastMessage] = useState('')
  const [targetCoord, setTargetCoord] = useState(null)
  const [targetZoom, setTargetZoom] = useState(13)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evidence, setEvidence] = useState(null) // { jobId, file }
  const [navTarget, setNavTarget] = useState(null)
  const [navRoute, setNavRoute] = useState(null)
  const [navPosition, setNavPosition] = useState(null)
  const [navError, setNavError] = useState('')
  const [requestedJobId] = useState(() => new URLSearchParams(window.location.search).get('job'))

  const mapRef = useRef(null)
  const requestedJobHandled = useRef(false)
  const lastRouteAt = useRef(0)
  const navSession = useRef(0)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    loadAssignedReports()
      .then((rows) => {
        if (!active) return
        setReports(rows)

        // Arriving from "Navigate in app" on the jobs/home pages preselects
        // that job so the crew only has to tap Navigate once.
        if (!requestedJobHandled.current && requestedJobId) {
          const requested = rows.find((row) => row.id === requestedJobId)
          if (requested) {
            requestedJobHandled.current = true
            setActiveJob(requested)
            const destination = destinationFor(requested)
            if (destination) {
              setTargetCoord(destination.position)
              setTargetZoom(15)
            }
          }
        }
      })
      .catch(() => {
        if (active) {
          setReports([])
          setLoadError('We could not load your assigned reports. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey, requestedJobId])

  const visibleJobs = useMemo(() => {
    if (filter === 'done') return reports.filter((r) => r.tone === 'resolved')
    return reports.filter((r) => r.tone !== 'resolved')
  }, [reports, filter])

  const activeCount = useMemo(() => reports.filter((r) => r.tone !== 'resolved').length, [reports])
  const doneCount = useMemo(() => reports.filter((r) => r.tone === 'resolved').length, [reports])

  // The card below the map follows the selected marker; default to the oldest active job.
  const cardJob = activeJob ?? visibleJobs.find((r) => r.tone === 'verified') ?? visibleJobs.find((r) => r.tone === 'pending') ?? null

  // Evidence belongs to one job; ignore it once another job is selected.
  const evidenceFiles =
    evidence && cardJob && evidence.jobId === cardJob.id
      ? (Array.isArray(evidence.files) ? evidence.files : (evidence.file ? [evidence.file] : []))
      : []
  const setEvidenceForJob = (files) =>
    setEvidence(files && cardJob?.id ? { jobId: cardJob.id, files } : null)

  const startNavigation = (job) => {
    const destination = destinationFor(job)
    if (!destination) {
      showToast(t('This report has no pin or known barangay center. Use Google Maps instead.'))
      return
    }
    if (!('geolocation' in navigator)) {
      showToast(t('This device cannot share its location.'))
      return
    }

    setActiveJob(job)
    navSession.current += 1
    setNavTarget({
      job,
      ...destination,
      label: job.barangay ? t('Brgy. {barangay}', { barangay: job.barangay }) : job.location,
    })
    setNavRoute(null)
    setNavPosition(null)
    setNavError('')
    lastRouteAt.current = 0
    setTargetCoord(destination.position)
    setTargetZoom(15)
  }

  const stopNavigation = () => {
    navSession.current += 1
    setNavTarget(null)
    setNavRoute(null)
    setNavPosition(null)
    setNavError('')
    lastRouteAt.current = 0
  }

  const requestRoute = useCallback(async (position) => {
    if (!navTarget || !position) return
    const session = navSession.current
    lastRouteAt.current = Date.now()

    try {
      const nextRoute = await fetchDrivingRoute(position, navTarget.position)
      // Drop a response that arrives after the crew ended or changed navigation.
      if (session !== navSession.current) return
      setNavRoute(nextRoute)
      setNavError('')
      // Only frame the route on the first fetch; reroutes keep the current view.
      if (!navRoute) {
        mapRef.current?.fitBounds(nextRoute.geometry, { padding: [50, 50], maxZoom: 16 })
      }
    } catch {
      if (session === navSession.current) {
        setNavError(t('We could not get driving directions. Check your connection and try again.'))
      }
    }
  }, [navTarget, navRoute, t])

  const retryRoute = () => {
    lastRouteAt.current = 0
    setNavError('')
    if (navPosition) {
      requestRoute(navPosition)
      return
    }

    // The first fix never landed, often a blocked permission; ask again.
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const next = [position.coords.latitude, position.coords.longitude]
        setStaffPosition(next)
        setNavPosition(next)
        requestRoute(next)
      },
      () => setNavError(t('Could not read your GPS. Move to an open area and try again.')),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  // Follow the crew while navigation is active and fetch/refresh the route.
  useEffect(() => {
    if (!navTarget || !('geolocation' in navigator)) return undefined

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = [position.coords.latitude, position.coords.longitude]
        setStaffPosition(next)
        setNavPosition(next)

        // First route once the GPS is known, then reroute after leaving the line.
        if (Date.now() - lastRouteAt.current < REROUTE_COOLDOWN_MS) return
        if (navRoute && nearestRouteIndex(navRoute.geometry, next).distance <= OFF_ROUTE_METERS) return
        requestRoute(next)
      },
      (error) => {
        setNavError(
          error.code === error.PERMISSION_DENIED
            ? t('Location access is blocked. Allow it in your browser settings to navigate.')
            : t('Could not read your GPS. Move to an open area and try again.'),
        )
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [navTarget, navRoute, requestRoute, t])

  const navProgress = useMemo(
    () => (navTarget && navRoute && navPosition ? routeProgress(navRoute, navPosition) : null),
    [navTarget, navRoute, navPosition],
  )

  // Real GPS Geolocation tracking
  const handleLocateStaff = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude]
          setStaffPosition(coords)
          setTargetCoord(coords)
          setTargetZoom(15)
          showToast(t('Updated live GPS coordinates'))
        },
        () => showToast(t('Could not access GPS — check location permission.')),
        { enableHighAccuracy: true, timeout: 5000 },
      )
    } else {
      showToast(t('Live GPS is not available on this device.'))
    }
  }

  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()

  const handleMarkResolved = async () => {
    if (isSubmitting || !cardJob || cardJob.tone === 'resolved') return
    setIsSubmitting(true)

    try {
      // Keep the job on this account (the RLS policy requires it anyway).
      // Attach photo/video proof of the fix when the crew chose one.
      await updateReportStatus(
        cardJob.id,
        'resolved',
        cardJob.assignedStaffId,
        evidenceFiles.map((file) => ({ file, label: 'Resolution evidence', type: file.type })),
      )
      setActiveJob(null)
      stopNavigation()
      reload()
      showToast(t('Marked as resolved. Great work!'))
    } catch {
      showToast(t('We could not update this report. Check your connection and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const streetTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const pinnedJobs = visibleJobs.filter((report) => report.coordinates)
  const unpinnedCount = visibleJobs.length - pinnedJobs.length
  const destination = (report) =>
    report.coordinates
      ? `${report.coordinates.latitude},${report.coordinates.longitude}`
      : `Valencia City Bukidnon Brgy. ${report.barangay}`

  const focusPosition =
    navTarget?.position ??
    (activeJob?.coordinates
      ? [activeJob.coordinates.latitude, activeJob.coordinates.longitude]
      : null)

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#e5e9f6] text-brand-navy select-none">
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
          center={STAFF_DEFAULT_GPS}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url={streetTiles} attribution="&copy; OpenStreetMap" />

          <MapController targetCoord={targetCoord} zoom={targetZoom} />

          {/* In-app driving route */}
          {navRoute && (
            <>
              <Polyline
                positions={navRoute.geometry}
                pathOptions={{ color: '#ffffff', weight: 10, opacity: 0.9 }}
              />
              <Polyline
                positions={navRoute.geometry}
                pathOptions={{ color: '#24449a', weight: 5, opacity: 0.95 }}
              />
            </>
          )}

          {/* Staff GPS Position */}
          <Marker position={staffPosition} icon={icons.staffGps} />

          {/* Destination for reports without a pin (barangay center) */}
          {navTarget?.approximate && <Marker position={navTarget.position} icon={icons.jobMarker} />}

          {/* Assigned job markers (reports with a captured GPS pin) */}
          {!isLoading && !loadError && pinnedJobs.map((report) => {
            const coords = [report.coordinates.latitude, report.coordinates.longitude]
            return (
              <Marker
                key={report.id}
                position={coords}
                icon={report.tone === 'resolved' ? icons.doneMarker : icons.jobMarker}
                eventHandlers={{
                  click: () => {
                    if (navTarget) stopNavigation()
                    setActiveJob(report)
                    setTargetCoord(coords)
                    setTargetZoom(15)
                  },
                }}
              />
            )
          })}

          {/* Highlight ring around the selected job */}
          {focusPosition && (
            <Circle
              center={focusPosition}
              radius={navTarget ? 150 : 400}
              pathOptions={{
                fillColor: '#ffd500',
                fillOpacity: 0.25,
                color: '#f0b400',
                weight: 2,
                dashArray: '5, 5',
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* TOP FLOATING BAR: live directions while navigating, otherwise job + filters */}
      {navTarget ? (
        <header className="absolute top-0 inset-x-0 z-[500] p-3 sm:p-4 pointer-events-none">
          <div className="mx-auto max-w-md pointer-events-auto">
            <div className="rounded-2xl border border-brand-navy bg-brand-navy px-4 py-3.5 text-white shadow-[0_8px_25px_rgba(12,26,56,0.3)]">
              {navError && !navRoute ? (
                <>
                  <p className="text-xs font-semibold leading-5 text-brand-line">{navError}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={retryRoute}
                      className="h-9 rounded-xl bg-brand-yellow text-xs font-black text-brand-navy transition-colors hover:bg-[#f5c400]"
                    >
                      {t('Try again')}
                    </button>
                    <button
                      type="button"
                      onClick={stopNavigation}
                      className="h-9 rounded-xl border border-white/20 bg-white/10 text-xs font-bold text-white transition-colors hover:bg-white/20"
                    >
                      End
                    </button>
                  </div>
                </>
              ) : navProgress?.arrived ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
                        <Flag className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black leading-tight">{t('You have arrived')}</p>
                        <p className="truncate text-[11px] font-semibold text-brand-line">{navTarget.label}</p>
                      </div>
                    </div>
                    <NavEndButton onClick={stopNavigation}>{t('Done')}</NavEndButton>
                  </div>
                  <ResolutionEvidenceInput files={evidenceFiles} onChange={setEvidenceForJob} dark disabled={isSubmitting} />
                  {cardJob?.tone !== 'resolved' && (
                    <button
                      type="button"
                      onClick={handleMarkResolved}
                      disabled={isSubmitting}
                      className="mt-3 h-10 w-full rounded-xl bg-brand-yellow text-xs font-black text-brand-navy transition-colors hover:bg-[#f5c400] disabled:opacity-60"
                    >
                      {t('Mark resolved')}
                    </button>
                  )}
                </>
              ) : navProgress ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-yellow text-brand-navy">
                      <ManeuverIcon step={navProgress.step} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black leading-tight">
                        {navProgress.step?.instruction ?? t('Continue to your destination')}
                      </p>
                      {navProgress.toNext > 0 && (
                        <p className="mt-0.5 text-[11px] font-semibold text-brand-line">
                          {t('in {distance}', { distance: formatDistance(navProgress.toNext) })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-2.5">
                    <p className="min-w-0 truncate text-[11px] font-semibold text-brand-line">
                      {t('{distance} · {duration} left', {
                        distance: formatDistance(navProgress.remaining),
                        duration: formatDuration(navProgress.etaSeconds),
                      })}
                      {navTarget.approximate ? ` · ${t('approximate pin')}` : ''}
                    </p>
                    <NavEndButton onClick={stopNavigation} />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-navy">
                      <Navigation className="size-4 animate-pulse" />
                    </span>
                    <p className="text-xs font-semibold">
                      {navPosition ? t('Getting directions…') : t('Finding your location…')}
                    </p>
                  </div>
                  <NavEndButton onClick={stopNavigation} />
                </div>
              )}
            </div>
          </div>
        </header>
      ) : (
        <header className="absolute top-0 inset-x-0 z-[500] p-3 sm:p-4 pointer-events-none">
          <div className="mx-auto max-w-md space-y-2.5 pointer-events-auto">
            {/* Selected Job Header Card */}
            {activeJob && (
              <div className="flex items-center justify-between rounded-2xl bg-brand-navy px-3.5 py-2.5 text-white shadow-[0_8px_25px_rgba(12,26,56,0.3)] border border-brand-navy">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-yellow text-brand-navy">
                    <Navigation className="size-4.5 fill-current rotate-45" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-sm font-black leading-tight text-white truncate">
                      {t('To {place}', {
                        place: activeJob.barangay
                          ? t('Brgy. {barangay}', { barangay: activeJob.barangay })
                          : activeJob.location,
                      })}
                    </h1>
                    <p className="text-[11px] font-semibold text-brand-line truncate">
                      {activeJob.coordinates
                        ? activeJob.coordinates.accuracy
                          ? t('GPS pin · ±{meters} m', { meters: Math.round(activeJob.coordinates.accuracy) })
                          : t('GPS pin captured')
                        : t('{id} · no GPS pin captured', { id: activeJob.id })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveJob(null)
                    showToast(t('Job deselected'))
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {t('End')}
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
                <span>{t('My jobs')} {activeCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter(filter === 'done' ? 'all' : 'done')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                  filter === 'done'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white border border-brand-line text-brand-navy hover:bg-brand-paper'
                }`}
              >
                <Check className="size-3.5" />
                <span>{t('Done')} {doneCount}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* FLOATING MAP NAVIGATION BUTTONS (Right Edge) */}
      <div className="absolute right-4 top-[38%] -translate-y-1/2 z-[500] flex flex-col items-center gap-3">
        {/* Zoom In & Out Pill */}
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line">
          <button
            type="button"
            onClick={handleZoomIn}
            className="grid size-11 place-items-center text-brand-navy hover:bg-brand-paper transition-colors cursor-pointer"
            aria-label={t('Zoom in')}
          >
            <Plus className="size-5" />
          </button>
          <div className="h-px w-full bg-brand-paper" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="grid size-11 place-items-center text-brand-navy hover:bg-brand-paper transition-colors cursor-pointer"
            aria-label={t('Zoom out')}
          >
            <Minus className="size-5" />
          </button>
        </div>

        {/* Locate Staff GPS Button */}
        <button
          type="button"
          onClick={handleLocateStaff}
          className="grid size-11 place-items-center rounded-2xl bg-white text-brand-blue shadow-[0_6px_20px_rgba(23,43,104,0.14)] border border-brand-line hover:bg-brand-paper cursor-pointer"
          aria-label={t('My GPS location')}
        >
          <LocateFixed className="size-5" />
        </button>
      </div>

      {/* BOTTOM FLOATING CARD: Current Work Order Summary */}
      {!isLoading && !loadError && !navTarget && cardJob && (
        <aside
          aria-label={t('Job navigation summary')}
          className="absolute bottom-[92px] sm:bottom-[100px] inset-x-0 z-[500] px-3 sm:px-4 pointer-events-none"
        >
          <div className="mx-auto w-full max-w-md pointer-events-auto">
            <div className="rounded-3xl border border-brand-line bg-white p-4 sm:p-5 shadow-[0_8px_30px_rgba(23,43,104,0.16)] transition-all">
              {/* Top Sheet Drag Handle */}
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

              {/* Header: Title + Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-brand-navy leading-snug">
                  {cardJob.outageType}
                </h2>
                <ReportStatusBadge tone={cardJob.tone} status={cardJob.status} />
              </div>

              {/* Subtitle / Work Order info */}
              <p className="mt-1 text-xs text-brand-muted leading-relaxed">
                {cardJob.id} · {cardJob.barangay ? t('Brgy. {barangay}', { barangay: cardJob.barangay }) : cardJob.location} ·{' '}
                {t('Noticed {time}', { time: cardJob.startedTime || cardJob.date })}
              </p>
              {cardJob.tone !== 'resolved' && !cardJob.coordinates && (
                <p className="mt-1.5 text-[11px] font-semibold text-[#9a6500]">
                  {t('This report has no GPS pin — navigation uses the barangay center.')}
                </p>
              )}

              {/* Action Buttons Row */}
              {cardJob.tone !== 'resolved' ? (
                <>
                  <ResolutionEvidenceInput files={evidenceFiles} onChange={setEvidenceForJob} disabled={isSubmitting} />
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => startNavigation(cardJob)}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-brand-blue px-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-navy transition-all cursor-pointer"
                    >
                      <Navigation className="size-4 rotate-45" />
                      <span>{t('Navigate')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkResolved}
                      disabled={isSubmitting}
                      className="flex h-11 items-center justify-center rounded-2xl bg-brand-yellow px-3 text-xs sm:text-sm font-black text-brand-navy shadow-xs hover:bg-brand-yellow active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {t('Mark resolved')}
                    </button>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination(cardJob))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-blue underline underline-offset-4"
                  >
                    {t('Open in Google Maps')}
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                  {t('Resolved — this job needs no further action.')}
                </p>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Loading / error banners over the map */}
      {(isLoading || loadError) && (
        <div className="absolute top-[110px] inset-x-0 z-[500] px-4 pointer-events-none">
          <div className="mx-auto max-w-md rounded-2xl border border-brand-line bg-white p-4 text-center shadow-sm pointer-events-auto">
            {isLoading ? (
              <p className="text-xs font-semibold text-brand-muted">{t('Loading your assigned jobs…')}</p>
            ) : (
              <>
                <p className="text-xs font-bold text-[#b42318]">{t(loadError)}</p>
                <button type="button" onClick={reload} className="mt-1.5 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer">
                  {t('Try again')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* No jobs / no pins hint */}
      {!navTarget && !isLoading && !loadError && visibleJobs.length > 0 && unpinnedCount > 0 && (
        <div className="absolute top-[110px] inset-x-0 z-[500] px-4 pointer-events-none">
          <div className="mx-auto max-w-md rounded-2xl bg-white/95 px-4 py-2.5 text-center text-[11px] font-semibold text-brand-muted shadow-sm border border-brand-line pointer-events-auto">
            {unpinnedCount === 1
              ? t('{count} job has no GPS pin — navigation uses the barangay center.', { count: unpinnedCount })
              : t('{count} jobs have no GPS pin — navigation uses the barangay center.', { count: unpinnedCount })}
          </div>
        </div>
      )}

      {!isLoading && !loadError && reports.length === 0 && (
        <div className="absolute top-[110px] inset-x-0 z-[500] px-4 pointer-events-none">
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-brand-line bg-white p-6 text-center text-xs text-brand-muted shadow-sm pointer-events-auto">
            {t('Nothing assigned to you yet — markers appear here once the administrator assigns jobs.')}
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <PortalMobileNav role="staff" />
    </div>
  )
}
