import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Info,
  Map,
  MapPin,
  Menu,
  Navigation,
  Smartphone,
  Volume2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import powerWatchLogo from '../assets/logo.svg'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const features = [
  {
    icon: ClipboardList,
    title: 'Report in minutes',
    text: 'Choose the interruption type, pin your location with GPS, and add photos as evidence.',
  },
  {
    icon: Map,
    title: 'Live outage map',
    text: 'See active outages, affected barangays and outage locations on one map.',
  },
  {
    icon: CheckCircle2,
    title: 'Track every report',
    text: 'Follow each report from submitted to verified to resolved, with a reference number.',
  },
  {
    icon: Calendar,
    title: 'Scheduled outage notices',
    text: 'Know about planned maintenance and the areas it affects before it happens.',
  },
  {
    icon: Volume2,
    title: 'Official announcements',
    text: 'Read advisories, maintenance notices and restoration information from authorized staff.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    text: 'Get updates on your reports and new outage announcements as they happen.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Report',
    text: 'A resident submits a report with the location and optional photos.',
  },
  {
    number: '2',
    title: 'Verify',
    text: 'Authorized personnel review the details and evidence.',
  },
  {
    number: '3',
    title: 'Respond',
    text: 'A field crew is assigned and records progress on site.',
  },
  {
    number: '4',
    title: 'Update',
    text: 'Residents see their report status and official outage updates.',
  },
]

const faqs = [
  [
    'Is Valencia PowerWatch free?',
    'Yes. The public reporting experience is available at no cost. Mobile data charges from your network provider may still apply.',
  ],
  [
    'Does PowerWatch restore electricity?',
    'No. PowerWatch records interruption reports and coordinates verification and response. It does not control equipment or restore electricity.',
  ],
  [
    'How accurate is the location?',
    'A report can use your device location or a location you place on the map. GPS accuracy depends on your device, signal, and surroundings, so check the pin before submitting.',
  ],
  [
    'Can I use PowerWatch offline?',
    'The unified resident and staff app caches its interface shell when installed on your device. Complete offline reporting, background sync, and push delivery are not currently supported.',
  ],
  [
    'How do I install the app?',
    'Tap "Install the app" on this page. Residents and field staff use the same installed app and sign-in page — your account opens the screens built for your role. On iPhone or iPad, open in Safari, tap Share, then choose Add to Home Screen.',
  ],
  [
    'Who can see my report?',
    'Authorized personnel who need the information for verification and response can access operational report details. Your report is not a public social post.',
  ],
]

function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#e8ecf4] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-32px))] items-center justify-between gap-6">
        <a
          className="inline-flex items-center gap-3 whitespace-nowrap text-xl font-extrabold tracking-[-0.02em] text-[#111c38] no-underline sm:text-2xl"
          href="/"
          aria-label="Valencia PowerWatch home"
        >
          <img src={powerWatchLogo} alt="Valencia PowerWatch" className="size-9 shrink-0 rounded-xl" />
          <span>PowerWatch</span>
        </a>

        <button
          className="inline-grid min-h-11 min-w-11 place-items-center rounded-xl border-0 bg-transparent text-[#111c38] md:hidden"
          type="button"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav
          id="primary-nav"
          className={`${
            open ? 'grid' : 'hidden'
          } absolute left-4 right-4 top-[76px] z-40 gap-1 rounded-2xl border border-[#e4e9f2] bg-white p-3 shadow-lg md:static md:flex md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          aria-label="Primary navigation"
        >
          <a
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#4a5568] no-underline transition-colors hover:text-[#111c38] md:p-0"
            href="#features"
            onClick={() => setOpen(false)}
          >
            Features
          </a>
          <a
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#4a5568] no-underline transition-colors hover:text-[#111c38] md:p-0"
            href="#how-it-works"
            onClick={() => setOpen(false)}
          >
            How it works
          </a>
          <a
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#4a5568] no-underline transition-colors hover:text-[#111c38] md:p-0"
            href="#portals"
            onClick={() => setOpen(false)}
          >
            Portals
          </a>
          <a
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#4a5568] no-underline transition-colors hover:text-[#111c38] md:p-0"
            href="#faq"
            onClick={() => setOpen(false)}
          >
            FAQ
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#24449a] px-6 text-sm font-bold text-white no-underline transition-colors hover:bg-[#1b357a]"
            href="/admin/login"
          >
            Admin login
          </a>
        </nav>
      </div>
    </header>
  )
}

function PhonePreview() {
  return (
    <div className="relative mx-auto flex w-full max-w-[540px] items-center justify-center py-6 sm:py-10">
      {/* Subtle concentric radar circles */}
      <div
        className="pointer-events-none absolute size-[400px] rounded-full border border-[#dce3f4] sm:size-[480px] lg:size-[520px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute size-[320px] rounded-full border border-dashed border-[#cfd8ee] sm:size-[380px] lg:size-[420px]"
        aria-hidden="true"
      />

      {/* Floating badge: Report verified */}
      <div className="absolute -left-2 top-[22%] z-20 inline-flex items-center gap-2.5 rounded-full border border-[#e6eaf2] bg-white px-4 py-2.5 text-xs font-bold text-[#111c38] shadow-[0_12px_30px_rgba(17,28,56,0.12)] sm:-left-6 sm:text-sm">
        <span className="grid size-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
        </span>
        <span>Report verified</span>
      </div>

      {/* Phone Device Frame */}
      <div className="relative z-10 w-[310px] rounded-[48px] border-[8px] border-[#111c38] bg-white p-5 shadow-[0_28px_70px_rgba(17,28,56,0.18)] sm:w-[340px]">
        {/* App Header inside Phone */}
        <div className="mb-4 flex items-center gap-2.5">
          <img src={powerWatchLogo} alt="" className="size-7 shrink-0 rounded-lg" />
          <span className="text-sm font-extrabold text-[#111c38]">PowerWatch</span>
        </div>

        <div className="mb-4">
          <div className="text-lg font-extrabold tracking-[-0.02em] text-[#111c38]">Power updates</div>
          <div className="text-xs text-[#647087]">Brgy. Guinuyoran</div>
        </div>

        {/* Active Interruption Card inside Phone */}
        <div className="mb-4 rounded-2xl bg-[#24449a] p-4 text-white shadow-sm">
          <span className="mb-2.5 inline-block rounded-full bg-brand-yellow px-3 py-0.5 text-[11px] font-extrabold text-[#111c38]">
            Active interruption
          </span>
          <div className="mb-2 text-sm font-bold leading-snug text-white">
            Interruption reported in your area
          </div>
          <p className="mb-3.5 text-xs leading-relaxed text-blue-100">
            Verified at 8:42 AM. A response team is being arranged.
          </p>
          <span className="inline-block rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#111c38]">
            View on map
          </span>
        </div>

        {/* Primary CTA inside Phone */}
        <div className="mb-4 rounded-2xl bg-brand-yellow py-3 text-center text-xs font-extrabold text-[#111c38] shadow-xs">
          Report an interruption
        </div>

        {/* Bottom Quick Tiles inside Phone */}
        <div className="mb-6 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-[#e6eaf2] bg-[#f8f9fc] px-2 py-3 text-[11px] font-bold leading-tight text-[#111c38]">
            Outage
            <br />
            map
          </div>
          <div className="rounded-2xl border border-[#e6eaf2] bg-[#f8f9fc] px-2 py-3 text-[11px] font-bold leading-tight text-[#111c38]">
            Scheduled
          </div>
          <div className="rounded-2xl border border-[#e6eaf2] bg-[#f8f9fc] px-2 py-3 text-[11px] font-bold leading-tight text-[#111c38]">
            My reports
          </div>
        </div>
      </div>

      {/* Floating badge: Crew en route */}
      <div className="absolute -right-2 bottom-[14%] z-20 inline-flex items-center gap-2.5 rounded-full border border-[#e6eaf2] bg-white px-4 py-2.5 text-xs font-bold text-[#111c38] shadow-[0_12px_30px_rgba(17,28,56,0.12)] sm:-right-6 sm:text-sm">
        <Navigation className="size-4 text-[#24449a]" aria-hidden="true" />
        <span>Crew en route</span>
      </div>
    </div>
  )
}

function Faq() {
  return (
    <div className="max-w-[820px] border-t border-[#e4e9f2]">
      {faqs.map(([question, answer]) => (
        <details className="group border-b border-[#e4e9f2]" key={question}>
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-2 text-sm font-bold text-[#111c38] sm:text-base">
            <span>{question}</span>
            <ChevronDown
              size={18}
              className="shrink-0 text-[#24449a] transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="max-w-[70ch] pb-5 pr-10 text-sm leading-[1.6] text-[#555b66]">{answer}</p>
        </details>
      ))}
    </div>
  )
}

function LandingPage() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt()
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [showDesktopHint, setShowDesktopHint] = useState(false)

  async function handleDownloadClick(event) {
    if (event) event.preventDefault()
    if (isInstalled) {
      window.location.assign('/login')
      return
    }
    if (canInstall) {
      const outcome = await promptInstall()
      if (!outcome && isIOS) {
        setShowIOSHint(true)
      }
    } else if (isIOS) {
      setShowIOSHint(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // In browsers where beforeinstallprompt isn't fired yet or blocked,
      // stay on landing page and explain how to install from browser address bar/menu
      setShowDesktopHint(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111c38] selection:bg-brand-yellow selection:text-[#111c38]">
      <Header />

      {/* iOS Install Instruction Banner */}
      {showIOSHint && !isInstalled && (
        <aside
          role="status"
          className="sticky top-[76px] z-20 border-b border-[#ffd500] bg-[#fff9db] px-4 py-3 text-center text-sm font-semibold text-[#111c38]"
        >
          <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-left">
              <Info className="size-4 shrink-0 text-[#24449a]" aria-hidden="true" />
              <span>
                To install on iPhone/iPad: tap the <strong>Share</strong> button in Safari (at the bottom of your screen) and select <strong>Add to Home Screen</strong>.
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowIOSHint(false)}
              className="rounded-lg p-1 text-[#111c38] hover:bg-black/5 cursor-pointer"
              aria-label="Close installation instructions"
            >
              <X className="size-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Desktop/Browser Install Instruction Banner */}
      {showDesktopHint && !isInstalled && !canInstall && (
        <aside
          role="status"
          className="sticky top-[76px] z-20 border-b border-[#24449a]/20 bg-[#eef3fd] px-4 py-3 text-center text-sm font-semibold text-[#111c38]"
        >
          <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-left">
              <Info className="size-4 shrink-0 text-[#24449a]" aria-hidden="true" />
              <span>
                To install directly: click the <strong>Install icon (computer/arrow)</strong> in your browser's address bar (right side), or open the browser menu (⋮) and select <strong>Install Valencia PowerWatch</strong>.
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowDesktopHint(false)}
              className="rounded-lg p-1 text-[#111c38] hover:bg-black/5 cursor-pointer"
              aria-label="Close installation instructions"
            >
              <X className="size-4" />
            </button>
          </div>
        </aside>
      )}

      <main>
        {/* Hero Section - Full Viewport Screen Height */}
        <section className="relative flex min-h-[calc(100vh-76px)] w-full items-center bg-[#f2f5fc] py-12 lg:py-0">
          <div className="mx-auto grid w-[min(1240px,calc(100%-40px))] grid-cols-1 items-center gap-10 py-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 xl:gap-16">
            <div className="max-w-[640px]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e3e9f8] px-4 py-1.5 text-xs font-bold text-[#24449a] sm:text-sm">
                <MapPin className="size-4" aria-hidden="true" />
                <span>Valencia City, Bukidnon</span>
              </div>

              <h1 className="mb-5 text-[clamp(38px,4.8vw,58px)] font-extrabold leading-[1.06] tracking-[-0.03em] text-[#111c38]">
                Report power interruptions.{' '}
                <span className="text-[#24449a]">Stay informed.</span>
              </h1>

              <p className="mb-8 max-w-[50ch] text-base leading-[1.65] text-[#555b66] sm:text-lg">
                PowerWatch connects residents, field crews and administrators, so every outage report is verified, tracked and answered in one place.
              </p>

              {/* Install the App Row - Direct Download Trigger */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#24449a] px-7 text-sm font-bold text-white shadow-md shadow-[#24449a]/20 transition-all hover:bg-[#1b357a] hover:shadow-lg sm:text-base"
                >
                  {isInstalled ? (
                    <>
                      <Smartphone className="size-4.5" aria-hidden="true" />
                      <span>Open the app</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4.5" aria-hidden="true" />
                      <span>Download the app</span>
                    </>
                  )}
                </button>
                <p className="m-0 max-w-[34ch] text-xs leading-snug text-[#555b66] sm:text-sm">
                  For residents and field staff. Works on Android and iPhone, no app store needed.
                </p>
              </div>
            </div>

            <PhonePreview />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-14 sm:py-20" aria-labelledby="features-heading">
          <div className="mx-auto w-[min(1240px,calc(100%-40px))]">
            <div className="mb-10 max-w-[680px]">
              <span className="mb-3.5 inline-block rounded-full bg-[#e3e9f8] px-3.5 py-1 text-xs font-bold text-[#24449a] sm:text-sm">
                Features
              </span>
              <h2
                id="features-heading"
                className="mb-3 text-[clamp(28px,3.5vw,42px)] font-extrabold leading-[1.12] tracking-[-0.025em] text-[#111c38]"
              >
                Everything residents need during a power interruption
              </h2>
              <p className="m-0 text-sm leading-[1.6] text-[#555b66] sm:text-base">
                Report quickly, see what is happening nearby, and follow every update.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-[#e6eaf2] bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <span
                    className="mb-4 inline-grid size-11 place-items-center rounded-xl bg-[#eef2fb] text-[#24449a]"
                    aria-hidden="true"
                  >
                    <Icon className="size-5.5" strokeWidth={2} />
                  </span>
                  <h3 className="mb-2 text-base font-bold tracking-[-0.015em] text-[#111c38] sm:text-lg">
                    {title}
                  </h3>
                  <p className="m-0 text-xs leading-[1.6] text-[#555b66] sm:text-sm">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="bg-[#f2f5fc] py-14 sm:py-20"
          aria-labelledby="process-heading"
        >
          <div className="mx-auto w-[min(1240px,calc(100%-40px))]">
            <div className="mb-10 max-w-[680px]">
              <span className="mb-3.5 inline-block rounded-full bg-[#e3e9f8] px-3.5 py-1 text-xs font-bold text-[#24449a] sm:text-sm">
                How it works
              </span>
              <h2
                id="process-heading"
                className="m-0 text-[clamp(28px,3.5vw,42px)] font-extrabold leading-[1.12] tracking-[-0.025em] text-[#111c38]"
              >
                From report to restoration update
              </h2>
            </div>

            <ol className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ number, title, text }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-[#e6eaf2] bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <span className="mb-4 inline-grid size-9 place-items-center rounded-full bg-brand-yellow text-xs font-extrabold text-[#111c38]">
                    {number}
                  </span>
                  <h3 className="mb-2 text-base font-bold text-[#111c38] sm:text-lg">{title}</h3>
                  <p className="m-0 text-xs leading-[1.6] text-[#555b66] sm:text-sm">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Built For Each Role Section */}
        <section id="portals" className="bg-white py-14 sm:py-20" aria-labelledby="portals-heading">
          <div className="mx-auto w-[min(1240px,calc(100%-40px))]">
            <div className="mb-10 max-w-[680px]">
              <span className="mb-3.5 inline-block rounded-full bg-[#e3e9f8] px-3.5 py-1 text-xs font-bold text-[#24449a] sm:text-sm">
                One app, one admin portal
              </span>
              <h2
                id="portals-heading"
                className="mb-3 text-[clamp(28px,3.5vw,42px)] font-extrabold leading-[1.12] tracking-[-0.025em] text-[#111c38]"
              >
                Built for each role
              </h2>
              <p className="m-0 text-sm leading-[1.6] text-[#555b66] sm:text-base">
                Residents and field staff use the same app and the same sign-in page. The screens you see depend on your account.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Residents Card */}
              <article className="flex flex-col justify-between rounded-2xl border border-[#e6eaf2] bg-white p-6 sm:p-7">
                <div>
                  <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#24449a]">
                    RESIDENTS · IN THE APP
                  </div>
                  <h3 className="mb-3 text-lg font-extrabold tracking-[-0.02em] text-[#111c38] sm:text-xl">
                    Report and follow outages
                  </h3>
                  <ul className="mb-6 list-none space-y-2.5 p-0 text-xs text-[#4a5568] sm:text-sm">
                    <li>Report an outage with GPS and photos</li>
                    <li>Follow your report history</li>
                    <li>View outages and announcements</li>
                  </ul>
                </div>
              </article>

              {/* Field Staff Card */}
              <article className="flex flex-col justify-between rounded-2xl border border-[#e6eaf2] bg-white p-6 sm:p-7">
                <div>
                  <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#24449a]">
                    FIELD STAFF · IN THE APP
                  </div>
                  <h3 className="mb-3 text-lg font-extrabold tracking-[-0.02em] text-[#111c38] sm:text-xl">
                    Handle assigned jobs
                  </h3>
                  <ul className="mb-3 list-none space-y-2.5 p-0 text-xs text-[#4a5568] sm:text-sm">
                    <li>See assigned jobs and stages</li>
                    <li>Navigate to the reported location</li>
                    <li>Add notes and upload evidence</li>
                  </ul>
                  <p className="mb-5 text-[11px] text-[#647087]">
                    Staff accounts are issued by administrators.
                  </p>
                </div>
              </article>

              {/* Administrators Card */}
              <article className="flex flex-col justify-between rounded-2xl border border-[#e6eaf2] bg-white p-6 sm:p-7">
                <div>
                  <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#24449a]">
                    ADMINISTRATORS · WEB PORTAL
                  </div>
                  <h3 className="mb-3 text-lg font-extrabold tracking-[-0.02em] text-[#111c38] sm:text-xl">
                    Manage the system
                  </h3>
                  <ul className="mb-6 list-none space-y-2.5 p-0 text-xs text-[#4a5568] sm:text-sm">
                    <li>Review and verify reports</li>
                    <li>Assign staff and track progress</li>
                    <li>Publish announcements and manage outages</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Install PowerWatch on Your Phone Dark Navy Section */}
        <section id="install-app" className="bg-[#111c38] py-14 text-white sm:py-20">
          <div className="mx-auto grid w-[min(1240px,calc(100%-40px))] grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <div>
              <h2 className="mb-3.5 max-w-[460px] text-[clamp(28px,3.5vw,40px)] font-extrabold leading-[1.12] tracking-[-0.025em] text-white">
                Install PowerWatch on your phone
              </h2>
              <p className="m-0 max-w-[44ch] text-sm leading-[1.6] text-blue-100 sm:text-base">
                Install it directly to your home screen with no app store or login required.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 sm:p-7">
              <h3 className="mb-2 text-base font-extrabold text-white sm:text-lg">PowerWatch App</h3>
              <p className="mb-4 text-xs leading-relaxed text-blue-100 sm:text-sm">
                Direct installation for residents and field staff. Tap the button below to prompt download.
              </p>
              <div className="mb-5 space-y-1 text-xs leading-relaxed text-blue-100 sm:text-sm">
                <div>
                  <strong className="font-bold text-white">Android / Chrome:</strong> tap Download to install instantly.
                </div>
                <div>
                  <strong className="font-bold text-white">iPhone / iPad Safari:</strong> tap Share, then Add to Home Screen.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadClick}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#24449a] px-6 text-xs font-bold text-white border border-white/20 transition-colors hover:bg-[#1b357a] sm:text-sm"
              >
                {isInstalled ? (
                  <>
                    <Smartphone className="size-4" aria-hidden="true" />
                    <span>Open installed app</span>
                  </>
                ) : (
                  <>
                    <Download className="size-4" aria-hidden="true" />
                    <span>Download app now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="bg-white py-14 sm:py-20"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto w-[min(1240px,calc(100%-40px))]">
            <div className="mb-9 max-w-[680px]">
              <span className="mb-3.5 inline-block rounded-full bg-[#e3e9f8] px-3.5 py-1 text-xs font-bold text-[#24449a] sm:text-sm">
                FAQ
              </span>
              <h2
                id="faq-heading"
                className="mb-3 text-[clamp(28px,3.5vw,42px)] font-extrabold leading-[1.12] tracking-[-0.025em] text-[#111c38]"
              >
                Straight answers about PowerWatch
              </h2>
              <p className="m-0 text-sm leading-[1.6] text-[#555b66] sm:text-base">
                Common questions about reporting outages and installing the unified app.
              </p>
            </div>
            <Faq />
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e8ecf4] bg-[#f8f9fc] py-14">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <a
              className="mb-3 inline-flex items-center gap-3 text-lg font-extrabold tracking-[-0.02em] text-[#111c38] no-underline sm:text-xl"
              href="/"
            >
              <img src={powerWatchLogo} alt="Valencia PowerWatch" className="size-8 shrink-0 rounded-xl" />
              <span>PowerWatch</span>
            </a>
            <p className="m-0 max-w-[48ch] text-sm leading-relaxed text-[#555b66]">
              PowerWatch records and coordinates outage reports across Valencia City. It does not directly restore electricity or control electrical equipment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-7 text-sm font-semibold text-[#4a5568]">
            <a className="no-underline hover:text-[#111c38]" href="/download">
              Download the app
            </a>
            <a className="no-underline hover:text-[#111c38]" href="/admin/login">
              Admin sign in
            </a>
            <a className="no-underline hover:text-[#111c38]" href="mailto:[CONTACT_EMAIL]">
              [CONTACT_EMAIL]
            </a>
          </div>
        </div>
        <div className="mx-auto mt-10 flex w-[min(1180px,calc(100%-32px))] flex-wrap justify-between gap-3 border-t border-[#e4e9f2] pt-6 text-xs text-[#647087]">
          <span>© {new Date().getFullYear()} Valencia PowerWatch</span>
          <span>Public service reporting tool · Valencia City, Bukidnon</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage