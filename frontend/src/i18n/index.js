import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en/translation.json'
import ru from '../locales/ru/translation.json'
import uz from '../locales/uz/translation.json'

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en']
const LANG_KEY = 'lang'

const detectInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en'

  const saved = window.localStorage.getItem(LANG_KEY)
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved

  const browser = (window.navigator.language || '').toLowerCase()
  const match = SUPPORTED_LANGUAGES.find((lng) => browser.startsWith(lng))
  return match || 'en'
}

const initialLanguage = detectInitialLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined' && SUPPORTED_LANGUAGES.includes(lng)) {
    window.localStorage.setItem(LANG_KEY, lng)
  }
})

export const setAppLanguage = (lng) => {
  if (!SUPPORTED_LANGUAGES.includes(lng)) return
  i18n.changeLanguage(lng)
}

export default i18n
