import { Camera, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'

export function ReportEvidenceGallery({ report }) {
  const photos = report.photos ?? []
  const [expandedUrl, setExpandedUrl] = useState(null)

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
    <div className="mt-2.5 space-y-2.5">
      {expandedUrl && (
        <div className="relative overflow-hidden rounded-xl border border-brand-line bg-slate-950">
          <img
            src={expandedUrl}
            alt="Expanded report evidence"
            className="max-h-72 w-full object-contain"
          />
          <Button
            type="button"
            size="xs"
            onClick={() => setExpandedUrl(null)}
            className="absolute top-2.5 right-2.5 gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-black cursor-pointer"
          >
            <X className="size-3.5" aria-hidden="true" />
            Close preview
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {photos.map((photo, index) => {
          if (!photo.dataUrl) {
            return (
              <div
                key={photo.id ?? index}
                className="col-span-2 flex aspect-video items-center justify-center rounded-xl border border-dashed border-brand-line bg-brand-paper px-4 text-center text-[11px] font-semibold text-brand-muted"
              >
                Evidence file {index + 1} could not be loaded — re-run supabase/report.sql so admins can read the evidence bucket.
              </div>
            )
          }
          return photo.kind === 'video' ? (
            <video
              key={photo.id ?? index}
              src={photo.dataUrl}
              controls
              playsInline
              preload="metadata"
              aria-label={photo.label || `Report video ${index + 1}`}
              className="col-span-2 aspect-video w-full rounded-xl border border-brand-line bg-black object-contain"
            />
          ) : (
            <button
              key={photo.id ?? index}
              type="button"
              onClick={() =>
                setExpandedUrl((current) => (current === photo.dataUrl ? null : photo.dataUrl))
              }
              className="group relative aspect-video w-full overflow-hidden rounded-xl border border-brand-line bg-brand-paper text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
            >
              <img
                src={photo.dataUrl}
                alt={photo.label || `Report photo ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2.5 py-1.5 text-[10px] font-semibold text-white">
                {photo.uploadedBy === 'staff' ? 'Staff resolution photo' : photo.label || `Photo ${index + 1}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
