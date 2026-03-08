import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import PrimaryButton from './PrimaryButton'

const QuizCard = ({ quiz, actionLabel, actionTo = '#' }) => {
  const { t } = useTranslation()

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">
        {quiz.quiz_type || t('academy.quiz')} | {quiz.difficulty || t('academy.medium')}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">{quiz.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{quiz.description || t('academy.noDescription')}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <p>{t('academy.subject')}: {quiz.subject || t('academy.general')}</p>
        <p>{t('academy.duration')}: {quiz.duration_minutes || 20} {t('academy.minutesShort')}</p>
        <p>{t('academy.totalMarks')}: {quiz.total_marks || 100}</p>
        <p>{t('academy.passMarks')}: {quiz.passing_marks || 40}</p>
      </div>
      <div className="mt-4">
        <PrimaryButton as={Link} to={actionTo}>
          {actionLabel || t('academy.open')}
        </PrimaryButton>
      </div>
    </div>
  )
}

export default QuizCard
