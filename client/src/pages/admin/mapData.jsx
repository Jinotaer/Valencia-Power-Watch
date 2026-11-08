import L from 'leaflet'

function makeDotIcon(color, size = 12) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>`,
  })
}

export const icons = {
  activeOutage: makeDotIcon('#ef4444', 14),
  scheduled: makeDotIcon('#24449a', 12),
  openReport: makeDotIcon('#f59e0b', 12),
  resolved: makeDotIcon('#22c55e', 10),
  barangay: makeDotIcon('#172b68', 8),
}
