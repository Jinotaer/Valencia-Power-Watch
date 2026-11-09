import { useEffect, useState } from 'react'

let sharedPrompt = null
const listeners = new Set()

function notifyListeners() {
  listeners.forEach((listener) => listener(sharedPrompt))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    sharedPrompt = event
    notifyListeners()
  })
  window.addEventListener('appinstalled', () => {
    sharedPrompt = null
    notifyListeners()
  })
}

function checkStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => sharedPrompt)
  const [isInstalled, setIsInstalled] = useState(checkStandalone)
  const [isIOS] = useState(
    () =>
      typeof window !== 'undefined' &&
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
      !checkStandalone(),
  )

  useEffect(() => {
    const onPromptChange = (nextPrompt) => {
      setDeferredPrompt(nextPrompt)
    }
    const onInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = (event) => {
      if (event.matches) setIsInstalled(true)
    }

    listeners.add(onPromptChange)
    window.addEventListener('appinstalled', onInstalled)
    mediaQuery.addEventListener?.('change', onDisplayModeChange)

    return () => {
      listeners.delete(onPromptChange)
      window.removeEventListener('appinstalled', onInstalled)
      mediaQuery.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [])

  async function promptInstall() {
    if (!sharedPrompt) return false
    await sharedPrompt.prompt()
    const choice = await sharedPrompt.userChoice
    if (choice?.outcome === 'accepted') {
      sharedPrompt = null
      notifyListeners()
      return true
    }
    return false
  }

  return {
    canInstall: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    promptInstall,
  }
}
