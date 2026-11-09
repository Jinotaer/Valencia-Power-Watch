import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LanguageContext,
  STORAGE_KEY,
  languages,
  localeFor,
  readStoredLanguage,
  translate,
} from '../../lib/i18n'
import { supabase } from '../../lib/supabase'

// Stops repeat failed requests until supabase/user.sql is re-run (without it
// PostgREST rejects the column with code 42703 and just logs noisy 400s).
let columnMissing = false

const syncLanguage = (code) => {
  if (!supabase || columnMissing) return
  supabase.auth
    .getSession()
    .then(({ data }) => {
      const userId = data.session?.user?.id
      if (!userId) return null
      return supabase.from('users').update({ language: code }).eq('id', userId)
    })
    .then((result) => {
      if (result?.error?.code === '42703') columnMissing = true
    })
    .catch(() => {})
}

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage)
  const locale = localeFor(language)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Adopt the account-level preference so the choice follows the user across
  // devices. The column is optional until supabase/user.sql is re-run.
  useEffect(() => {
    if (!supabase || columnMissing) return undefined
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const userId = data.session?.user?.id
        if (!userId) return null
        return supabase.from('users').select('language').eq('id', userId).maybeSingle()
      })
      .then((result) => {
        if (result?.error?.code === '42703') columnMissing = true
        const saved = result?.data?.language
        if (!active || !saved || !languages.some((entry) => entry.code === saved)) return
        setLanguageState(saved)
        try {
          localStorage.setItem(STORAGE_KEY, saved)
        } catch {
          // Private mode: the setting still applies for this session.
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const setLanguage = useCallback((code) => {
    if (!languages.some((entry) => entry.code === code)) return
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Private mode: the setting still applies for this session.
    }

    syncLanguage(code)
  }, [])

  const t = useCallback((key, vars) => translate(language, key, vars), [language])

  const value = useMemo(
    () => ({ language, locale, setLanguage, t }),
    [language, locale, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
