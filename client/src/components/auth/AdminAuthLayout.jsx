import electricityIllustration from '../../assets/electricity.png'

export function AdminAuthLayout({ children }) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-clip bg-brand-paper px-4 py-8 text-brand-navy selection:bg-brand-yellow selection:text-brand-navy sm:px-6 sm:py-10 lg:p-12">
      {/* Decorative Faint Orbital Circles */}
      <div
        className="pointer-events-none absolute -left-44 -top-44 size-[640px] rounded-full border border-brand-line/80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-72 -right-44 size-[720px] rounded-full border border-brand-line/80"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center gap-2 sm:gap-4 md:flex-row md:justify-between md:gap-20 lg:gap-28 xl:gap-36">
        {/* Illustration: Visible on mobile stacked on top, and left side on desktop */}
        <div className="flex w-full max-w-[270px] sm:max-w-[320px] md:max-w-[440px] lg:max-w-[460px] flex-col items-center justify-center select-none -mb-2 sm:-mb-3 md:mb-0">
          <img
            src={electricityIllustration}
            alt="Power transmission tower with a lightning bolt"
            className="w-full max-h-[250px] sm:max-h-[290px] md:max-h-[440px] object-contain drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
          />
        </div>

        {/* Login Card: Sized for both mobile and desktop screens */}
        <div className="w-full max-w-[380px] sm:max-w-[430px] md:max-w-[450px] shrink-0">
          {children}
        </div>
      </div>
    </main>
  )
}
