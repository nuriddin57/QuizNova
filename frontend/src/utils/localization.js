const normalizeLanguage = (language = '') => {
  const value = String(language || '').trim().toLowerCase()
  if (!value) return ''
  const [base] = value.split('-')
  return base || ''
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const firstNonEmpty = (...values) => values.find((value) => isNonEmptyString(value))

export const getLocalizedField = (item, field, language, fallbackLang = 'en') => {
  if (!item || typeof item !== 'object' || !field) return ''

  const lang = normalizeLanguage(language)
  const fallback = normalizeLanguage(fallbackLang)

  const directLocalized = firstNonEmpty(
    item[`${field}_${lang}`],
    item[`${field}_${fallback}`]
  )
  if (directLocalized) return directLocalized

  const nested = item[field]
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const nestedLocalized = firstNonEmpty(
      nested[lang],
      nested[fallback],
      nested.en,
      nested.uz,
      nested.ru
    )
    if (nestedLocalized) return nestedLocalized
  }

  const translations = item.translations
  if (translations && typeof translations === 'object') {
    const fieldTranslations = translations[field]
    if (fieldTranslations && typeof fieldTranslations === 'object') {
      const translated = firstNonEmpty(
        fieldTranslations[lang],
        fieldTranslations[fallback],
        fieldTranslations.en,
        fieldTranslations.uz,
        fieldTranslations.ru
      )
      if (translated) return translated
    }
  }

  return firstNonEmpty(item[field], item[`${field}_en`], item[`${field}_uz`], item[`${field}_ru`]) || ''
}

