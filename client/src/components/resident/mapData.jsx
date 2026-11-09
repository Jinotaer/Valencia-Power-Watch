import L from 'leaflet'

export const VALENCIA_CENTER = [7.9042, 125.0961]

// Custom Leaflet HTML Marker Icons
export const icons = {
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
      <div style="width:34px;height:34px;border-radius:50%;background:#24449a;border:2.5px solid white;box-shadow:0 4px 12px rgba(27,61,143,.35);display:flex;align-items:center;justify-content:center;cursor:pointer;">
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
