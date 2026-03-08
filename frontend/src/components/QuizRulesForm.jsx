import { useTranslation } from 'react-i18next'

const QuizRulesForm = ({ form, onChange }) => {
  const { t } = useTranslation()
  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    onChange?.({ ...form, [key]: value })
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-semibold text-slate-900">{t('academy.quizRules')}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <input type="number" min={1} value={form.duration_minutes || 20} onChange={update('duration_minutes')} className="rounded-2xl border border-slate-200 px-4 py-2.5" placeholder="Duration" />
        <input type="number" min={1} value={form.total_marks || 100} onChange={update('total_marks')} className="rounded-2xl border border-slate-200 px-4 py-2.5" placeholder="Total marks" />
        <input type="number" min={0} value={form.passing_marks || 40} onChange={update('passing_marks')} className="rounded-2xl border border-slate-200 px-4 py-2.5" placeholder="Passing marks" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={!!form.randomize_questions} onChange={update('randomize_questions')} /> {t('academy.randomizeQuestions')}</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={!!form.randomize_options} onChange={update('randomize_options')} /> {t('academy.randomizeOptions')}</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={!!form.allow_retry} onChange={update('allow_retry')} /> {t('academy.allowRetry')}</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={!!form.show_answers_after_submit} onChange={update('show_answers_after_submit')} /> {t('academy.showAnswersAfterSubmit')}</label>
      </div>
    </div>
  )
}

export default QuizRulesForm
