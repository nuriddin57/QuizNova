import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enBase from './locales/en.json'
import localeOverrides from './locales/overrides'
import ruBase from './locales/ru.json'
import uzBase from './locales/uz.json'
import enTranslation from './locales/en/translation.json'
import ruTranslation from './locales/ru/translation.json'
import uzTranslation from './locales/uz/translation.json'

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en']
export const LANGUAGE_STORAGE_KEY = 'quiznova:language'

const normalizeLanguage = (value = '') => {
  const normalized = String(value).trim().toLowerCase()
  if (!normalized) return ''
  const match = SUPPORTED_LANGUAGES.find((language) => normalized === language || normalized.startsWith(`${language}-`))
  return match || ''
}

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

const mergeTranslations = (base, extended) => {
  if (!isObject(base)) return extended
  if (!isObject(extended)) return base

  const merged = { ...base }
  for (const [key, value] of Object.entries(extended)) {
    merged[key] = isObject(value) && isObject(base[key]) ? mergeTranslations(base[key], value) : value
  }
  return merged
}

const en = mergeTranslations(mergeTranslations(enBase, enTranslation), localeOverrides.en)
const ru = mergeTranslations(mergeTranslations(ruBase, ruTranslation), localeOverrides.ru)
const uz = mergeTranslations(mergeTranslations(uzBase, uzTranslation), localeOverrides.uz)

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
