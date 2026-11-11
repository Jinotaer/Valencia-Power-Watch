import { Clock, Link2, MessageSquare } from 'lucide-react'
import { localeFor, useLanguage } from '../../lib/i18n'
import { ReportStatusBadge } from '../resident/reportView'

function formatDateTime(iso, t, locale) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Resident + resolution evidence (photo/video) for a report.
export function EvidenceGallery({ photos = [] }) {
  const { t } = useLanguage()
  const visible = photos.filter((photo) => photo.dataUrl)
  const hidden = photos.length - visible.length

  return (
    <div className="mt-4 border-t border-brand-line pt-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('Evidence')}</span>
      {photos.length === 0 ? (
        <p className="mt-1 text-xs text-brand-muted">{t('No photos or videos were attached.')}</p>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {visible.map((photo) => (
              <a
                key={photo.id}
                href={photo.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-xl border border-brand-line bg-brand-paper"
                title={photo.label}
              >
                {photo.kind === 'video' ? (
                  <video src={photo.dataUrl} className="size-full object-cover" muted playsInline />
                ) : (
                  <img src={photo.dataUrl} alt={photo.label || t('Report evidence')} className="size-full object-cover" />
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {photo.uploadedByName || photo.teamName
                    ? `${photo.uploadedByName || 'Lineman'}${photo.teamName ? ` (${photo.teamName})` : ''}`
                    : photo.label || (photo.kind === 'video' ? t('Video') : t('Photo'))}
                </span>
              </a>
            ))}
          </div>
          {hidden > 0 && (
            <p className="mt-1.5 text-[11px] text-brand-muted">
              {t(hidden === 1 ? '{count} file is not viewable yet — re-run report.sql to grant staff evidence access.' : '{count} files are not viewable yet — re-run report.sql to grant staff evidence access.', {
                count: hidden,
              })}
            </p>
          )}
        </>
      )}
    </div>
  )
}

// Staff remarks, restoration ETA and completion time.
export function StaffActivityRecord({ report }) {
  const { language, t } = useLanguage()
  const locale = localeFor(language)

  return (
    <div className="mt-4 border-t border-brand-line pt-3 space-y-2.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('Field activity')}</span>
      <div className="flex items-start gap-2 text-xs">
        <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-brand-blue" />
        <p className="whitespace-pre-wrap leading-5 text-brand-muted">
          {report.staffRemarks || t('No remarks recorded yet.')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-brand-paper p-2.5">
          <span className="block text-[10px] font-bold uppercase text-brand-muted">{t('Restoration ETA')}</span>
          <span className="font-semibold text-brand-navy">{report.restorationEta || '—'}</span>
        </div>
        <div className="rounded-xl bg-brand-paper p-2.5">
          <span className="block text-[10px] font-bold uppercase text-brand-muted">
            {report.tone === 'resolved' ? t('Resolved') : t('Last update')}
          </span>
          <span className="font-semibold text-brand-navy">
            {formatDateTime(report.tone === 'resolved' ? report.resolvedAt : report.updatedAt, t, locale)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-brand-muted">
        <Clock className="size-3" />
        <span>{t('Reported {date}', { date: formatDateTime(report.createdAt, t, locale) })}</span>
      </div>
    </div>
  )
}

// Other assigned reports in the same barangay (likely the same incident).
export function LinkedReports({ report, reports = [] }) {
  const { t } = useLanguage()
  const linked = reports.filter(
    (other) =>
      other.id !== report.id &&
      (other.barangay || '').toLowerCase() === (report.barangay || '').toLowerCase(),
  )

  return (
    <div className="mt-4 border-t border-brand-line pt-3">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
        <Link2 className="size-3" /> {t('Linked reports in Brgy. {barangay}', { barangay: report.barangay || '—' })}
      </span>
      {linked.length === 0 ? (
        <p className="mt-1 text-xs text-brand-muted">{t('No other assigned reports in this area.')}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {linked.map((other) => (
            <li key={other.id} className="flex items-center justify-between gap-2 rounded-xl border border-brand-line px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-brand-navy">{other.outageType}</p>
                <p className="truncate text-[11px] text-brand-muted">
                  {other.id}{other.landmark ? ` · ${other.landmark}` : ''}
                </p>
              </div>
              <ReportStatusBadge tone={other.tone} status={other.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
