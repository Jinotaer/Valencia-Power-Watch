import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  Image as ImageIcon,
  Info,
  Lightbulb,
  LocateFixed,
  MoreHorizontal,
  Plus,
  Power,
  Send,
  TowerControl,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'

const valenciaBarangays = [
  'Guinoyuran',
  'Poblacion',
  'Bagontapay',
  'Bantuanon',
  'Barobo',
  'Batangan',
  'Catumbalon',
  'Colonia',
  'Concepcion',
  'Dagat-Kidavao',
  'Dampas',
  'Datu Salumay',
  'Kahaponan',
  'Laligan',
  'Lilingayon',
  'Lourdes',
  'Lumbayao',
  'Lumbo',
  'Lurugan',
  'Mabuhay',
  'Mailag',
  'Mt. Nebo',
  'Musuan',
  'Pinatilan',
  'San Carlos',
  'San Isidro',
  'Sinayawan',
  'Sugod',
  'Tongantongan',
  'Tugaya',
  'Vintar',
]

const outageTypes = [
  { id: 'no-power', label: 'No power', icon: Power },
  { id: 'flickering', label: 'Flickering lights', icon: Lightbulb },
  { id: 'damaged-line', label: 'Damaged line or pole', icon: AlertTriangle },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

const timeOptions = ['Just now', 'Within 1 hour', 'Earlier today']

export default function SubmitReport() {
  const [step, setStep] = useState(1) // 1, 2, 3, 4, or 5 (success)

  // Form State
  const [outageType, setOutageType] = useState('no-power')
  const [startedTime, setStartedTime] = useState('Just now')
  const [description, setDescription] = useState('')

  const [barangay, setBarangay] = useState('Guinoyuran')
  const [landmark, setLandmark] = useState('')
  const [pinLocation, setPinLocation] = useState({ x: 50, y: 50 })
  const [isLocating, setIsLocating] = useState(false)

  // Photos state (initial demo photos matching screenshot)
  const [photos, setPhotos] = useState([
    { id: 1, type: 'pole', label: 'Line / pole photo' },
    { id: 2, type: 'meter', label: 'House / meter photo' },
  ])
  const fileInputRef = useRef(null)

  const [confirmed, setConfirmed] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportReference, setReportReference] = useState('')

  const stepTitles = {
    1: 'Details',
    2: 'Location',
    3: 'Evidence',
    4: 'Review',
  }

  // Handle Current Location
  const handleUseCurrentLocation = () => {
    setIsLocating(true)
    setTimeout(() => {
      setIsLocating(false)
      setPinLocation({ x: 52, y: 48 })
      if (!landmark) setLandmark('Purok 3, Near Barangay Hall')
    }, 600)
  }

  // Handle Photo Upload
  const handleAddPhoto = (e) => {
    const file = e.target.files?.[0]
    if (file && photos.length < 3) {
      const newPhoto = {
        id: Date.now(),
        type: 'custom',
        url: URL.createObjectURL(file),
        label: file.name,
      }
      setPhotos([...photos, newPhoto])
    }
  }

  const handleRemovePhoto = (id) => {
    setPhotos(photos.filter((p) => p.id !== id))
  }

  // Handle Submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!confirmed) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setReportReference(`PW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
      setStep(5)
    }, 800)
  }

  // SUCCESS SCREEN
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-[#172b68] flex flex-col justify-between">
        <header className="sticky top-0 z-20 border-b border-[#e2eaf4] bg-white px-4 py-3.5">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <span className="text-sm font-extrabold text-[#172b68]">Report Submitted</span>
            <a href="/community" className="text-slate-400 hover:text-slate-600">
              <X className="size-5" />
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-md p-5 flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4 flex size-20 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d] shadow-sm">
            <Check className="size-10 stroke-[3]" />
          </div>

          <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-bold text-[#24449a]">
            Reference: {reportReference}
          </span>

          <h1 className="mt-3 text-2xl font-black text-[#172b68] tracking-tight">
            Thank you for reporting!
          </h1>
          <p className="mt-2 text-xs text-[#58708a] max-w-xs leading-relaxed">
            Your report in <strong>Brgy. {barangay}</strong> has been received and queued for dispatch verification.
          </p>

          <div className="mt-6 w-full rounded-2xl border border-[#e2eaf4] bg-white p-4 text-left shadow-xs space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Issue</span>
              <strong className="text-slate-800">{outageTypes.find((t) => t.id === outageType)?.label}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Barangay</span>
              <strong className="text-slate-800">{barangay}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Pending Verification</span>
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col gap-2.5">
            <a
              href="/community/reports"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1b3d8f] text-sm font-bold text-white shadow-xs hover:bg-[#142e6d] transition-all"
            >
              Track report status
              <ArrowRight className="size-4" />
            </a>
            <a
              href="/community"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Back to home
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#172b68] flex flex-col justify-between">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAddPhoto}
        className="hidden"
      />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#e2eaf4] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : (window.location.href = '/community'))}
            className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-extrabold text-[#172b68]">Report an interruption</h1>
            <p className="text-[11px] font-semibold text-[#58708a]">
              Step {step} of 4 · {stepTitles[step]}
            </p>
          </div>

          <a
            href="/community"
            className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="size-5" />
          </a>
        </div>

        {/* STEPPER PROGRESS BAR */}
        <div className="mx-auto max-w-md pt-3 pb-1 px-3">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute left-4 right-4 top-3.5 h-[2px] bg-[#dbe5f2] -z-0" />
            <div
              className="absolute left-4 top-3.5 h-[2px] bg-[#1b3d8f] transition-all duration-300 -z-0"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[1, 2, 3, 4].map((s) => {
              const isActive = step === s
              const isDone = step > s

              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#ffd500] text-[#172b68] ring-2 ring-white shadow-xs scale-110 font-extrabold'
                        : isDone
                        ? 'bg-[#1b3d8f] text-white'
                        : 'bg-white border-2 border-[#dbe5f2] text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="size-3.5 stroke-[3]" /> : s}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-bold ${
                      isActive ? 'text-[#172b68]' : isDone ? 'text-[#1b3d8f]' : 'text-slate-400'
                    }`}
                  >
                    {stepTitles[s]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* FORM CONTENT CONTAINER */}
      <main className="mx-auto w-full max-w-md px-4 py-5 flex-1">
        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            {/* Outage Type Grid */}
            <section>
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#60748e]">
                What is happening?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {outageTypes.map(({ id, label, icon: Icon }) => {
                  const isSelected = outageType === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOutageType(id)}
                      className={`relative flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl p-3.5 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#1b3d8f] bg-[#f2f7ff] shadow-[0_4px_16px_rgba(27,61,143,0.08)]'
                          : 'border border-[#dce6f2] bg-white hover:border-[#b8cde6] hover:bg-slate-50'
                      }`}
                    >
                      {/* Check badge on selected */}
                      {isSelected && (
                        <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-[#1b3d8f] text-white">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}
                      <Icon
                        className={`size-6 ${
                          isSelected ? 'text-[#1b3d8f]' : 'text-[#24449a]'
                        }`}
                      />
                      <span className="text-xs font-extrabold text-[#172b68] leading-tight">
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Time Selector */}
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#60748e]">
                When did it start?
              </h2>
              <div className="flex gap-2">
                {timeOptions.map((time) => {
                  const isSelected = startedTime === time
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setStartedTime(time)}
                      className={`flex-1 rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1b3d8f] text-white shadow-xs'
                          : 'border border-[#dce6f2] bg-white text-[#172b68] hover:bg-slate-50'
                      }`}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Description Textarea */}
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#60748e]">
                Description (Optional)
              </h2>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details that help the response team"
                className="w-full rounded-2xl border border-[#dce6f2] bg-white p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1b3d8f] focus:outline-none"
              />
            </section>

            {/* Safety Caution Box */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#ffec99] bg-[#fff9db] p-3.5 text-[11px] leading-relaxed text-[#744210]">
              <AlertTriangle className="size-4 shrink-0 text-[#b45309] mt-0.5" />
              <span>
                Fallen wire or sparks? Keep away from it and call your local emergency number.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Stylized Interactive Map Preview */}
            <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-[#dce6f2] bg-[#eaf2fb] shadow-inner">
              <svg className="w-full h-full" viewBox="0 0 300 170" preserveAspectRatio="none">
                {/* Land Parcels */}
                <rect x="20" y="20" width="40" height="30" rx="4" fill="#d7e2ed" />
                <rect x="80" y="20" width="50" height="40" rx="4" fill="#d7e2ed" />
                <rect x="220" y="30" width="60" height="40" rx="4" fill="#d8e8dc" />
                <rect x="230" y="110" width="50" height="35" rx="4" fill="#d7e2ed" />

                {/* White Roads */}
                <path d="M -10,80 L 310,75" stroke="#ffffff" strokeWidth="16" fill="none" />
                <path d="M 150,-10 L 145,180" stroke="#ffffff" strokeWidth="16" fill="none" />
                <path d="M 60,-10 L 60,180" stroke="#ffffff" strokeWidth="10" fill="none" />
                <path d="M 230,-10 L 225,180" stroke="#ffffff" strokeWidth="12" fill="none" />
                <path d="M -10,135 L 310,135" stroke="#ffffff" strokeWidth="12" fill="none" />
              </svg>

              {/* Center Target Ring */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all"
                style={{ left: `${pinLocation.x}%`, top: `${pinLocation.y}%` }}
              >
                <div className="grid size-16 place-items-center rounded-full bg-[#24449a]/15 border border-[#24449a]/30">
                  {/* Pin Marker */}
                  <div className="grid size-9 place-items-center rounded-full bg-[#ffdc00] border-2 border-[#172b68] shadow-md animate-bounce">
                    <div className="size-2.5 rounded-full bg-[#172b68]" />
                  </div>
                </div>
              </div>

              {/* Floating Pin Hint */}
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#172b68] shadow-sm backdrop-blur-xs">
                Drag the pin to adjust
              </span>
            </div>

            {/* Use My Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#dce6f2] bg-white text-xs font-bold text-[#1b3d8f] shadow-xs hover:bg-[#f6f9fc] active:scale-[0.99] transition-all cursor-pointer"
            >
              <LocateFixed className={`size-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use my current location'}</span>
            </button>

            {/* Barangay Dropdown */}
            <section>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#60748e]">
                Barangay
              </label>
              <div className="relative">
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-[#dce6f2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#172b68] shadow-xs focus:border-[#1b3d8f] focus:outline-none cursor-pointer"
                >
                  {valenciaBarangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </section>

            {/* Street or Landmark Input */}
            <section>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#60748e]">
                Street or landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g., near the chapel, Purok 3"
                className="w-full rounded-2xl border border-[#dce6f2] bg-white px-3.5 py-2.5 text-xs text-[#172b68] shadow-xs placeholder:text-slate-400 focus:border-[#1b3d8f] focus:outline-none font-medium"
              />
            </section>

            {/* GPS Accuracy Notice */}
            <div className="flex items-start gap-1.5 text-[11px] text-[#58708a] leading-relaxed">
              <Info className="size-3.5 shrink-0 text-slate-400 mt-0.5" />
              <span>
                GPS accuracy is about 15 m. The location is approximate, so adjust the pin if it looks off.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs text-[#58708a] leading-relaxed">
              Photos help the team verify your report faster. This step is optional.
            </p>

            {/* Action Buttons: Take Photo & Upload */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b8cde6] bg-white p-5 text-center transition-all hover:bg-[#f6f9fc] active:scale-[0.98] cursor-pointer"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-[#edf4ff] text-[#1b3d8f]">
                  <Camera className="size-5" />
                </div>
                <span className="text-xs font-bold text-[#1b3d8f]">Take photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b8cde6] bg-white p-5 text-center transition-all hover:bg-[#f6f9fc] active:scale-[0.98] cursor-pointer"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-[#edf4ff] text-[#1b3d8f]">
                  <ImageIcon className="size-5" />
                </div>
                <span className="text-xs font-bold text-[#1b3d8f]">Upload photo</span>
              </button>
            </div>

            {/* Added Photos Grid */}
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#60748e]">
                Added ({photos.length} of 3)
              </h2>
              <div className="flex items-center gap-3">
                {photos.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex size-20 items-center justify-center rounded-2xl border border-[#dce6f2] bg-[#edf4ff] text-[#1b3d8f] shadow-xs"
                  >
                    {item.type === 'pole' && <TowerControl className="size-8" />}
                    {item.type === 'meter' && <House className="size-8" />}
                    {item.type === 'custom' && (
                      <img
                        src={item.url}
                        alt="Uploaded evidence"
                        className="size-full rounded-2xl object-cover"
                      />
                    )}

                    {/* Remove Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(item.id)}
                      className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-white border border-slate-300 text-slate-500 shadow-xs hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}

                {/* Add Another Slot */}
                {photos.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="grid size-20 place-items-center rounded-2xl border-2 border-dashed border-[#c6d7eb] text-[#24449a] hover:bg-slate-50 cursor-pointer"
                    aria-label="Add photo"
                  >
                    <Plus className="size-6" />
                  </button>
                )}
              </div>
            </section>

            {/* Privacy Guidance Box */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#d6e5fb] bg-[#edf4ff] p-3.5 text-[11px] leading-relaxed text-[#1b3d8f]">
              <Info className="size-4 shrink-0 text-[#24449a] mt-0.5" />
              <span>
                Show the transformer, lines or your meter if you can. Avoid faces and license plates.
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Details Summary Card */}
            <div className="rounded-2xl border border-[#dce6f2] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-[#172b68]">Details</h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-[#1b3d8f] hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <strong className="text-slate-800">
                    {outageTypes.find((t) => t.id === outageType)?.label}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Started</span>
                  <strong className="text-slate-800">{startedTime}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Notes</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                    {description || 'Whole street is dark since 8:30 AM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Summary Card */}
            <div className="rounded-2xl border border-[#dce6f2] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-[#172b68]">Location</h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-[#1b3d8f] hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Barangay</span>
                  <strong className="text-slate-800">{barangay}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Landmark</span>
                  <strong className="text-slate-800">
                    {landmark || 'Near the chapel, Purok 3'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pin</span>
                  <strong className="text-slate-800">GPS, about 15 m</strong>
                </div>
              </div>
            </div>

            {/* Evidence Summary Card */}
            <div className="rounded-2xl border border-[#dce6f2] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-[#172b68]">Evidence</h3>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-[#1b3d8f] hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {photos.map((item) => (
                    <div
                      key={item.id}
                      className="grid size-9 place-items-center rounded-xl bg-[#edf4ff] text-[#1b3d8f]"
                    >
                      {item.type === 'pole' && <TowerControl className="size-4.5" />}
                      {item.type === 'meter' && <House className="size-4.5" />}
                      {item.type === 'custom' && (
                        <img src={item.url} alt="" className="size-full rounded-xl object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {photos.length} photos attached
                </span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 pt-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="size-4 rounded border-slate-300 text-[#1b3d8f] accent-[#1b3d8f] mt-0.5 cursor-pointer"
              />
              <span>I confirm this information is accurate to the best of my knowledge.</span>
            </label>
          </div>
        )}
      </main>

      {/* STICKY FOOTER ACTIONS */}
      <footer className="sticky bottom-0 z-20 border-t border-[#e2eaf4] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {/* Back or Cancel Button */}
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : (window.location.href = '/community'))}
            className="flex-1 rounded-2xl border border-[#dce6f2] bg-white py-3 text-xs font-bold text-[#172b68] hover:bg-[#f6f9fc] active:scale-[0.99] transition-all cursor-pointer"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {/* Next or Submit Button */}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex-1 rounded-2xl bg-[#1b3d8f] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#142e6d] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!confirmed || isSubmitting}
              onClick={handleSubmit}
              className={`flex-1 rounded-2xl py-3 text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                confirmed && !isSubmitting
                  ? 'bg-[#ffd500] text-[#172b68] hover:bg-[#ffdc00] active:scale-[0.99]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="size-3.5 fill-current" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit report'}</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

