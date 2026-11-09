import { ChevronLeft, Image as ImageIcon, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PortalMobileNav } from '../../components/layout/PortalMobileNav'
import { loadReport } from '../../lib/reports'
import { ReportPriorityBadge, ReportStatusBadge, ReportTimeline } from '../../components/resident/reportView'

function submittedAt(report) {
  if (report.createdAt) {
    return new Date(report.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return report.date || 'Unknown'
}

function pinLabel(report) {
  if (report.pinSource !== 'gps') return 'Placed manually'
  const accuracy = report.coordinates?.accuracy
  return accuracy ? `GPS, about ${Math.round(accuracy)} m` : 'GPS'
}

export default function ResidentReportDetail({ reportId }) {
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    loadReport(reportId)
      .then((savedReport) => {
        if (active) setReport(savedReport)
      })
      .catch(() => {
        if (active) {
          setReport(null)
          setLoadError('We could not load this report. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reportId, reloadKey])

  const retryLoad = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  const photos = (report?.photos ?? []).filter((photo) => photo.dataUrl)

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community/reports" className="grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-muted" aria-label="Back to reports">
            <ChevronLeft className="size-4.5" aria-hidden="true" />
          </a>
          <h1 className="text-sm font-extrabold text-brand-navy">Report details</h1>
          <a href="/community" className="grid size-9 place-items-center rounded-xl border border-brand-line bg-white text-brand-muted" aria-label="Close">
            <X className="size-4.5" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        {isLoading && <div className="rounded-2xl border border-brand-line bg-white px-5 py-10 text-center text-sm font-semibold text-brand-muted">Loading report…</div>}

        {!isLoading && !report && (
          <div className="rounded-2xl border border-dashed border-brand-line bg-white px-5 py-10 text-center">
            <ImageIcon className="mx-auto size-8 text-brand-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-brand-muted">{loadError || 'This report could not be found.'}</p>
            {loadError ? (
              <button type="button" className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4" onClick={retryLoad}>Try again</button>
            ) : (
              <a href="/community/reports" className="mt-2 inline-block text-xs font-bold text-brand-blue underline underline-offset-4">Back to my reports</a>
            )}
          </div>
        )}

        {!isLoading && report && (
          <div className="space-y-3 sm:space-y-4">
            <article className="rounded-2xl border border-brand-line bg-white p-3.5 shadow-[0_6px_18px_rgba(23,43,104,0.04)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[9px] font-semibold tracking-[.04em] text-brand-muted sm:text-[11px]">{report.id}</span>
                  <h2 className="mt-1 text-base font-extrabold leading-tight text-brand-navy sm:text-lg">{report.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-brand-muted sm:text-xs">
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-brand-blue" aria-hidden="true" />{report.location}</span>
                    <span>·</span>
                    <span>{report.date}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ReportPriorityBadge priority={report.priority} />
                  <ReportStatusBadge tone={report.tone} status={report.status} />
                </div>
              </div>
              <p className="mt-3 max-w-[60ch] text-[11px] leading-4 text-brand-muted sm:text-sm sm:leading-6">{report.description}</p>
              <ReportTimeline progress={report.progress ?? 0} />
            </article>

            <section className="rounded-2xl border border-brand-line bg-white p-3.5 sm:p-5" aria-labelledby="report-info-heading">
              <h2 id="report-info-heading" className="text-sm font-extrabold text-brand-navy">What you reported</h2>
              <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                {[
                  ['Type', report.outageType],
                  ['Noticed', report.startedTime],
                  ['Barangay', report.barangay ? `Brgy. ${report.barangay}` : null],
                  ['Pinned location', report.pinnedLocation || null],
                  ['Landmark', report.landmark || 'Not provided'],
                  ['Location pin', pinLabel(report)],
                  ['Submitted', submittedAt(report)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{label}</dt>
                    <dd className="mt-0.5 font-semibold text-brand-muted">{value || 'Not provided'}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-brand-line bg-white p-3.5 sm:p-5" aria-labelledby="report-notes-heading">
              <h2 id="report-notes-heading" className="text-sm font-extrabold text-brand-navy">Notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-brand-muted sm:text-sm sm:leading-6">{report.notes || 'No additional notes.'}</p>
            </section>

            <section className="rounded-2xl border border-brand-line bg-white p-3.5 sm:p-5" aria-labelledby="report-evidence-heading">
              <h2 id="report-evidence-heading" className="text-sm font-extrabold text-brand-navy">Evidence</h2>
              {(report.photos ?? []).length === 0 ? (
                <p className="mt-2 text-xs text-brand-muted sm:text-sm">No evidence was attached.</p>
              ) : photos.length === 0 ? (
                <p className="mt-2 text-xs text-brand-muted sm:text-sm">Evidence could not be loaded.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    photo.kind === 'video' ? (
                      <video
                        key={photo.id}
                        src={photo.dataUrl}
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={photo.label || `Report video ${index + 1}`}
                        className="h-40 w-auto max-w-full rounded-xl border border-brand-line bg-black"
                      />
                    ) : (
                      <img key={photo.id} src={photo.dataUrl} alt={photo.label || `Report photo ${index + 1}`} className="size-24 rounded-xl border border-brand-line object-cover" />
                    )
                  ))}
                </div>
              )}
            </section>

            <a href="/community/reports/new" className="flex min-h-11 items-center justify-center rounded-xl bg-brand-blue px-4 text-xs font-bold text-white no-underline shadow-[0_7px_16px_rgba(36,68,154,0.2)] transition-transform hover:-translate-y-0.5">
              Report another interruption
            </a>

            {report.status === 'Resolved' && (
              <a href={`/community/feedback?report=${encodeURIComponent(report.id)}`} className="flex min-h-11 items-center justify-center rounded-xl bg-brand-yellow px-4 text-xs font-black text-brand-navy no-underline shadow-[0_7px_16px_rgba(36,68,154,0.2)] transition-transform hover:-translate-y-0.5">
                Rate this response
              </a>
            )}
          </div>
        )}
      </main>

      <PortalMobileNav role="resident" />
    </div>
  )
}
