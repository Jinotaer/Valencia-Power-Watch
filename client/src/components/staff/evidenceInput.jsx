import { Plus, Video, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useLanguage } from '../../lib/i18n'

// Photo/video proof that a job was fixed, supporting up to 3 attachments.
// Styled consistently with resident report evidence uploads.
export function ResolutionEvidenceInput({
  files = [],
  file = null,
  onChange,
  dark = false,
  disabled = false,
  maxFiles = 3,
}) {
  const inputRef = useRef(null)
  const { t } = useLanguage()

  // Normalize: support either files array or single file prop
  const fileList = useMemo(() => {
    if (Array.isArray(files) && files.length > 0) return files
    if (file) return [file]
    return []
  }, [files, file])

  // Create preview URLs for every file in the list
  const previews = useMemo(() => {
    return fileList.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      isVideo: f.type?.startsWith('video/'),
    }))
  }, [fileList])

  // Revoke preview URLs when the file list changes or unmounts
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [previews])

  const handleAddFiles = (event) => {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    if (selected.length === 0) return

    const remainingSlots = Math.max(0, maxFiles - fileList.length)
    const additions = selected.slice(0, remainingSlots)
    const updated = [...fileList, ...additions]
    onChange?.(updated)
  }

  const handleRemove = (indexToRemove) => {
    const updated = fileList.filter((_, idx) => idx !== indexToRemove)
    onChange?.(updated)
  }

  return (
    <div className="mt-3.5 pt-1">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Thumbnails of attached evidence */}
        {previews.map((preview, idx) => (
          <div
            key={preview.url}
            className={`relative flex size-16 sm:size-18 shrink-0 items-center justify-center rounded-2xl border shadow-xs ${
              dark ? 'border-white/20 bg-white/5' : 'border-brand-line bg-[#e5e9f6]'
            }`}
          >
            <div className="size-full overflow-hidden rounded-2xl">
              {preview.isVideo ? (
                <>
                  <video
                    src={preview.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="size-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-black/35">
                    <Video className="size-5 text-white" />
                  </span>
                </>
              ) : (
                <img
                  src={preview.url}
                  alt={preview.file.name || t('Uploaded evidence')}
                  className="size-full object-cover"
                />
              )}
            </div>

            {/* Remove Evidence Badge Button */}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border border-brand-line bg-white text-brand-muted shadow-xs hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                aria-label={t('Remove attachment {index}', { index: idx + 1 })}
              >
                <X className="size-3 stroke-[2.5]" />
              </button>
            )}
          </div>
        ))}

        {/* Dashed Add Slot (visible when under maxFiles) */}
        {fileList.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={`grid size-16 sm:size-18 shrink-0 place-items-center rounded-2xl border-2 border-dashed transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              dark
                ? 'border-white/35 text-white hover:bg-white/10 active:scale-95'
                : 'border-brand-line text-brand-blue hover:bg-brand-paper active:scale-95'
            }`}
            aria-label={t('Add photo or video')}
          >
            <Plus className="size-6 stroke-[2.2]" />
          </button>
        )}

        {/* Context / Helper Text */}
        <div className="flex flex-col justify-center min-w-[120px] max-w-[200px] pr-1">
          <span className={`text-xs font-bold leading-snug truncate ${dark ? 'text-white' : 'text-brand-navy'}`}>
            {fileList.length === 0
              ? t('Attach proof of fix')
              : t('{count} of {max} attached', { count: fileList.length, max: maxFiles })}
          </span>
          <span className={`text-[11px] leading-tight mt-0.5 truncate ${dark ? 'text-brand-line' : 'text-brand-muted'}`}>
            {fileList.length === 0
              ? t('Up to {max} photos or videos', { max: maxFiles })
              : fileList.length < maxFiles
              ? t('Tap + to add more')
              : t('Max attachments reached')}
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={handleAddFiles}
      />
    </div>
  )
}
