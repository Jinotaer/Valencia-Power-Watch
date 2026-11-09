import { ArrowRight, Check, X } from 'lucide-react'
import { useLanguage } from '../../lib/i18n'

export function SubmitReportSuccess({ reportReference, outageType, barangay }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy flex flex-col justify-between">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white px-4 py-3.5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <span className="text-sm font-extrabold text-brand-navy">{t('Report Submitted')}</span>
          <a href="/community" className="text-brand-muted hover:text-brand-muted" aria-label={t('Close')}>
            <X className="size-5" />
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md p-5 flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-4 flex size-20 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d] shadow-sm">
          <Check className="size-10 stroke-[3]" />
        </div>

        <span className="rounded-full bg-[e5e9f6] px-3 py-1 text-xs font-bold text-brand-blue">
          {t('Reference: {reference}', { reference: reportReference })}
        </span>

        <h1 className="mt-3 text-2xl font-black text-brand-navy tracking-tight">
          {t('Thank you for reporting!')}
        </h1>
        <p className="mt-2 text-xs text-brand-muted max-w-xs leading-relaxed">
          {t('Your report in {barangay} has been received and queued for dispatch verification.', {
            barangay: t('Brgy. {barangay}', { barangay }),
          })}
        </p>

        <div className="mt-6 w-full rounded-2xl border border-brand-line bg-white p-4 text-left shadow-xs space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-brand-muted font-medium">{t('Issue')}</span>
            <strong className="text-brand-ink">{outageType}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted font-medium">{t('Barangay')}</span>
            <strong className="text-brand-ink">{barangay}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted font-medium">{t('Status')}</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{t('Pending Verification')}</span>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-2.5">
          <a
            href={`/community/reports/${reportReference}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue text-sm font-bold text-white shadow-xs hover:bg-brand-navy transition-all"
          >
            {t('View report status')}
            <ArrowRight className="size-4" />
          </a>
          <a
            href="/community"
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-brand-line bg-white text-sm font-bold text-brand-ink hover:bg-brand-paper transition-all"
          >
            {t('Back to home')}
          </a>
        </div>
      </main>
    </div>
  )
}

export default SubmitReportSuccess
