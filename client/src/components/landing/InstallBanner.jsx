import { useInstallPrompt } from '../../hooks/useInstallPrompt'

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt()
  if (!canInstall && !isInstalled && !isIOS) return null

  const openHref = window.location.pathname === '/' ? '/login' : window.location.pathname

  return (
    <aside
      className="flex flex-col items-start justify-between gap-5 rounded-xl bg-brand-blue px-5 py-4 text-white sm:flex-row sm:items-center"
      aria-live="polite"
    >
      <div>
        <strong className="text-sm">
          {isInstalled
            ? 'PowerWatch is installed on this device'
            : isIOS
              ? 'Install PowerWatch on iPhone or iPad'
              : 'Install Valencia PowerWatch'}
        </strong>
        <p className="mt-1 mb-0 text-xs text-blue-100">
          {isInstalled
            ? 'Open the unified app to sign in as a Resident or Field Staff member.'
            : isIOS
              ? 'Tap Share in Safari, then choose Add to Home Screen.'
              : 'One lightweight app for both Residents and Field Staff with a shared login page.'}
        </p>
      </div>
      {isInstalled ? (
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-brand-navy no-underline transition-colors hover:bg-brand-paper"
          href={openHref}
        >
          Open app
        </a>
      ) : (
        !isIOS && (
          <button
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-paper sm:w-auto"
            type="button"
            onClick={promptInstall}
          >
            Install app
          </button>
        )
      )}
    </aside>
  )
}
