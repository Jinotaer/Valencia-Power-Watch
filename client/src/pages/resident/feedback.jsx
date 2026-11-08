import { Check, Send, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PortalMobileNav, PortalMark } from '../../components/layout/PortalMobileNav'
import { BellLink } from '../../components/layout/BellLink'
import { loadReports } from '../../lib/reports'
import { submitFeedback } from '../../lib/feedback'

export default function ResidentFeedback() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [reportReference, setReportReference] = useState('')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let active = true

    loadReports()
      .then((rows) => {
        if (!active) return
        setReports(rows)
        const preselected = new URLSearchParams(window.location.search).get('report')
        if (preselected && rows.some((row) => row.id === preselected)) {
          setReportReference(preselected)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const ratingLabel = useMemo(() => {
    if (!rating) return 'Tap a star to rate'
    return ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating - 1]
  }, [rating])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!rating) {
      setStatus('Choose a rating from 1 to 5.')
      return
    }

    setIsSubmitting(true)
    setStatus('')

    try {
      await submitFeedback({ reportReference, rating, message })
      setSubmitted(true)
    } catch (error) {
      setStatus(error.message || 'We could not send your feedback. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <h1 className="text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05] tracking-[-.045em] text-brand-navy">Feedback</h1>
          <p className="mt-1 text-[11px] leading-4 text-brand-muted sm:mt-2 sm:text-sm sm:leading-6">Rate your experience and help the response team improve.</p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-[#cde9d8] bg-white px-5 py-10 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#d9f9e8] text-[#137a48]">
              <Check className="size-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-brand-navy">Thank you — feedback sent.</p>
            <p className="mt-1 text-xs text-brand-muted">Your rating helps the city improve response times.</p>
            <a href="/community/reports" className="mt-3 inline-block text-xs font-bold text-brand-blue underline underline-offset-4">Back to my reports</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <section className="rounded-2xl border border-brand-line bg-white p-4 sm:p-5">
              <label htmlFor="feedback-report" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Related report (optional)
              </label>
              <select
                id="feedback-report"
                value={reportReference}
                onChange={(event) => setReportReference(event.target.value)}
                disabled={isLoading}
                className="w-full appearance-none rounded-2xl border border-brand-line bg-white px-3.5 py-2.5 text-xs font-bold text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none cursor-pointer disabled:opacity-60"
              >
                <option value="">General feedback</option>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>{report.id} · {report.outageType} · {report.location}</option>
                ))}
              </select>
            </section>

            <section className="rounded-2xl border border-brand-line bg-white p-4 sm:p-5">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-muted">Your rating</span>
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    onClick={() => setRating(value)}
                    className="cursor-pointer rounded-lg p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-7 ${value <= rating ? 'fill-brand-yellow text-brand-yellow' : 'text-brand-line'}`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs font-semibold text-brand-muted">{ratingLabel}</p>
            </section>

            <section className="rounded-2xl border border-brand-line bg-white p-4 sm:p-5">
              <label htmlFor="feedback-message" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Comments (optional)
              </label>
              <textarea
                id="feedback-message"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us what went well or what we should fix"
                className="w-full rounded-2xl border border-brand-line bg-white p-3.5 text-xs text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none"
              />
            </section>

            {status && <p role="alert" className="text-xs font-semibold text-[#b42318]">{status}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-xs font-bold text-white shadow-[0_7px_16px_rgba(36,68,154,0.2)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
            >
              <Send className="size-4" />
              <span>{isSubmitting ? 'Sending…' : 'Send feedback'}</span>
            </button>
          </form>
        )}
      </main>

      <PortalMobileNav role="resident" />
    </div>
  )
}
