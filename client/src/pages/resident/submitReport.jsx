import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Info,
  LocateFixed,
  Maximize2,
  Plus,
  Send,
  Video,
  X,
} from 'lucide-react'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { addReport, priorityLabels, reportPriorities } from '../../lib/reports'
import { VALENCIA_CENTER } from '../../components/resident/mapData'
import { SubmitReportSuccess } from '../../components/resident/submitReportSuccess'

const valenciaBarangays = [
  'Guinoyuran',
  'Poblacion',
  'Bagontapay',
  'Bantuanon',
  'Barobo',
  'Batangan',
  'Catumbalon',
  'Colonia',
  'Concepcion',
  'Dagat-Kidavao',
  'Dampas',
  'Datu Salumay',
  'Kahaponan',
  'Laligan',
  'Lilingayon',
  'Lourdes',
  'Lumbayao',
  'Lumbo',
  'Lurugan',
  'Mabuhay',
  'Mailag',
  'Mt. Nebo',
  'Musuan',
  'Pinatilan',
  'San Carlos',
  'San Isidro',
  'Sinayawan',
  'Sugod',
  'Tongantongan',
  'Tugaya',
  'Vintar',
]

// OSM sometimes spells these differently from the barangay list.
const barangayAliases = {
  guinyoran: 'Guinoyuran',
  lurogan: 'Lurugan',
}

const outageTypes = [
  { id: 'line-fault', label: 'Line Fault' },
  { id: 'transformer-issue', label: 'Transformer Issue' },
  { id: 'weather-disturbance', label: 'Weather Disturbance' },
  { id: 'power-supply-interruption', label: 'Power Supply Interruption' },
  { id: 'equipment-related', label: 'Equipment-related' },
  { id: 'scheduled-maintenance', label: 'Scheduled Maintenance' },
  { id: 'unknown', label: 'Unknown' },
  { id: 'other', label: 'Other' },
]

const MAX_VIDEO_BYTES = 25 * 1024 * 1024

function toDateTimeLocalValue(date = new Date()) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function formatNoticedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function normalizeName(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function matchBarangay(address = {}, displayName = '') {
  const candidates = [
    address.suburb,
    address.village,
    address.quarter,
    address.hamlet,
    address.neighbourhood,
    address.town,
    address.city_district,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const normalized = normalizeName(candidate)
    const alias = barangayAliases[normalized]
    if (alias) return alias

    const match = valenciaBarangays.find((barangay) => normalizeName(barangay) === normalized)
    if (match) return match
  }

  const normalizedDisplay = normalizeName(displayName)
  const displayAlias = Object.entries(barangayAliases).find(([alias]) => normalizedDisplay.includes(alias))
  if (displayAlias) return displayAlias[1]

  return valenciaBarangays.find((barangay) => normalizedDisplay.includes(normalizeName(barangay))) ?? null
}

function formatCoordinates(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

const DEFAULT_PIN = { lat: VALENCIA_CENTER[0], lng: VALENCIA_CENTER[1] }

const reportPinIcon = L.divIcon({
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `
    <div style="width:36px;height:36px;border-radius:50%;background:#ffd500;border:3px solid #172b68;box-shadow:0 4px 12px rgba(23,43,104,.3);display:flex;align-items:center;justify-content:center;">
      <div style="width:10px;height:10px;border-radius:50%;background:#172b68;"></div>
    </div>
  `,
})

function MapClickToPin({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function LocationMap({ pin, onPick, mapRef, expanded = false }) {
  return (
    <MapContainer
      ref={mapRef}
      center={[pin.lat, pin.lng]}
      zoom={15}
      zoomControl={expanded}
      scrollWheelZoom={expanded}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapClickToPin onPick={onPick} />
      <Marker
        position={[pin.lat, pin.lng]}
        icon={reportPinIcon}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const { lat, lng } = event.target.getLatLng()
            onPick(lat, lng)
          },
        }}
      />
    </MapContainer>
  )
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Canvas is unavailable'))
          return
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      image.onerror = () => reject(new Error('Image could not be decoded'))
      image.src = reader.result
    }

    reader.onerror = () => reject(new Error('File could not be read'))
    reader.readAsDataURL(file)
  })
}

function locationErrorMessage(error) {
  if (error.code === 1) return 'Location permission was denied. You can still place the pin on the map.'
  if (error.code === 2) return 'Your location is unavailable right now. Place the pin on the map instead.'
  if (error.code === 3) return 'Locating took too long. Try again or place the pin on the map.'
  return 'Your location could not be read. Place the pin on the map instead.'
}

export default function SubmitReport() {
  const [step, setStep] = useState(1) // 1, 2, 3, 4, or 5 (success)

  // Form State
  const [outageType, setOutageType] = useState('')
  const [priority, setPriority] = useState('medium')
  const [noticedAt, setNoticedAt] = useState(() => toDateTimeLocalValue())
  const [description, setDescription] = useState('')

  const [barangay, setBarangay] = useState('Guinoyuran')
  const [landmark, setLandmark] = useState('')
  const [pinnedLocation, setPinnedLocation] = useState('')
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const [pinPosition, setPinPosition] = useState(DEFAULT_PIN)
  const [pinSource, setPinSource] = useState('manual')
  const [coordinates, setCoordinates] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [isLocationError, setIsLocationError] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const mapRef = useRef(null)
  const expandedMapRef = useRef(null)
  const expandMapButtonRef = useRef(null)
  const closeMapButtonRef = useRef(null)
  const geocodeControllerRef = useRef(null)
  const geocodeTimerRef = useRef(null)

  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reportReference, setReportReference] = useState('')

  const stepTitles = {
    1: 'Details',
    2: 'Location',
    3: 'Evidence',
    4: 'Review',
  }

  useEffect(() => {
    if (!isMapExpanded) return

    closeMapButtonRef.current?.focus()
    const expandButton = expandMapButtonRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMapExpanded(false)
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      expandButton?.focus()
    }
  }, [isMapExpanded])

  useEffect(() => () => {
    clearTimeout(geocodeTimerRef.current)
    geocodeControllerRef.current?.abort()
  }, [])

  // Auto-fill the pinned location and barangay from the map pin.
  // shortcut: public Nominatim lookup; cache or self-host the geocoder for high-volume production.
  const resolvePinnedLocation = (lat, lng) => {
    setPinnedLocation(formatCoordinates(lat, lng))
    setIsResolvingLocation(true)
    clearTimeout(geocodeTimerRef.current)
    geocodeControllerRef.current?.abort()

    geocodeTimerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      geocodeControllerRef.current = controller

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Address lookup failed')

        const data = await response.json()
        const shortAddress = (data.display_name ?? '')
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
          .slice(0, 4)
          .join(', ')
        if (shortAddress) setPinnedLocation(shortAddress)

        const matchedBarangay = matchBarangay(data.address, data.display_name)
        if (matchedBarangay) setBarangay(matchedBarangay)
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Offline or lookup failure: the coordinate fallback stays filled in.
        }
      } finally {
        if (!controller.signal.aborted) setIsResolvingLocation(false)
      }
    }, 500)
  }

  // Handle Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setIsLocationError(true)
      setLocationMessage('Location is not available on this device. Place the pin on the map instead.')
      return
    }

    setIsLocating(true)
    setLocationMessage('')
    setIsLocationError(false)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextPin = { lat: coords.latitude, lng: coords.longitude }
        setIsLocating(false)
        setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        })
        setPinPosition(nextPin)
        setPinSource('gps')
        setIsLocationError(false)
        mapRef.current?.flyTo([nextPin.lat, nextPin.lng], 16)
        expandedMapRef.current?.flyTo([nextPin.lat, nextPin.lng], 16)
        resolvePinnedLocation(nextPin.lat, nextPin.lng)
        setLocationMessage(`Location captured to about ${Math.round(coords.accuracy)} m. Adjust the pin if it looks off.`)
      },
      (error) => {
        setIsLocating(false)
        setIsLocationError(true)
        setLocationMessage(locationErrorMessage(error))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const handlePickPin = (lat, lng) => {
    setPinPosition({ lat, lng })
    setCoordinates({ latitude: lat, longitude: lng, accuracy: null })
    setPinSource('manual')
    setLocationMessage('')
    setIsLocationError(false)
    resolvePinnedLocation(lat, lng)
  }

  // Handle evidence upload (photo or video)
  const handleAddEvidence = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || isProcessingPhoto) return
    if (photos.length >= 3) {
      setPhotoError('You can attach up to 3 photos or videos.')
      return
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setPhotoError('Choose a photo or video file.')
      return
    }

    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setPhotoError('Choose a video under 25 MB.')
      return
    }

    setIsProcessingPhoto(true)
    setPhotoError('')

    try {
      if (isImage) {
        const dataUrl = await readPhoto(file)
        setPhotos((current) => (
          current.length >= 3
            ? current
            : [...current, { id: `${Date.now()}-${current.length}`, label: file.name, type: 'image/jpeg', kind: 'image', dataUrl, previewUrl: dataUrl }]
        ))
      } else {
        const previewUrl = URL.createObjectURL(file)
        setPhotos((current) => (
          current.length >= 3
            ? current
            : [...current, { id: `${Date.now()}-${current.length}`, label: file.name, type: file.type, kind: 'video', file, previewUrl }]
        ))
      }
    } catch {
      setPhotoError('That file could not be read. Try a different one.')
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  const handleRemovePhoto = (id) => {
    const photo = photos.find((item) => item.id === id)
    if (photo?.kind === 'video') URL.revokeObjectURL(photo.previewUrl)
    setPhotos((current) => current.filter((item) => item.id !== id))
  }

  // Handle Submission
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!confirmed || isSubmitting || isProcessingPhoto) return
    if (!outageType || !noticedAt || !pinnedLocation) return

    setIsSubmitting(true)
    setSubmitError('')

    const typeLabel = outageTypes.find((type) => type.id === outageType)?.label ?? 'Power interruption'
    const now = new Date()

    try {
      const report = await addReport({
        title: `${typeLabel} in Brgy. ${barangay}`,
        location: `Brgy. ${barangay}`,
        status: 'Pending',
        tone: 'pending',
        progress: 1,
        description: `Reported at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Waiting for verification.`,
        outageType: typeLabel,
        outageTypeId: outageType,
        priority,
        startedTime: formatNoticedAt(noticedAt),
        notes: description.trim(),
        barangay,
        landmark: landmark.trim(),
        pinnedLocation: pinnedLocation.trim(),
        // pin_x/pin_y are legacy columns; the real map position is in `coordinates`.
        pin: { x: 50, y: 50 },
        pinSource,
        coordinates,
        photos,
      })

      setReportReference(report.id)
      setStep(5)
    } catch {
      setSubmitError('We could not save this report. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // SUCCESS SCREEN
  if (step === 5) {
    return (
      <SubmitReportSuccess
        reportReference={reportReference}
        outageType={outageTypes.find((t) => t.id === outageType)?.label}
        barangay={barangay}
      />
    )
  }

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy flex flex-col justify-between">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        onChange={handleAddEvidence}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleAddEvidence}
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        capture="environment"
        onChange={handleAddEvidence}
        className="hidden"
      />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : (window.location.href = '/community'))}
            className="grid size-9 place-items-center rounded-xl text-brand-muted hover:bg-[#e5e9f6] cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-extrabold text-brand-navy">Report an interruption</h1>
            <p className="text-[11px] font-semibold text-brand-muted">
              Step {step} of 4 · {stepTitles[step]}
            </p>
          </div>

          <a
            href="/community"
            className="grid size-9 place-items-center rounded-xl text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </a>
        </div>

        {/* STEPPER PROGRESS BAR */}
        <div className="mx-auto max-w-md pt-3 pb-1 px-3">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-brand-line -z-0" />
            <div
              className="absolute left-4 top-3.5 h-[2px] bg-brand-blue transition-all duration-300 -z-0"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[1, 2, 3, 4].map((s) => {
              const isActive = step === s
              const isDone = step > s

              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-yellow text-brand-navy ring-2 ring-white shadow-xs scale-110 font-extrabold'
                        : isDone
                        ? 'bg-brand-blue text-white'
                        : 'bg-white border-2 border-brand-line text-brand-muted'
                    }`}
                  >
                    {isDone ? <Check className="size-3.5 stroke-[3]" /> : s}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-bold ${
                      isActive ? 'text-brand-navy' : isDone ? 'text-brand-blue' : 'text-brand-muted'
                    }`}
                  >
                    {stepTitles[s]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* FORM CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-md px-4 py-5 flex-1">
        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            {/* Interruption Type */}
            <section>
              <label htmlFor="interruption-type" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Interruption type
              </label>
              <div className="relative">
                <select
                  id="interruption-type"
                  value={outageType}
                  onChange={(e) => setOutageType(e.target.value)}
                  required
                  className="w-full appearance-none rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs font-bold text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>Select a type</option>
                  {outageTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-brand-muted" />
              </div>
              {!outageType && (
                <p className="mt-1.5 text-[11px] text-[#9a6500]">Choose the type that best matches what happened.</p>
              )}
            </section>

            {/* Priority */}
            <section>
              <label htmlFor="report-priority" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Priority
              </label>
              <div className="relative">
                <select
                  id="report-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs font-bold text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none cursor-pointer"
                >
                  {reportPriorities.map((option) => (
                    <option key={option} value={option}>{priorityLabels[option]}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-brand-muted" />
              </div>
              <p className="mt-1.5 text-[11px] text-brand-muted">High = whole house out; Medium = one room or appliance; Low = minor flicker.</p>
            </section>

            {/* Date and Time Noticed */}
            <section>
              <label htmlFor="noticed-at" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Date and time noticed
              </label>
              <input
                id="noticed-at"
                type="datetime-local"
                value={noticedAt}
                max={toDateTimeLocalValue()}
                onChange={(e) => setNoticedAt(e.target.value)}
                required
                className="w-full rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs font-bold text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none"
              />
            </section>

            {/* Description Textarea */}
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                Description (Optional)
              </h2>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details that help the response team"
                className="w-full rounded-2xl border border-brand-line bg-white p-3.5 text-xs text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none"
              />
            </section>

            {/* Safety Caution Box */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[fff1a8] bg-[fff1a8] p-3.5 text-[11px] leading-relaxed text-[#744210]">
              <AlertTriangle className="size-4 shrink-0 text-[#b45309] mt-0.5" />
              <span>
                Fallen wire or sparks? Keep away from it and call your local emergency number.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Real OpenStreetMap location picker */}
            <div className="relative z-0 h-44 w-full overflow-hidden rounded-2xl border border-brand-line bg-[e5e9f6] shadow-inner">
              <LocationMap pin={pinPosition} onPick={handlePickPin} mapRef={mapRef} />

              <span className="pointer-events-none absolute left-2 top-2 z-[1000] rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand-navy shadow-sm backdrop-blur-xs">
                Tap the map or drag the pin
              </span>

              <button
                ref={expandMapButtonRef}
                type="button"
                onClick={() => setIsMapExpanded(true)}
                aria-label="Expand map"
                className="absolute right-2 top-2 z-[1000] grid size-9 place-items-center rounded-xl border border-brand-line bg-white/95 text-brand-blue shadow-sm backdrop-blur-xs transition-colors hover:bg-white cursor-pointer"
              >
                <Maximize2 className="size-4" />
              </button>
            </div>

            {/* Use My Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-brand-line bg-white text-xs font-bold text-brand-blue shadow-xs hover:bg-brand-paper active:scale-[0.99] transition-all cursor-pointer disabled:cursor-wait disabled:opacity-70"
            >
              <LocateFixed className={`size-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use my current location'}</span>
            </button>

            {locationMessage && (
              <p className={`text-[11px] leading-relaxed ${isLocationError ? 'text-[#9a6500]' : 'text-[#137a48]'}`}>{locationMessage}</p>
            )}

            {/* Pinned Location */}
            <section>
              <label htmlFor="pinned-location" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Pinned location
              </label>
              <input
                id="pinned-location"
                type="text"
                value={pinnedLocation}
                onChange={(e) => setPinnedLocation(e.target.value)}
                placeholder="Tap the map to fill this"
                required
                className="w-full rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs text-brand-navy shadow-xs placeholder:text-brand-muted focus:border-brand-blue focus:outline-none font-medium"
              />
              {isResolvingLocation && (
                <p className="mt-1.5 text-[11px] text-brand-muted">Finding the address…</p>
              )}
            </section>

            {/* Barangay Dropdown */}
            <section>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Barangay
              </label>
              <div className="relative">
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  required
                  className="w-full appearance-none rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs font-bold text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none cursor-pointer"
                >
                  {valenciaBarangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-brand-muted" />
              </div>
              <p className="mt-1.5 text-[11px] text-brand-muted">Auto-filled from the pin when it can be matched.</p>
            </section>

            {/* Street or Landmark Input */}
            <section>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Street or landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g., near the chapel, Purok 3"
                className="w-full rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs text-brand-navy shadow-xs placeholder:text-brand-muted focus:border-brand-blue focus:outline-none font-medium"
              />
            </section>

            {/* GPS Accuracy Notice */}
            <div className="flex items-start gap-1.5 text-[11px] text-brand-muted leading-relaxed">
              <Info className="size-3.5 shrink-0 text-brand-muted mt-0.5" />
              <span>
                The pin is approximate. Drag it or tap the map to match the reported spot.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs text-brand-muted leading-relaxed">
              Photos or a short video help the team verify your report faster. This step is optional.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingPhoto || photos.length >= 3}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-line bg-white p-5 text-center transition-all hover:bg-brand-paper active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Camera className="size-5" />
                </div>
                <span className="text-xs font-bold text-brand-blue">Take photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isProcessingPhoto || photos.length >= 3}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-line bg-white p-5 text-center transition-all hover:bg-brand-paper active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-[e5e9f6] text-brand-blue">
                  <Video className="size-5" />
                </div>
                <span className="text-xs font-bold text-brand-blue">Record video</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto || photos.length >= 3}
                className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-line bg-white text-xs font-bold text-brand-blue transition-all hover:bg-brand-paper active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImageIcon className="size-4" />
                Upload photo or video
              </button>
            </div>

            {photoError && <p className="text-[11px] font-semibold text-[#b42318]">{photoError}</p>}

            {/* Added Evidence Grid */}
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                Added ({photos.length} of 3){isProcessingPhoto ? ' · Processing…' : ''}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative flex size-20 items-center justify-center rounded-2xl border border-brand-line bg-[e5e9f6] text-brand-blue shadow-xs"
                  >
                    {photo.kind === 'video' ? (
                      <>
                        <video
                          src={photo.previewUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="size-full rounded-2xl object-cover"
                        />
                        <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-black/25">
                          <Video className="size-5 text-white" />
                        </span>
                      </>
                    ) : (
                      <img
                        src={photo.previewUrl}
                        alt={photo.label || 'Uploaded evidence'}
                        className="size-full rounded-2xl object-cover"
                      />
                    )}

                    {/* Remove Evidence Button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border border-brand-line bg-white text-brand-muted shadow-xs hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${photo.label || 'attachment'}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}

                {/* Add Another Slot */}
                {photos.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="grid size-20 place-items-center rounded-2xl border-2 border-dashed border-brand-line text-brand-blue hover:bg-brand-paper cursor-pointer disabled:cursor-wait disabled:opacity-50"
                    aria-label="Add photo or video"
                  >
                    <Plus className="size-6" />
                  </button>
                )}
              </div>
            </section>

            {/* Privacy Guidance Box */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-brand-line bg-[e5e9f6] p-3.5 text-[11px] leading-relaxed text-brand-blue">
              <Info className="size-4 shrink-0 text-brand-blue mt-0.5" />
              <span>
                Show the transformer, lines or your meter if you can. Avoid faces and license plates.
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Details Summary Card */}
            <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-brand-line pb-2">
                <h3 className="text-sm font-extrabold text-brand-navy">Details</h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Type</span>
                  <strong className="text-right text-brand-ink">
                    {outageTypes.find((t) => t.id === outageType)?.label ?? 'Not selected'}
                  </strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Noticed</span>
                  <strong className="text-right text-brand-ink">{formatNoticedAt(noticedAt)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Notes</span>
                  <span className="font-semibold text-brand-ink text-right max-w-[200px] truncate">
                    {description || 'No notes added'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Summary Card */}
            <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-brand-line pb-2">
                <h3 className="text-sm font-extrabold text-brand-navy">Location</h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Barangay</span>
                  <strong className="text-brand-ink">{barangay}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Pinned location</span>
                  <strong className="max-w-[210px] truncate text-right text-brand-ink">
                    {pinnedLocation || 'Not pinned'}
                  </strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Landmark</span>
                  <strong className="max-w-[210px] truncate text-right text-brand-ink">
                    {landmark || 'Not provided'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Pin</span>
                  <strong className="text-brand-ink">
                    {pinSource === 'gps'
                      ? `GPS${coordinates?.accuracy ? `, about ${Math.round(coordinates.accuracy)} m` : ''}`
                      : 'Placed manually'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Evidence Summary Card */}
            <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-brand-line pb-2">
                <h3 className="text-sm font-extrabold text-brand-navy">Evidence</h3>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {photos.map((photo) => (
                    <div key={photo.id} className="grid size-9 place-items-center overflow-hidden rounded-xl bg-[e5e9f6] text-brand-blue">
                      {photo.kind === 'video' ? (
                        <Video className="size-4" aria-hidden="true" />
                      ) : (
                        <img src={photo.previewUrl} alt="" className="size-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-brand-muted">
                  {photos.length === 0
                    ? 'No evidence attached'
                    : `${photos.length} attachment${photos.length === 1 ? '' : 's'} attached`}
                </span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 pt-2 text-xs font-medium text-brand-ink cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="size-4 rounded border-brand-line text-brand-blue accent-brand-blue mt-0.5 cursor-pointer"
              />
              <span>I confirm this information is accurate to the best of my knowledge.</span>
            </label>

            {submitError && <p className="text-[11px] font-semibold text-[#b42318]">{submitError}</p>}
          </div>
        )}
      </main>

      {/* STICKY FOOTER ACTIONS */}
      <footer className="sticky bottom-0 z-20 border-t border-brand-line bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {/* Back or Cancel Button */}
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : (window.location.href = '/community'))}
            className="flex-1 rounded-2xl border border-brand-line bg-white py-3 text-xs font-bold text-brand-navy hover:bg-brand-paper active:scale-[0.99] transition-all cursor-pointer"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {/* Next or Submit Button */}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={isProcessingPhoto || (step === 1 && (!outageType || !noticedAt)) || (step >= 2 && !pinnedLocation)}
              className="flex-1 rounded-2xl bg-brand-blue py-3 text-xs font-bold text-white shadow-xs hover:bg-brand-navy active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>Next</span>
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!confirmed || isSubmitting || isProcessingPhoto}
              onClick={handleSubmit}
              className={`flex-1 rounded-2xl py-3 text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                confirmed && !isSubmitting && !isProcessingPhoto
                  ? 'bg-brand-yellow text-brand-navy hover:bg-brand-yellow active:scale-[0.99]'
                  : 'bg-brand-line text-brand-muted cursor-not-allowed'
              }`}
            >
              <Send className="size-3.5 fill-current" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit report'}</span>
            </button>
          )}
        </div>
      </footer>

      {isMapExpanded && (
        <div
          className="fixed inset-0 z-[2000] flex flex-col bg-brand-paper"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expanded-map-title"
        >
          <header className="flex items-center justify-between border-b border-brand-line bg-white px-4 py-3">
            <div>
              <h2 id="expanded-map-title" className="text-sm font-extrabold text-brand-navy">Pick the report location</h2>
              <p className="text-[11px] text-brand-muted">Tap the map or drag the pin.</p>
            </div>
            <button
              ref={closeMapButtonRef}
              type="button"
              onClick={() => setIsMapExpanded(false)}
              aria-label="Close expanded map"
              className="grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-muted cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </header>

          <div className="relative z-0 min-h-0 flex-1">
            <LocationMap pin={pinPosition} onPick={handlePickPin} mapRef={expandedMapRef} expanded />
          </div>

          <div className="space-y-2 border-t border-brand-line bg-white p-4">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-brand-line bg-white text-xs font-bold text-brand-blue shadow-xs hover:bg-brand-paper active:scale-[0.99] transition-all cursor-pointer disabled:cursor-wait disabled:opacity-70"
            >
              <LocateFixed className={`size-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use my current location'}</span>
            </button>
            {locationMessage && (
              <p className={`text-[11px] leading-relaxed ${isLocationError ? 'text-[#9a6500]' : 'text-[#137a48]'}`}>{locationMessage}</p>
            )}
            <p className="text-[11px] text-brand-muted">
              Pin: {pinPosition.lat.toFixed(5)}, {pinPosition.lng.toFixed(5)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

