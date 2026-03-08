import { HiMoon, HiSun } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import { setAppLanguage, SUPPORTED_LANGUAGES } from '../i18n'
import { useTheme } from '../providers/ThemeProvider'

const labels = { uz: 'UZ', ru: 'RU', en: 'EN' }

const LocaleThemeControl = ({ compact = false }) => {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`frost-panel flex items-center gap-2 rounded-2xl p-2 shadow-soft ${compact ? 'w-full justify-between' : ''}`}>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <span className="sr-only">{t('common.language')}</span>
        <select
          aria-label={t('common.language')}
          value={(i18n.resolvedLanguage || i18n.language || 'uz').split('-')[0]}
          onChange={(e) => setAppLanguage(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-300 dark:border-white/20 dark:bg-white/12 dark:text-slate-100 dark:focus:ring-cyan-300/50"
        >
          {SUPPORTED_LANGUAGES.map((lng) => (
            <option key={lng} value={lng}>{labels[lng]}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? t('common.light') : t('common.dark')}
        title={theme === 'dark' ? t('common.light') : t('common.dark')}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:border-white/20 dark:bg-white/12 dark:text-slate-100 dark:hover:border-cyan-300/55 dark:hover:text-cyan-100 dark:focus-visible:ring-cyan-300/50"
      >
        {theme === 'dark' ? <HiSun className="text-base" /> : <HiMoon className="text-base" />}
      </button>
    </div>
  )
}

export default LocaleThemeControl
