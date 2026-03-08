import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import ru from './locales/ru.json'
import uz from './locales/uz.json'

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en']
export const LANGUAGE_STORAGE_KEY = 'quiznova:language'

const normalizeLanguage = (value = '') => {
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return ''
  const match = SUPPORTED_LANGUAGES.find((language) => normalized === language || normalized.startsWith(`${language}-`))
  return match || ''
}

const detectInitialLanguage = () => {
  if (typeof window === 'undefined') return 'uz'

  const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
  if (stored) return stored

  const browserLanguage = normalizeLanguage(window.navigator.language)
  return browserLanguage || 'uz'
}

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined') return
  const normalized = normalizeLanguage(language)
  if (!normalized) return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized)
  document.documentElement.lang = normalized
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = normalizeLanguage(i18n.language) || 'uz'
}

export const setAppLanguage = (language) => {
  const normalized = normalizeLanguage(language)
  if (!normalized) return
  i18n.changeLanguage(normalized)
}

export default i18n
