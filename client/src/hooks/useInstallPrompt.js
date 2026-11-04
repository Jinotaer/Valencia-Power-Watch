import { useEffect, useState } from 'react'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  const [isIOS] = useState(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true))
  useEffect(() => {
    const onBeforeInstallPrompt = (event) => { event.preventDefault(); setDeferredPrompt(event) }
    const onInstalled = () => { setDeferredPrompt(null); setIsInstalled(true) }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  async function promptInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }
  return { canInstall: Boolean(deferredPrompt), isInstalled, isIOS, promptInstall }
}
