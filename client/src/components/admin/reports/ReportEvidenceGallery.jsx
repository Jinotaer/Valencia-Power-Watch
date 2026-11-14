import { Camera, Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'

function formatPhotoTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ReportEvidenceGallery({ report }) {
  const photos = report.photos ?? []
  const [expandedIndex, setExpandedIndex] = useState(null)
  const expandedPhoto = expandedIndex !== null ? photos[expandedIndex] : null

  if (photos.length === 0) {
    return (
      <Card
        size="sm"
        className="mt-2.5 border border-dashed border-brand-line bg-brand-paper/40 py-3.5 ring-0"
      >
        <CardContent className="flex items-center gap-3 px-4 text-xs font-medium text-brand-muted">
          <Camera className="size-4 shrink-0 text-brand-muted/70" aria-hidden="true" />
          <span>No photo or video evidence was attached to this report.</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-2.5 space-y-3">
      {expandedPhoto?.dataUrl && expandedPhoto.kind !== 'video' && (
        <div className="overflow-hidden rounded-xl border border-brand-line bg-slate-950">
          <div className="relative">
            <img
              src={expandedPhoto.dataUrl}
              alt={expandedPhoto.label || 'Expanded report evidence'}
              className="max-h-72 w-full object-contain"
            />
            <Button
              type="button"
              size="xs"
              onClick={() => setExpandedIndex(null)}
              className="absolute top-2.5 right-2.5 gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-black cursor-pointer"
            >
              <X className="size-3.5" aria-hidden="true" />
              Close preview
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-900 px-3.5 py-2 text-[11px] text-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  expandedPhoto.uploadedBy === 'staff'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/15 text-white'
                }`}
              >
                {expandedPhoto.uploadedBy === 'staff' ? 'Crew Resolution' : 'Resident Photo'}
              </span>
              <span className="truncate font-medium">
                {expandedPhoto.uploadedBy === 'staff'
                  ? `${expandedPhoto.uploadedByName || 'Field crew'}${expandedPhoto.teamName ? ` · ${expandedPhoto.teamName}` : ''}`
                  : expandedPhoto.label || `Photo ${expandedIndex + 1}`}
              </span>
            </div>
            {formatPhotoTime(expandedPhoto.uploadedAt) && (
              <span className="shrink-0 tabular-nums text-[10px] text-slate-400">
                {formatPhotoTime(expandedPhoto.uploadedAt)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {photos.map((photo, index) => {
          const isStaff = photo.uploadedBy === 'staff'
          const captionTitle = isStaff
            ? `${photo.uploadedByName || 'Field crew'}${photo.teamName ? ` (${photo.teamName})` : ''}`
            : photo.label || `Photo ${index + 1}`
          const uploadedLabel = formatPhotoTime(photo.uploadedAt)

          if (!photo.dataUrl) {
            return (
              <div
                key={photo.id ?? index}
                className="sm:col-span-2 flex aspect-video items-center justify-center rounded-xl border border-dashed border-brand-line bg-brand-paper px-4 text-center text-[11px] font-semibold text-brand-muted"
              >
                Evidence file {index + 1} could not be loaded — re-run supabase/report.sql so admins can read the evidence bucket.
              </div>
            )
          }

          if (photo.kind === 'video') {
            return (
              <div
                key={photo.id ?? index}
                className="sm:col-span-2 overflow-hidden rounded-xl border border-brand-line bg-white"
              >
                <video
                  src={photo.dataUrl}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={photo.label || `Report video ${index + 1}`}
                  className="aspect-video w-full bg-black object-contain"
                />
                <div className="flex items-center justify-between gap-2 border-t border-brand-line/70 bg-brand-paper/50 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                        isStaff
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-brand-line bg-white text-brand-navy'
                      }`}
                    >
                      {isStaff ? 'Crew Proof' : 'Resident Video'}
                    </span>
                    <span className="truncate text-[11px] font-semibold text-brand-ink" title={captionTitle}>
                      {captionTitle}
                    </span>
                  </div>
                  {uploadedLabel && (
                    <span className="shrink-0 tabular-nums text-[10px] text-brand-muted">
                      {uploadedLabel}
                    </span>
                  )}
                </div>
              </div>
            )
          }

          const isSelected = expandedIndex === index

          return (
            <button
              key={photo.id ?? index}
              type="button"
              onClick={() => setExpandedIndex((current) => (current === index ? null : index))}
              className={`group flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer ${
                isSelected
                  ? 'border-brand-blue ring-1 ring-brand-blue/30'
                  : 'border-brand-line hover:border-brand-blue/60'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={photo.dataUrl}
                  alt={photo.label || `Report photo ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-lg bg-slate-950/65 text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100"
                >
                  <Maximize2 className="size-3.5" />
                </span>
              </div>

              <div className="flex w-full flex-col gap-1 border-t border-brand-line/70 bg-brand-paper/50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                      isStaff
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-brand-line bg-white text-brand-navy'
                    }`}
                  >
                    {isStaff ? 'Crew Proof' : 'Resident'}
                  </span>
                  {uploadedLabel && (
                    <span className="shrink-0 tabular-nums text-[10px] text-brand-muted">
                      {uploadedLabel}
                    </span>
                  )}
                </div>
                <span
                  className="truncate text-[11px] font-semibold text-brand-ink"
                  title={captionTitle}
                >
                  {captionTitle}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
