import { Check } from 'lucide-react'
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
