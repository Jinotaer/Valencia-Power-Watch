import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export function FlyToControl({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom || 14, { duration: 1.2 })
    }
  }, [target, map])
  return null
}

export function LayerToggle({ label, checked, onChange, icon, tag, tagColor, count }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-brand-line text-brand-blue accent-brand-blue cursor-pointer"
      />
      {icon && <span className="text-sm">{icon}</span>}
      <span className="flex-1 text-[13px] text-brand-ink group-hover:text-brand-ink font-medium">
        {label}
      </span>
      {tag && (
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tagColor || 'bg-[#e5e9f6] text-brand-muted'}`}>
          {tag}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs tabular-nums text-brand-muted font-medium">{count}</span>
      )}
    </label>
  )
}
