import { useInstallPrompt } from '../../hooks/useInstallPrompt'

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt()
  if (!canInstall && !isInstalled && !isIOS) return null
  return <aside className="flex flex-col items-start justify-between gap-5 rounded-lg bg-brand-blue px-5 py-4 text-white sm:flex-row sm:items-center" aria-live="polite"><div><strong className="text-sm">{isInstalled ? 'PowerWatch is installed' : isIOS ? 'Install PowerWatch on iPhone' : 'Install PowerWatch'}</strong><p className="mt-1 mb-0 text-xs text-blue-100">{isInstalled ? 'Open the portal from your home screen for a focused experience.' : isIOS ? 'Use Share, then Add to Home Screen.' : 'Keep the portal close when you need it.'}</p></div>{isInstalled ? <a className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-bold text-brand-navy" href={window.location.pathname}>Open app</a> : !isIOS && <button className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-4 text-sm font-bold text-brand-navy sm:w-auto" type="button" onClick={promptInstall}>Install app</button>}</aside>
}
