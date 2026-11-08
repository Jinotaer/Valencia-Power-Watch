import L from 'leaflet'

// Valencia City fallback while the crew's real GPS loads
export const STAFF_DEFAULT_GPS = [7.9042, 125.0961]

// Custom Leaflet Markers
export const icons = {
  jobMarker: L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="width:34px;height:34px;border-radius:50%;background:#24449a;border:2.5px solid white;box-shadow:0 4px 12px rgba(27,61,143,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg style="width:16px;height:16px;stroke:white;fill:none;stroke-width:2;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
    `,
  }),
  doneMarker: L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="width:34px;height:34px;border-radius:50%;background:#22c55e;border:2.5px solid white;box-shadow:0 4px 12px rgba(20,120,70,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg style="width:16px;height:16px;stroke:white;fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    `,
  }),
  staffGps: L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(27,61,143,0.25);animation:ping 2s cubic-bezier(0,0,.2,1) infinite;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#24449a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);"></div>
      </div>
    `,
  }),
}
