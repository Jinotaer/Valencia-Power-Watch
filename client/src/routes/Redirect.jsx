import { useEffect } from 'react'

// Full-page redirect for retired URLs (hard navigation, like every link here).
export default function Redirect({ to }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])
  return null
}
