// Valencia City Center Coordinates
export const VALENCIA_CENTER = [7.9042, 125.0961]

// Official 31 Barangays of Valencia City. Reports without a captured pin are
// plotted (and routed) at their barangay center instead.
export const barangayCenters = [
  { name: 'Poblacion', lat: 7.9095, lng: 125.0935, households: 8420 },
  { name: 'Bagontapay', lat: 7.9210, lng: 125.1150, households: 3100 },
  { name: 'Batangan', lat: 7.8755, lng: 125.0890, households: 2850 },
  { name: 'Catumbalon', lat: 7.9305, lng: 125.0700, households: 2100 },
  { name: 'Colonia', lat: 7.8980, lng: 125.0600, households: 1950 },
  { name: 'Concepcion', lat: 7.9180, lng: 125.1050, households: 1800 },
  { name: 'Dagat-Kidavao', lat: 7.9400, lng: 125.0800, households: 1650 },
  { name: 'Guinoyuran', lat: 7.8900, lng: 125.0550, households: 2900 },
  { name: 'Laligan', lat: 7.9250, lng: 125.1200, households: 2200 },
  { name: 'Lilingayon', lat: 7.8700, lng: 125.0950, households: 2450 },
  { name: 'Lourdes', lat: 7.9150, lng: 125.0880, households: 3600 },
  { name: 'Lumbayao', lat: 7.9200, lng: 125.1100, households: 3100 },
  { name: 'Mailag', lat: 7.9350, lng: 125.0750, households: 2750 },
  { name: 'San Carlos', lat: 7.8950, lng: 125.0650, households: 2300 },
  { name: 'Sugod', lat: 7.9000, lng: 125.0920, households: 3200 },
  { name: 'Tongantongan', lat: 7.9060, lng: 125.0980, households: 2950 },
  { name: 'Bantuanon', lat: 7.8800, lng: 125.0850, households: 1500 },
  { name: 'Barobo', lat: 7.8850, lng: 125.0600, households: 1400 },
  { name: 'Datu Salumay', lat: 7.9380, lng: 125.0680, households: 1200 },
  { name: 'Kahaponan', lat: 7.9300, lng: 125.0900, households: 2400 },
  { name: 'Musuan', lat: 7.8705, lng: 125.0500, households: 1100 },
  { name: 'Lumbo', lat: 7.9120, lng: 125.0800, households: 1800 },
  { name: 'Tugaya', lat: 7.8930, lng: 125.1100, households: 1300 },
  { name: 'Sinayawan', lat: 7.9450, lng: 125.1150, households: 1250 },
  { name: 'Dampas', lat: 7.8680, lng: 125.0750, households: 980 },
  { name: 'San Isidro', lat: 7.9500, lng: 125.1000, households: 1600 },
  { name: 'Vintar', lat: 7.8600, lng: 125.0680, households: 850 },
  { name: 'Mt. Nebo', lat: 7.8550, lng: 125.0800, households: 750 },
  { name: 'Pinatilan', lat: 7.9130, lng: 125.1020, households: 2100 },
  { name: 'Lurugan', lat: 7.8780, lng: 125.0980, households: 1050 },
  { name: 'Mabuhay', lat: 7.9420, lng: 125.0920, households: 1350 },
]

function normalizePlaceName(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const centerByBarangayName = Object.fromEntries(
  barangayCenters.map((barangay) => [normalizePlaceName(barangay.name), barangay]),
)

// Resolve a report's map position: captured pin first, otherwise its barangay center.
export function resolveReportCoordinates(report) {
  if (!report) return null
  if (
    report.coordinates &&
    Number.isFinite(report.coordinates.latitude) &&
    Number.isFinite(report.coordinates.longitude)
  ) {
    return {
      position: [report.coordinates.latitude, report.coordinates.longitude],
      approximate: false,
    }
  }

  const center = centerByBarangayName[normalizePlaceName(report.barangay)]
  return center ? { position: [center.lat, center.lng], approximate: true } : null
}
