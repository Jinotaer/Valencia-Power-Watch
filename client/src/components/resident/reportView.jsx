import { Check, ChevronRight, Copy, Flag } from 'lucide-react'
import { Badge } from '../ui/badge'
import { useLanguage } from '../../lib/i18n'
import { priorityLabels } from '../../lib/reports'

const toneClasses = {
  verified: 'bg-[#d9f9e8] text-[#137a48] border-[#b6f0d1]',
  pending: 'bg-[#fff1a8] text-[#9a6500] border-[#fde067]',
  resolved: 'bg-[#e5e9f6] text-brand-blue border-brand-line',
  rejected: 'bg-red-50 text-[#b42318] border-red-200',
}

export function ReportStatusBadge({ tone, status }) {
  const { t } = useLanguage()
  return (
    <Badge
      variant="outline"
      className={`h-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${toneClasses[tone] ?? 'bg-[#e5e9f6] text-brand-muted border-brand-line'}`}
    >
      {tone === 'verified' && <Check className="mr-0.5 inline size-3" strokeWidth={3} aria-hidden="true" />}
      {t(status)}
    </Badge>
  )
}

export function ReportDuplicateBadge() {
  const { t } = useLanguage()
  return (
    <Badge
      variant="outline"
      className="h-auto shrink-0 rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-900"
    >
      <Copy className="mr-0.5 inline size-3" strokeWidth={2.25} aria-hidden="true" />
      {t('Duplicate')}
    </Badge>
  )
}

const priorityClasses = {
  high: 'bg-red-50 text-[#b42318] border-red-200',
  medium: 'bg-[#fff1a8] text-[#9a6500] border-[#fde067]',
  low: 'bg-[#e5e9f6] text-brand-muted border-brand-line',
}

export function ReportPriorityBadge({ priority = 'medium' }) {
  const { t } = useLanguage()
  const key = String(priority).toLowerCase()
  return (
    <Badge
      variant="outline"
      className={`h-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityClasses[key] ?? priorityClasses.medium}`}
    >
      {t(priorityLabels[key] ?? key)}
    </Badge>
  )
}

export function ReportTimeline({ progress }) {
  const { t } = useLanguage()
  const steps = ['Submitted', 'Verified', 'Dispatched', 'Resolved']

  return (
    <div className="mt-4 border-t border-brand-line pt-3">
      <div className="relative grid grid-cols-4">
        <span className="absolute left-[12%] right-[12%] top-2 h-px bg-brand-line" aria-hidden="true" />
        {steps.map((step, index) => {
          const complete = index < progress
          const current = index === progress

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-1 text-center">
              <span className={`grid size-4 place-items-center rounded-full border-2 ${complete ? 'border-brand-blue bg-brand-blue text-white' : current ? 'border-brand-line bg-white' : 'border-brand-line bg-white'}`}>
                {complete && <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />}
              </span>
              <span className="text-[9px] font-semibold text-brand-muted">{t(step)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AlreadyReportedBadge() {
  const { t } = useLanguage()
  return (
    <Badge
      variant="outline"
      className="h-auto shrink-0 rounded-full border-red-300 bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-[#b42318]"
    >
      <Flag className="mr-0.5 inline size-3" strokeWidth={2.25} aria-hidden="true" />
      {t('Already reported')}
    </Badge>
  )
}

export function AlreadyReportedBanner({ match, fallbackReference = '', allowLocationChangeHint = false }) {
  const { t } = useLanguage()
  const report = match?.report
  const reference = report?.id || fallbackReference
  if (!reference) return null

  let message
  if (!report) {
    message = t('You already have an active report for this incident ({reference}). Duplicate submissions are blocked until your existing report is resolved or closed.', {
      reference,
    })
  } else if (allowLocationChangeHint && match.reason === 'same-barangay-type') {
    message = t('You already have an active {type} report in Brgy. {barangay} ({reference}). If this incident is in a different area, update the location in the next step.', {
      type: t(report.outageType),
      barangay: report.barangay,
      reference,
    })
  } else if (match.reason === 'nearby-pin') {
    message = t('This pin is within {distance} m of your active report ({reference} · {type} in Brgy. {barangay}). You can only report an incident once while your report is active.', {
      distance: match.distanceMeters ?? 0,
      reference,
      type: t(report.outageType),
      barangay: report.barangay,
    })
  } else {
    message = t('You already reported this {type} in Brgy. {barangay} ({reference}). You can only report an incident once while your report is active.', {
      type: t(report.outageType),
      barangay: report.barangay,
      reference,
    })
  }

  return (
    <div
      role="status"
      className="rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-red-950 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AlreadyReportedBadge />
        {report && <ReportStatusBadge tone={report.tone} status={report.status} />}
      </div>
      <p className="mt-2 text-xs font-medium leading-relaxed text-[#7f1d1d]">{message}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-red-200/80 pt-2">
        <span className="text-[11px] font-bold tracking-wide text-[#b42318]">{reference}</span>
        <a
          href={`/community/reports/${encodeURIComponent(reference)}`}
          className="inline-flex items-center gap-0.5 text-xs font-extrabold text-[#b42318] no-underline hover:underline"
        >
          {t('View existing report')}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
