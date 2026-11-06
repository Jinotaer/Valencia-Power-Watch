import L from 'leaflet'

// Valencia City / Guinuyoran coordinates
export const GUINYORAN_SITE = [7.8900, 125.0550]
export const POBLACION_HAZARD = [7.9095, 125.0935]
export const LUROGAN_JOB = [7.8780, 125.0980]
export const STAFF_DEFAULT_GPS = [7.8760, 125.0880]

// Simulated route path from staff GPS to Guinyoran
export const navigationRoute = [
  STAFF_DEFAULT_GPS,
  [7.8790, 125.0830],
  [7.8835, 125.0740],
  [7.8870, 125.0640],
  [7.8890, 125.0590],
  GUINYORAN_SITE,
]

// Custom Leaflet Markers
export const icons = {
  outageHotspot: L.divIcon({
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
  hazardMarker: L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `
      <div style="width:36px;height:36px;border-radius:50%;background:#ffffff;border:2.5px solid #dc2626;box-shadow:0 4px 12px rgba(220,38,38,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg style="width:18px;height:18px;stroke:#dc2626;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;" viewBox="0 0 24 24">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
  }),
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
