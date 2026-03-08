import { useTranslation } from 'react-i18next'

import TopicSelect from './TopicSelect'

const QuizBuilder = ({ subjects = [], topics = [], modules = [], form, onChange }) => {
  const { t } = useTranslation()
  const update = (key) => (event) => onChange?.({ ...form, [key]: event.target.value })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">
        {t('academy.subject')}
        <select value={form.subject_ref || ''} onChange={update('subject_ref')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
          <option value="">{t('academy.selectSubject')}</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
          ))}
        </select>
      </label>
      <TopicSelect topics={topics} value={form.topic_ref || ''} onChange={(value) => onChange?.({ ...form, topic_ref: value, module_ref: '' })} />
      <label className="text-sm font-semibold text-slate-700">
        {t('academy.moduleLabel')}
        <select value={form.module_ref || ''} onChange={update('module_ref')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
          <option value="">{t('academy.selectModule')}</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>{module.title}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {t('academy.title')}
        <input value={form.title || ''} onChange={update('title')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {t('academy.unitModule')}
        <input value={form.unit_name || ''} onChange={update('unit_name')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
      </label>
    </div>
  )
}

export default QuizBuilder
