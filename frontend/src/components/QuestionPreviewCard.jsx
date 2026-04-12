import { useTranslation } from 'react-i18next'

import SecondaryButton from './SecondaryButton'

const QuestionPreviewCard = ({ question, index, onChange, onDelete, onRegenerate, regenerating = false }) => {
  const { t } = useTranslation()
  const normalizedType = question.question_type || question.type
  const optionLabels = normalizedType === 'true_false'
    ? ['True', 'False']
    : (question.options || []).map((_, optionIndex) => String.fromCharCode(65 + optionIndex))

  const updateOption = (optionIndex, value) => {
    const nextOptions = [...(question.options || [])]
    nextOptions[optionIndex] = value
    onChange?.({ ...question, options: nextOptions })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-900">{t('questionPreview.title', { index: index + 1 })}</h4>
        <div className="flex items-center gap-2">
          {onRegenerate ? (
            <SecondaryButton type="button" onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? t('aiGenerator.regeneratingQuestion') : t('aiGenerator.regenerateQuestion')}
            </SecondaryButton>
          ) : null}
          <SecondaryButton type="button" onClick={onDelete}>
            {t('academy.delete')}
          </SecondaryButton>
        </div>
      </div>

      <label className="mt-3 block text-sm font-semibold text-slate-700">
        {t('questionPreview.questionText')}
        <textarea
          value={question.question_text || ''}
          onChange={(e) => onChange?.({ ...question, question_text: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
        />
      </label>

      <div className="mt-3 grid gap-2">
        {(question.options || []).map((option, optionIndex) => (
          <label key={optionIndex} className="text-sm text-slate-700">
            {t('questionPreview.optionLabel', { label: optionLabels[optionIndex] || String.fromCharCode(65 + optionIndex) })}
            <input
              value={option}
              onChange={(e) => updateOption(optionIndex, e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.correctAnswer')}
          <select
            value={question.correct_answer_index ?? 0}
            onChange={(e) => onChange?.({ ...question, correct_answer_index: Number(e.target.value) })}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
          >
            {(question.options || []).map((_, optionIndex) => (
              <option key={optionIndex} value={optionIndex}>
                {optionLabels[optionIndex] || String.fromCharCode(65 + optionIndex)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('questionPreview.explanationOptional')}
          <input
            value={question.explanation || ''}
            onChange={(e) => onChange?.({ ...question, explanation: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
          />
        </label>
      </div>
    </div>
  )
}

export default QuestionPreviewCard
