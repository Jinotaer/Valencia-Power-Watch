import { createContext, useContext } from 'react'
import bce from './locales/bce.js'
import fil from './locales/fil.js'

export const STORAGE_KEY = 'pw:language'

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'fil', label: 'Filipino' },
  { code: 'bce', label: 'Bisaya' },
]

const dictionaries = { fil, bce }

const localeByLanguage = {
  en: 'en-PH',
  fil: 'fil-PH',
  bce: 'ceb-PH',
}

export function localeFor(language) {
  return localeByLanguage[language] ?? 'en-PH'
}

export function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return languages.some((language) => language.code === stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

// Keys are the English source strings, so a missing translation falls back to
// readable English instead of a blank label.
export function translate(language, key, vars) {
  let text = dictionaries[language]?.[key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

const fallback = {
  language: 'en',
  locale: 'en-PH',
  setLanguage: () => {},
  t: (key) => key,
}

export const LanguageContext = createContext(fallback)

export function useLanguage() {
  return useContext(LanguageContext)
}
