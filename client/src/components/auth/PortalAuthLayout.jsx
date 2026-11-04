import electricityIllustration from '../../assets/electricity.png'

export function PortalAuthLayout({ children }) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-clip bg-[#f3f5ff] px-4 py-8 text-[#101b4f] selection:bg-[#ffe000] selection:text-[#101b4f] sm:px-6 sm:py-10 lg:p-8">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full border border-[#d6def7]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-64 -right-36 size-[580px] rounded-full border border-[#d6def7]" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center gap-2 sm:gap-4 md:-translate-y-10 md:flex-row md:justify-between md:gap-20 lg:gap-28 xl:gap-36">
        <div className="flex w-full max-w-[270px] flex-col items-center justify-center select-none -mb-2 sm:max-w-[320px] sm:-mb-3 md:mb-0 md:max-w-[440px] md:flex-1 lg:max-w-[460px]">
          <img
            src={electricityIllustration}
            alt="Power transmission tower with a lightning bolt"
            className="w-full max-h-[250px] object-contain drop-shadow-sm transition-transform duration-300 hover:scale-[1.01] sm:max-h-[290px] md:max-h-[440px]"
          />
        </div>
        <div className="w-full max-w-[380px] shrink-0 sm:max-w-[430px] md:max-w-[450px]">{children}</div>
      </div>
    </main>
  )
}
