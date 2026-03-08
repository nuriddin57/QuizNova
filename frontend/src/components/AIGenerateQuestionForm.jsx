import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { listStudyFields } from '../api/fields'
import FieldSelectDropdown from './FieldSelectDropdown'
import PrimaryButton from './PrimaryButton'

const AIGenerateQuestionForm = ({ loading = false, onGenerate }) => {
  const { t } = useTranslation()
  const [fields, setFields] = useState([])
  const [form, setForm] = useState({
    field_of_study_id: '',
    subject: '',
    topic: '',
    difficulty: 'medium',
    number_of_questions: 5,
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await listStudyFields()
        if (mounted) setFields(data)
      } catch {
        if (mounted) setFields([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    onGenerate?.({
      ...form,
      field_of_study_id: form.field_of_study_id ? Number(form.field_of_study_id) : undefined,
      number_of_questions: Number(form.number_of_questions),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">{t('aiGenerator.formTitle')}</h3>
      <FieldSelectDropdown
        fields={fields}
        value={form.field_of_study_id}
        onChange={(next) => setForm((prev) => ({ ...prev, field_of_study_id: next }))}
      />
      <label className="block text-sm font-semibold text-slate-700">
        {t('academy.subject')}
        <input
          value={form.subject}
          onChange={update('subject')}
          placeholder="Algorithms"
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        {t('academy.topic')}
        <input
          value={form.topic}
          onChange={update('topic')}
          placeholder="Sorting algorithms"
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.difficulty')}
          <select value={form.difficulty} onChange={update('difficulty')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
            <option value="easy">{t('common.easy')}</option>
            <option value="medium">{t('common.medium')}</option>
            <option value="hard">{t('common.hard')}</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('aiGenerator.questionCount')}
          <input
            type="number"
            min={1}
            max={30}
            value={form.number_of_questions}
            onChange={update('number_of_questions')}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
          />
        </label>
      </div>
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? t('aiGenerator.generating') : t('aiGenerator.generate')}
      </PrimaryButton>
    </form>
  )
}

export default AIGenerateQuestionForm
