import { useEffect } from 'react'
import Guard from './Guard'
import {
  defaultManifest,
  getSection,
  normalizePath,
  resolvePage,
  sectionManifest,
} from './routes'

function App() {
  const pathname = normalizePath(window.location.pathname)
  const section = getSection(pathname)

  // Page title, robots meta and PWA manifest
  useEffect(() => {
    document.title = section
      ? 'Valencia PowerWatch portal'
      : 'Power Outage Report Valencia City | Valencia PowerWatch'

    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = section ? 'noindex, nofollow' : 'index, follow'

    const manifestPath = section ? sectionManifest[section] : defaultManifest
    const existingManifest = document.querySelector('link[rel="manifest"]')
    if (!manifestPath) {
      existingManifest?.remove()
    } else if (!existingManifest) {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = manifestPath
      document.head.appendChild(link)
    } else if (existingManifest.getAttribute('href') !== manifestPath) {
      existingManifest.setAttribute('href', manifestPath)
    }
  }, [section])

  return (
    <Guard pathname={pathname} section={section}>
      {resolvePage(pathname, section)}
    </Guard>
  )
}

export default App