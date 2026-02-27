import i18n from '../i18n'

const getLocale = () => {
  const map = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' }
  return map[i18n.language] || 'en-US'
}

export const formatDate = (value, options = {}) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(getLocale(), options).format(date)
}

export const formatNumber = (value, options = {}) => new Intl.NumberFormat(getLocale(), options).format(value ?? 0)
