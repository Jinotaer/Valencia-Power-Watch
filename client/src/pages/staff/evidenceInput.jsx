import { Camera, X } from 'lucide-react'
import { useId } from 'react'

// Optional photo/video proof that a job was fixed. The file is uploaded only
// when the staff member marks the report resolved.
export function ResolutionEvidenceInput({ file, onChange, dark = false, disabled = false }) {
  const id = useId()
  const textColor = dark ? 'text-brand-line' : 'text-brand-muted'

  return (
    <div
      className={`mt-3 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 ${
        dark ? 'border-white/25 bg-white/5' : 'border-brand-line bg-white'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <label htmlFor={id} className={`flex min-w-0 flex-1 items-center gap-2 ${disabled ? '' : 'cursor-pointer'}`}>
        <Camera className={`size-4 shrink-0 ${textColor}`} />
        <span className={`min-w-0 truncate text-[11px] font-bold ${textColor}`}>
          {file ? file.name : 'Attach evidence (photo or video, optional)'}
        </span>
        <input
          id={id}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Remove evidence"
          className={`shrink-0 cursor-pointer ${textColor} hover:opacity-70 disabled:opacity-60`}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
