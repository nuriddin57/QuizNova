import { useTranslation } from 'react-i18next'

const RoleLoginSwitcher = ({ role = 'student', onChange }) => {
  const { t } = useTranslation()

  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange?.('student')}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          role === 'student' ? 'bg-primary-500 text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {t('auth.student')}
      </button>
      <button
        type="button"
        onClick={() => onChange?.('teacher')}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          role === 'teacher' ? 'bg-primary-500 text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {t('auth.teacher')}
      </button>
    </div>
  )
}

export default RoleLoginSwitcher
