import { Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'
import { BellLink } from '../../components/layout/BellLink'
import { useLanguage } from '../../lib/i18n'
import { loadAnnouncements } from '../../lib/announcements'

const categoryMeta = {
  advisory: { label: 'Advisory', badge: 'bg-[#fff1a8] text-[#9a6500]' },
  maintenance: { label: 'Maintenance', badge: 'bg-[#e5e9f6] text-brand-blue' },
  restoration: { label: 'Restoration', badge: 'bg-[#d9f9e8] text-[#137a48]' },
  general: { label: 'General', badge: 'bg-[#e5e9f6] text-brand-ink' },
}

function formatDate(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ResidentAnnouncements() {
  const { t, locale } = useLanguage()
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    loadAnnouncements()
      .then((rows) => {
        if (active) setAnnouncements(rows)
      })
      .catch(() => {
        if (active) {
          setAnnouncements([])
          setLoadError('We could not load advisories. Check your connection and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  return (
    <div className="min-h-screen bg-brand-paper text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-white/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/community" className="no-underline"><PortalMark role="resident" /></a>
          <BellLink />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pb-32 pt-5 sm:px-5 sm:pt-8 md:pb-10">
        <div className="mb-4">
          <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-brand-navy">{t('Advisories')}</h1>
          <p className="mt-1 text-[11px] leading-4 text-brand-muted sm:mt-2 sm:text-sm sm:leading-6">{t('Official announcements, maintenance and restoration information.')}</p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {isLoading && (
            <div className="rounded-2xl border border-brand-line bg-white px-5 py-10 text-center text-sm font-semibold text-brand-muted">
              {t('Loading advisories…')}
            </div>
          )}

          {!isLoading && loadError && (
            <div className="rounded-2xl border border-[#f3c7c3] bg-white px-5 py-10 text-center">
              <p className="text-sm font-bold text-[#b42318]">{t(loadError)}</p>
              <button type="button" onClick={() => { setLoadError(''); setIsLoading(true); setReloadKey((value) => value + 1) }} className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer">
                {t('Try again')}
              </button>
            </div>
          )}

          {!isLoading && !loadError && announcements.map((item) => {
            const meta = categoryMeta[item.category] ?? categoryMeta.general
            return (
              <article key={item.id} className="rounded-2xl border border-brand-line bg-white p-3.5 shadow-[0_6px_18px_rgba(23,43,104,0.04)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-extrabold leading-tight text-brand-navy sm:text-base">{item.title}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>{t(meta.label)}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-brand-muted sm:text-sm">{item.body}</p>
                <p className="mt-2 text-[10px] font-semibold text-brand-muted sm:text-xs">
                  {item.barangay ? `${t('Brgy. {barangay}', { barangay: item.barangay })} · ` : ''}{formatDate(item.publishedAt, locale)}
                </p>
              </article>
            )
          })}

          {!isLoading && !loadError && announcements.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-line bg-white px-5 py-10 text-center">
              <Megaphone className="mx-auto size-8 text-brand-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-brand-muted">{t('No advisories yet.')}</p>
              <p className="mt-1 text-xs leading-5 text-brand-muted">{t('Official notices from the utility will appear here.')}</p>
            </div>
          )}
        </div>
      </main>

      <PortalMobileNav role="resident" />
    </div>
  )
}
