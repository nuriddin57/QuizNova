import { HiMoon, HiSun } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import { setAppLanguage, SUPPORTED_LANGUAGES } from '../i18n'
import { useTheme } from '../providers/ThemeProvider'

const labels = { uz: 'UZ', ru: 'RU', en: 'EN' }

const LocaleThemeControl = ({ compact = false }) => {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`flex items-center gap-2 rounded-2xl border border-white/60 bg-white/80 p-2 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 ${compact ? 'w-full justify-between' : ''}`}>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-200">
        <span className="sr-only">{t('common.language')}</span>
        <select
          aria-label={t('common.language')}
          value={i18n.language}
          onChange={(e) => setAppLanguage(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        {theme === 'dark' ? <HiSun className="text-base" /> : <HiMoon className="text-base" />}
      </button>
    </div>
  )
}

export default LocaleThemeControl
