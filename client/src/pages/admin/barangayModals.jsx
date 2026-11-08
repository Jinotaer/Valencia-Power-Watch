import { Building2 } from 'lucide-react'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { valenciaBarangays } from '../auth/resident-staff/registerData'
import { VALENCIA_CENTER } from '../../lib/geo'

// OSM sometimes spells these differently from the barangay list.
const barangayAliases = {
  guinyoran: 'Guinoyuran',
  lurogan: 'Lurugan',
  mountnebo: 'Mt. Nebo',
}

function normalizeName(value) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function normalizeBarangayName(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchBarangayName(data) {
  const address = data?.address ?? {}
  const candidates = [
    address.suburb,
    address.village,
    address.quarter,
    address.hamlet,
    address.neighbourhood,
    address.town,
    address.city_district,
    data?.display_name,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const normalized = normalizeName(candidate)
    if (barangayAliases[normalized]) return barangayAliases[normalized]
    const match = valenciaBarangays.find((barangay) => normalizeName(barangay) === normalized)
    if (match) return match
  }

  const display = normalizeName(data?.display_name ?? '')
  const alias = Object.entries(barangayAliases).find(([key]) => display.includes(key))
  if (alias) return alias[1]
  return valenciaBarangays.find((barangay) => display.includes(normalizeName(barangay))) ?? null
}

const barangayPinIcon = L.divIcon({
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `
    <div style="width:36px;height:36px;border-radius:50%;background:#ffd500;border:3px solid #172b68;box-shadow:0 4px 12px rgba(23,43,104,.3);display:flex;align-items:center;justify-content:center;">
      <div style="width:10px;height:10px;border-radius:50%;background:#172b68;"></div>
    </div>
  `,
})

function formatCoordinates(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function MapClickToPin({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MapSizeFix() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

function BarangayLocationMap({ pin, onPick }) {
  const center = pin ? [pin.lat, pin.lng] : VALENCIA_CENTER
  return (
    <MapContainer
      center={center}
      zoom={15}
      zoomControl
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapClickToPin onPick={onPick} />
      <MapSizeFix />
      {pin && (
        <Marker
          position={[pin.lat, pin.lng]}
          icon={barangayPinIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = event.target.getLatLng()
              onPick(lat, lng)
            },
          }}
        />
      )}
    </MapContainer>
  )
}

export function BarangayCreateDialog({
  open,
  onOpenChange,
  newBarangay,
  setNewBarangay,
  onCreateBarangay,
  existingBarangays = [],
  isSubmitting = false,
  actionError = '',
}) {
  const pin = newBarangay.pinPosition ?? null
  const coordinates = newBarangay.coordinates ?? null
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const geocodeControllerRef = useRef(null)
  const geocodeTimerRef = useRef(null)

  const normalizedName = normalizeBarangayName(newBarangay.name)
  const duplicateBarangay = normalizedName
    ? existingBarangays.find((barangay) => normalizeBarangayName(barangay.name) === normalizedName)
    : null

  useEffect(() => () => {
    clearTimeout(geocodeTimerRef.current)
    geocodeControllerRef.current?.abort()
  }, [])

  // Auto-fill the pinned location and barangay from the map pin.
  // shortcut: public Nominatim lookup; cache or self-host the geocoder for high-volume production.
  const resolvePinnedLocation = (lat, lng) => {
    const coordinateLabel = formatCoordinates(lat, lng)
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
        const matchedBarangay = matchBarangayName(data)

        setNewBarangay((prev) => ({
          ...prev,
          pinnedLocation: shortAddress && prev.pinnedLocation === coordinateLabel ? shortAddress : prev.pinnedLocation,
          name: matchedBarangay ?? prev.name,
        }))
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Offline or lookup failure: the coordinate fallback stays filled in.
        }
      } finally {
        if (!controller.signal.aborted) setIsResolvingLocation(false)
      }
    }, 500)
  }

  const handlePickPin = (lat, lng) => {
    setNewBarangay((prev) => ({
      ...prev,
      pinPosition: { lat, lng },
      coordinates: { latitude: lat, longitude: lng, accuracy: null },
      pinSource: 'manual',
      pinnedLocation: formatCoordinates(lat, lng),
    }))
    resolvePinnedLocation(lat, lng)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[940px] max-h-[92vh] overflow-y-auto md:overflow-hidden p-0 rounded-2xl bg-white">
          <div className="grid min-h-[600px] grid-cols-1 md:grid-cols-[1.25fr_0.85fr] md:h-[min(640px,92vh)]">
            {/* Left: map picker */}
            <div className="relative z-0 h-72 w-full overflow-hidden border-b border-brand-line bg-[#e5e9f6] md:h-full md:border-b-0 md:border-r">
              <BarangayLocationMap pin={pin} onPick={handlePickPin} />
              <span className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand-navy shadow-sm">
                Click the map or drag the pin
              </span>
            </div>

            {/* Right: inputs */}
            <div className="min-h-0 p-6 md:h-full md:overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-brand-ink flex items-center gap-2">
                  <Building2 className="size-5 text-brand-blue" />
                  Register Barangay Liaison
                </DialogTitle>
                <DialogDescription className="text-xs text-brand-muted">
                  Register a barangay contact and liaison for power outage response coordination.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onCreateBarangay} className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-muted">Barangay Name</label>
                  <Input
                    required
                    placeholder="e.g. Sinayawan"
                    value={newBarangay.name}
                    onChange={(e) => setNewBarangay({ ...newBarangay, name: e.target.value })}
                    className="h-10 text-sm"
                  />
                  {duplicateBarangay && (
                    <p className="text-[11px] font-semibold text-[#b42318]">
                      A barangay with that name already exists{duplicateBarangay.code ? ` (${duplicateBarangay.code})` : ''}.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-muted">Barangay Captain / Liaison</label>
                  <Input
                    placeholder="e.g. Hon. Juan Dela Cruz"
                    value={newBarangay.captain}
                    onChange={(e) => setNewBarangay({ ...newBarangay, captain: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-muted">Contact Hotline</label>
                    <Input
                      placeholder="+63 917 000 0000"
                      value={newBarangay.contactNumber}
                      onChange={(e) => setNewBarangay({ ...newBarangay, contactNumber: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-muted">Total Households</label>
                    <Input
                      type="number"
                      placeholder="2500"
                      value={newBarangay.totalHouseholds}
                      onChange={(e) => setNewBarangay({ ...newBarangay, totalHouseholds: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-muted">Barangay Location</label>
                  <Input
                    required
                    placeholder="Click the map to pin the barangay"
                    value={newBarangay.pinnedLocation}
                    onChange={(e) => setNewBarangay({ ...newBarangay, pinnedLocation: e.target.value })}
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-brand-muted">
                    {isResolvingLocation
                      ? 'Finding barangay…'
                      : coordinates
                        ? `Latitude ${coordinates.latitude.toFixed(5)}, longitude ${coordinates.longitude.toFixed(5)}.`
                        : 'Pin the barangay on the map to save its latitude and longitude.'}
                  </p>
                </div>

                {actionError && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]">
                    {actionError}
                  </p>
                )}

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || Boolean(duplicateBarangay)}
                    className="bg-brand-blue hover:bg-brand-navy text-white rounded-lg text-xs font-semibold"
                  >
                    {isSubmitting ? 'Registering…' : 'Register Barangay'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function BarangayEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  actionError,
  isSubmitting,
  onSave,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-brand-ink">Edit Barangay</DialogTitle>
          <DialogDescription className="text-xs text-brand-muted">
            Update liaison details.
          </DialogDescription>
        </DialogHeader>

        {actionError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]">
            {actionError}
          </p>
        )}

        <form onSubmit={onSave} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-muted">Barangay Captain / Liaison</label>
            <Input value={form.captain} onChange={(e) => setForm({ ...form, captain: e.target.value })} className="h-10 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Contact Hotline</label>
              <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className="h-10 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Total Households</label>
              <Input type="number" min="0" value={form.totalHouseholds} onChange={(e) => setForm({ ...form, totalHouseholds: e.target.value })} className="h-10 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Affected Households</label>
              <Input type="number" min="0" value={form.affectedHouseholds} onChange={(e) => setForm({ ...form, affectedHouseholds: e.target.value })} className="h-10 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-muted">Pinned Location</label>
            <Input value={form.pinnedLocation} onChange={(e) => setForm({ ...form, pinnedLocation: e.target.value })} className="h-10 text-sm" />
          </div>
          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-lg text-xs font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-blue hover:bg-brand-navy text-white rounded-lg text-xs font-semibold">
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BarangayCreateDialog
