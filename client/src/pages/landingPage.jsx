import {
  BellRing,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileImage,
  LocateFixed,
  Map,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { InstallBanner } from '../components/landing/InstallBanner'
import cityPanorama from '../assets/valencia-city-panorama.jpg'
import powerWatchLogo from '../assets/logo.png'

const faqs = [
  ['Is Valencia PowerWatch free?', 'Yes. The public reporting experience is available at no cost. Mobile data charges from your network provider may still apply.'],
  ['Does PowerWatch restore electricity?', 'No. PowerWatch records interruption reports and coordinates verification and response. It does not control equipment or restore electricity.'],
  ['How accurate is the location?', 'A report can use your device location or a location you place on the map. GPS accuracy depends on your device, signal, and surroundings, so check the pin before submitting.'],
  ['Can I use PowerWatch offline?', 'The resident and staff portals can be installed as apps and cache their shells. Complete offline reporting, background sync, and push delivery are not currently supported.'],
  ['How do I install the app?', 'Choose the Resident App or Staff App install button. You will be taken to the matching portal, where your browser will show the install option when supported. iPhone users can use Share, then Add to Home Screen.'],
  ['Who can see my report?', 'Authorized personnel who need the information for verification and response can access operational report details. Your report is not a public social post.'],
]

const features = [
  { icon: LocateFixed, title: 'Report with a place', text: 'Pin the interruption location, choose the barangay, and describe what you are seeing.' },
  { icon: FileImage, title: 'Add useful evidence', text: 'Attach a photo when it helps responders understand the situation on the ground.' },
  { icon: Map, title: 'See the outage picture', text: 'Check active and scheduled outage information on a map before and after you report.' },
  { icon: ClipboardCheck, title: 'Follow your report', text: 'Review report history and see when a report has been checked or updated.' },
  { icon: BellRing, title: 'Receive relevant updates', text: 'Stay informed about changes connected to your reports and local outage activity.' },
  { icon: MessageSquareText, title: 'Ask PowerWatch', text: 'Use the assistant for help finding the right place to report or understand an update.' },
]

const steps = [
  ['Report', 'A resident sends an interruption report with a location and details.'],
  ['Verify', 'Authorized personnel review the information and connect related reports.'],
  ['Dispatch', 'An administrator assigns the incident to field personnel for response.'],
  ['Field response', 'Staff confirm conditions, add notes, and upload permitted evidence.'],
  ['Update', 'The incident record is updated so residents can follow relevant progress.'],
]

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-20 flex min-h-16 w-full items-center justify-between gap-6 border-b border-[#c9d2eb] bg-white px-3 shadow-[0_4px_16px_rgba(23,43,104,.08)] sm:min-h-[68px] sm:px-[max(12px,calc((100%-1280px)/2))]">
    <a className="inline-flex items-center gap-2.5 whitespace-nowrap text-[15px] tracking-[-.025em] no-underline" href="/" aria-label="Valencia PowerWatch home"><img className="h-[37px] w-[37px] rounded-full object-contain" src={powerWatchLogo} alt="" /><span>Valencia <strong className="font-bold">PowerWatch</strong></span></a>
    <button className="inline-grid min-h-11 min-w-11 place-items-center border-0 bg-transparent text-brand-ink md:hidden" type="button" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}<span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span></button>
    <nav id="primary-nav" className={`${open ? 'grid' : 'hidden'} absolute left-4 right-4 top-16 z-40 gap-1 rounded-lg border border-brand-line bg-white p-2 shadow-brand md:static md:flex md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Primary navigation">
      <a className="p-3 text-sm text-brand-muted no-underline hover:text-brand-ink md:p-0" href="#features" onClick={() => setOpen(false)}>Features</a><a className="p-3 text-sm text-brand-muted no-underline hover:text-brand-ink md:p-0" href="#how-it-works" onClick={() => setOpen(false)}>How it works</a><a className="p-3 text-sm text-brand-muted no-underline hover:text-brand-ink md:p-0" href="#faq" onClick={() => setOpen(false)}>FAQ</a><a className="rounded-md bg-brand-blue px-4 py-3 text-center text-sm font-bold text-white no-underline" href="/community">Open Community Portal</a>
    </nav>
  </header>
}

function InstallCard({ staff = false }) {
  return <article className={`flex min-h-[280px] flex-col items-start rounded-xl border p-7 ${staff ? 'border-brand-navy bg-brand-navy text-white' : 'border-brand-line bg-white'}`}>
    <div className="mb-6 flex items-center gap-3"><span className={`grid h-[42px] w-[42px] place-items-center rounded-lg ${staff ? 'bg-[#fff1a8] text-brand-navy' : 'bg-[#e5e9f6] text-brand-blue'}`} aria-hidden="true">{staff ? <ShieldCheck size={23} /> : <Users size={23} />}</span><span className={`text-xs ${staff ? 'text-blue-100' : 'text-brand-muted'}`}>{staff ? 'For field personnel' : 'For residents'}</span></div>
    <h3 className="mb-2 text-[25px] tracking-[-.025em]">{staff ? 'Staff App' : 'Resident App'}</h3><p className={`max-w-[45ch] text-sm leading-[1.5] ${staff ? 'text-blue-100' : 'text-brand-muted'}`}>{staff ? 'A focused mobile workspace for assigned work, verification, field notes, and evidence.' : 'A simple way to report an interruption, see outage information, and follow your reports.'}</p>
    {staff && <p className="mt-[-1px] max-w-[45ch] text-xs leading-[1.5] text-blue-100">Staff accounts are issued by administrators.</p>}
    <a className="mt-auto inline-flex min-h-11 items-center justify-center rounded-md bg-brand-navy px-[18px] text-sm font-bold text-white no-underline" href={`${staff ? '/staff' : '/community'}?install=1`}>{staff ? 'Install Staff App' : 'Install Resident App'}</a>
  </article>
}

function MapPreview() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { rootMargin: '160px' })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className="relative min-h-[330px] overflow-hidden rounded-[14px_14px_70px_14px] bg-[#c8d1c1]" aria-label="Outage map preview">
    <img className="h-full min-h-[330px] w-full object-cover saturate-[.55] sepia-[.12]" src={cityPanorama} alt="Valencia City landscape, used as a map preview fallback" width="1200" height="600" loading="lazy" />
    <div className="absolute bottom-6 left-6 w-[min(275px,calc(100%-3rem))] rounded-lg bg-brand-navy/95 p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#ffe66b]"><Map size={17} /> Outage map</div><p className="my-3.5 text-sm leading-[1.4]">{visible ? 'Map data loads inside the Community Portal.' : 'Preparing map preview...'}</p><a className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-[18px] text-sm font-bold text-brand-navy no-underline" href="/community#map">Open the community map</a></div>
    <span className="absolute left-[57%] top-[28%] h-3.5 w-3.5 rotate-[-45deg] rounded-[50%_50%_50%_0] border-[3px] border-white bg-brand-yellow shadow-md" aria-hidden="true" /><span className="absolute left-[75%] top-[44%] h-3.5 w-3.5 rotate-[-45deg] rounded-[50%_50%_50%_0] border-[3px] border-white bg-brand-yellow shadow-md" aria-hidden="true" /><span className="absolute left-[44%] top-[61%] h-3.5 w-3.5 rotate-[-45deg] rounded-[50%_50%_50%_0] border-[3px] border-white bg-brand-yellow shadow-md" aria-hidden="true" />
  </div>
}

function Faq() {
  return <div className="max-w-[820px] border-t border-brand-line">{faqs.map(([question, answer]) => <details className="border-b border-brand-line" key={question}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 font-semibold">{question}<ChevronDown size={20} className="text-brand-blue" aria-hidden="true" /></summary><p className="max-w-[70ch] pb-5 pr-11 text-sm leading-[1.6] text-brand-muted">{answer}</p></details>)}</div>
}

function LandingPage() {
  return <div className="min-h-screen bg-brand-paper">
    <Header />
    <main>
      <section className="mx-auto grid min-h-[650px] w-[min(1280px,calc(100%-32px))] grid-cols-1 items-center gap-12 py-[55px] md:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] md:gap-[76px] md:py-[74px_96px]">
        <div><h1 className="mb-6 max-w-[680px] text-[clamp(42px,6vw,75px)] font-bold leading-[.98] tracking-[-.055em]">Report power interruptions in Valencia City, Bukidnon.</h1><p className="mb-7 max-w-[53ch] text-lg leading-[1.55] text-brand-muted">PowerWatch gives residents, field personnel, and administrators one clear place to report, verify, and follow outage activity.</p><div className="flex flex-wrap items-center gap-5"><a className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-yellow px-[18px] text-sm font-bold text-[#221506] no-underline" href="/community">Report an outage</a><a className="text-sm font-semibold underline underline-offset-4" href="#how-it-works">See how reports move <span aria-hidden="true">↓</span></a></div><div className="mt-11 flex items-center gap-2 text-[13px] text-brand-blue"><Check size={16} /> Built for local reporting and coordinated response</div></div>
        <div className="relative grid min-h-[330px] place-items-center overflow-hidden rounded-[20px_20px_78px_20px] bg-[#e8ebf5] md:min-h-[390px]"><div className="absolute inset-0 opacity-35 [background:linear-gradient(135deg,transparent_0_47%,rgba(36,68,154,.15)_48%_49%,transparent_50%_100%),linear-gradient(25deg,transparent_0_62%,rgba(255,213,0,.4)_63%_64%,transparent_65%)]" /><div className="absolute w-[min(355px,78%)] -translate-x-[13%] -translate-y-[18%] rounded-xl border border-brand-blue/20 bg-white p-6 shadow-brand"><div className="mb-7 flex items-center gap-2 text-xs text-brand-blue"><span className="h-2 w-2 rounded-full bg-brand-blue" /> Report received <span className="ml-auto text-brand-muted">just now</span></div><strong className="block mb-1.5 text-xl">Power interruption</strong><p className="mb-6 text-[13px] text-brand-muted">Pin placed near Poblacion, Valencia City</p><div className="flex gap-3 border-t border-brand-line pt-3.5 text-[11px] text-brand-muted"><span className="flex items-center gap-1"><LocateFixed size={14} /> Location added</span><span className="flex items-center gap-1"><FileImage size={14} /> Evidence optional</span></div></div><div className="absolute h-[100px] w-[115px] translate-x-[47%] translate-y-[12%] rounded-tr-[50px] border-r-2 border-t-2 border-dashed border-brand-yellow" /><div className="absolute flex translate-x-[37%] translate-y-[100%] items-center gap-3 rounded-xl border border-brand-blue/20 bg-white px-[18px] py-4 text-brand-blue shadow-brand"><ClipboardCheck size={19} /><span><strong className="block text-[13px]">Verification</strong><small className="mt-0.5 block text-[11px] text-brand-muted">Ready for review</small></span></div></div>
      </section>
      <section className="mx-auto w-[min(1280px,calc(100%-32px))] py-[70px] md:pb-[105px]" aria-labelledby="install-heading"><div className="mb-9 max-w-[610px]"><p className="mb-4 text-xs font-bold uppercase tracking-[.13em] text-brand-blue">Choose your workspace</p><h2 id="install-heading" className="mb-5 text-[clamp(32px,4vw,52px)] font-bold leading-[.98] tracking-[-.055em]">Start in the portal that fits your role.</h2><p className="max-w-[58ch] leading-[1.6] text-brand-muted">Install the portal you use most, or open it directly in your browser.</p></div><div className="grid gap-4 md:grid-cols-2"><InstallCard /><InstallCard staff /></div><div className="mt-4"><InstallBanner /></div></section>
      <section id="features" className="mx-auto w-[min(1280px,calc(100%-32px))] py-[72px] md:pb-[110px]" aria-labelledby="features-heading"><div className="mb-9 max-w-[610px]"><p className="mb-4 text-xs font-bold uppercase tracking-[.13em] text-brand-blue">A shared record of what is happening</p><h2 id="features-heading" className="text-[clamp(32px,4vw,52px)] font-bold leading-[.98] tracking-[-.055em]">From first report to useful update.</h2></div><div className="grid border border-brand-line bg-brand-line md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article className="min-h-[190px] bg-brand-paper p-6" key={title}><Icon className="mb-6 text-brand-yellow" size={22} strokeWidth={1.8} /><h3 className="mb-2 text-lg tracking-[-.025em]">{title}</h3><p className="m-0 text-sm leading-[1.5] text-brand-muted">{text}</p></article>)}</div></section>
      <section id="how-it-works" className="bg-brand-navy text-white" aria-labelledby="process-heading"><div className="mx-auto grid w-[min(1280px,calc(100%-32px))] gap-10 py-[70px] md:grid-cols-[.8fr_1.2fr] md:gap-[100px] md:py-[100px]"><div><p className="mb-4 text-xs font-bold uppercase tracking-[.13em] text-[#ffe66b]">The response loop</p><h2 id="process-heading" className="text-[clamp(32px,4vw,52px)] font-bold leading-[.98] tracking-[-.055em]">A report becomes a shared next step.</h2></div><div className="border-t border-white/25">{steps.map(([title, text], index) => <div className="grid grid-cols-[52px_1fr] gap-6 border-b border-white/25 py-6" key={title}><span className="pt-1 text-xs text-[#ffe66b]">0{index + 1}</span><div><h3 className="mb-2 text-lg">{title}</h3><p className="m-0 text-sm leading-[1.5] text-blue-100">{text}</p></div></div>)}</div></div></section>
      <section className="mx-auto grid w-[min(1280px,calc(100%-32px))] gap-10 py-[65px] md:grid-cols-2 md:gap-[120px] md:py-[110px]" aria-labelledby="audience-heading"><div><p className="mb-4 text-xs font-bold uppercase tracking-[.13em] text-brand-blue">One system, three working views</p><h2 id="audience-heading" className="mb-5 text-[clamp(32px,4vw,52px)] font-bold leading-[.98] tracking-[-.055em]">Clearer handoffs for everyone involved.</h2><p className="max-w-[58ch] leading-[1.6] text-brand-muted">Each portal shows the information and actions that matter to that role, while keeping outage activity connected.</p></div><div className="border-t border-brand-line"><div className="flex gap-4 border-b border-brand-line py-5 text-brand-blue"><Users size={21} /><span className="grid gap-1"><strong className="text-brand-ink">Residents</strong><small className="text-[13px] leading-[1.45] text-brand-muted">Report, check the map, and follow your own reports.</small></span></div><div className="flex gap-4 border-b border-brand-line py-5 text-brand-blue"><LocateFixed size={21} /><span className="grid gap-1"><strong className="text-brand-ink">Field personnel</strong><small className="text-[13px] leading-[1.45] text-brand-muted">Receive assignments, verify conditions, and record progress.</small></span></div><div className="flex gap-4 border-b border-brand-line py-5 text-brand-blue"><ClipboardCheck size={21} /><span className="grid gap-1"><strong className="text-brand-ink">Administrators</strong><small className="text-[13px] leading-[1.45] text-brand-muted">Review incidents, coordinate dispatch, and monitor activity.</small></span></div></div></section>
      <section className="mx-auto grid w-[min(1280px,calc(100%-32px))] items-center gap-9 pb-20 md:grid-cols-[.75fr_1.25fr] md:gap-[70px] md:pb-[115px]" aria-labelledby="map-heading"><div><p className="mb-4 text-xs font-bold uppercase tracking-[.13em] text-brand-blue">See the local picture</p><h2 id="map-heading" className="mb-5 text-[clamp(32px,4vw,52px)] font-bold leading-[.98] tracking-[-.055em]">Outage information, grounded on a map.</h2><p className="max-w-[58ch] leading-[1.6] text-brand-muted">Use the Community Portal to view active and scheduled outage information and place a report where it happened.</p><a className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-navy px-[18px] text-sm font-bold text-white no-underline" href="/community#map">Open the outage map</a></div><MapPreview /></section>
      <section id="faq" className="mx-auto w-[min(1280px,calc(100%-32px))] pb-[75px] md:pb-[110px]" aria-labelledby="faq-heading"><div className="mb-9 max-w-[610px]"><p className="mb-4 text-xs font-bold uppercase tracking-[.13em] text-brand-blue">Questions people ask before they report</p><h2 id="faq-heading" className="text-[clamp(32px,4vw,52px)] font-bold leading-[.98] tracking-[-.055em]">Straight answers about PowerWatch.</h2></div><Faq /></section>
    </main>
    <footer className="bg-[#e8ebf5] pt-14"><div className="mx-auto grid w-[min(1280px,calc(100%-32px))] gap-10 pb-14 md:grid-cols-2 md:gap-20"><div><a className="mb-5 inline-flex items-center gap-2.5 text-[15px] tracking-[-.025em] no-underline" href="/"><img className="h-[37px] w-[37px] rounded-full object-contain" src={powerWatchLogo} alt="" /><span>Valencia <strong className="font-bold">PowerWatch</strong></span></a><p className="max-w-[39ch] text-[13px] leading-[1.55] text-brand-muted">PowerWatch records and coordinates reports. It does not directly restore electricity or control electrical equipment.</p></div><div className="grid grid-cols-2 gap-6"><div className="grid content-start gap-3"><strong className="text-xs uppercase tracking-[.1em] text-brand-blue">Portals</strong><a className="text-[13px] text-brand-muted no-underline hover:text-brand-ink" href="/community">Community Portal</a><a className="text-[13px] text-brand-muted no-underline hover:text-brand-ink" href="/staff">Staff Portal</a><a className="text-[13px] text-brand-muted no-underline hover:text-brand-ink" href="/admin">Administrator Portal</a></div><div className="grid content-start gap-3"><strong className="text-xs uppercase tracking-[.1em] text-brand-blue">More</strong><a className="text-[13px] text-brand-muted no-underline hover:text-brand-ink" href="mailto:[CONTACT_EMAIL]">[CONTACT_EMAIL]</a><a className="text-[13px] text-brand-muted no-underline hover:text-brand-ink" href="/privacy">Privacy</a><a className="text-[13px] text-brand-muted no-underline hover:text-brand-ink" href="/terms">Terms</a></div></div></div><div className="mx-auto flex w-[min(1280px,calc(100%-32px))] flex-wrap justify-between gap-3 border-t border-brand-line py-4 text-[11px] text-brand-muted"><span>© {new Date().getFullYear()} Valencia PowerWatch</span><span>Public service reporting tool</span></div></footer>
  </div>
}

export default LandingPage