import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { listSubjects, listTopics } from '../api/subjects'
import TopicSelect from './TopicSelect'
import PrimaryButton from './PrimaryButton'

const defaultForm = {
  subject_ref: '',
  topic_ref: '',
  question_text: '',
  question_type: 'mcq',
  difficulty: 'medium',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  explanation: '',
  marks: 1,
}

const AddQuestionForm = ({ onSubmit, loading = false }) => {
  const { t } = useTranslation()
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    listSubjects({ is_active: true }).then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    if (!form.subject_ref) {
      setTopics([])
      return
    }
    listTopics({ subject_id: form.subject_ref }).then(setTopics).catch(() => setTopics([]))
  }, [form.subject_ref])

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const selectedSubject = subjects.find((item) => item.id === Number(form.subject_ref))
    const isTrueFalse = form.question_type === 'true_false'
    onSubmit?.({
      ...form,
      subject_ref: Number(form.subject_ref),
      topic_ref: form.topic_ref ? Number(form.topic_ref) : null,
      field_of_study: selectedSubject?.field_of_study,
      semester: selectedSubject?.semester,
      option_a: isTrueFalse ? 'True' : form.option_a,
      option_b: isTrueFalse ? 'False' : form.option_b,
      option_c: isTrueFalse ? '' : form.option_c,
      option_d: isTrueFalse ? '' : form.option_d,
      marks: Number(form.marks),
    })
    setForm(defaultForm)
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-slate-200 bg-white/95 p-5">
      <h3 className="text-lg font-semibold text-slate-900">{t('academy.addQuestionToBank')}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.subject')}
          <select value={form.subject_ref} onChange={update('subject_ref')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
            <option value="">{t('academy.selectSubject')}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
            ))}
          </select>
        </label>
        <TopicSelect topics={topics} value={form.topic_ref} onChange={(value) => setForm((prev) => ({ ...prev, topic_ref: value }))} />
      </div>
      <label className="block text-sm font-semibold text-slate-700">
        {t('academy.question')}
        <textarea value={form.question_text} onChange={update('question_text')} rows={3} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.type')}
          <select value={form.question_type} onChange={update('question_type')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
            <option value="mcq">{t('academy.multipleChoice')}</option>
            <option value="true_false">{t('academy.trueFalse')}</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.difficulty')}
          <select value={form.difficulty} onChange={update('difficulty')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input value={form.option_a} onChange={update('option_a')} placeholder={t('academy.optionA')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
        <input value={form.option_b} onChange={update('option_b')} placeholder={t('academy.optionB')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
        <input value={form.option_c} onChange={update('option_c')} placeholder={t('academy.optionC')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
        <input value={form.option_d} onChange={update('option_d')} placeholder={t('academy.optionD')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.correctAnswer')}
          <select value={form.correct_answer} onChange={update('correct_answer')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="TRUE">TRUE</option>
            <option value="FALSE">FALSE</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.marks')}
          <input type="number" min={1} value={form.marks} onChange={update('marks')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-slate-700">
        {t('academy.explanation')}
        <textarea value={form.explanation} onChange={update('explanation')} rows={2} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
      </label>
      <PrimaryButton type="submit" disabled={loading}>{loading ? t('academy.saving') : t('academy.saveQuestion')}</PrimaryButton>
    </form>
  )
}

export default AddQuestionForm
