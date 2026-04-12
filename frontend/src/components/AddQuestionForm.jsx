import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { analyzeQuestionDraft } from '../api/ai'
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
  const isTrueFalse = form.question_type === 'true_false'
  const [analysis, setAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

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

  const update = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => {
      if (key === 'question_type') {
        if (value === 'true_false') {
          return {
            ...prev,
            question_type: value,
            option_a: 'True',
            option_b: 'False',
            option_c: '',
            option_d: '',
            correct_answer: prev.correct_answer === 'FALSE' ? 'FALSE' : 'TRUE',
          }
        }
        return {
          ...prev,
          question_type: value,
          option_a: prev.option_a === 'True' ? '' : prev.option_a,
          option_b: prev.option_b === 'False' ? '' : prev.option_b,
          correct_answer: ['TRUE', 'FALSE'].includes(prev.correct_answer) ? 'A' : prev.correct_answer,
        }
      }
      return { ...prev, [key]: value }
    })
  }

  const submit = (event) => {
    event.preventDefault()
    const selectedSubject = subjects.find((item) => item.id === Number(form.subject_ref))
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
    setAnalysis(null)
    setForm(defaultForm)
  }

  const handleAnalyze = async () => {
    if (!form.question_text.trim()) {
      toast.error(t('academy.analysisQuestionRequired'))
      return
    }
    setAnalysisLoading(true)
    try {
      const payload = {
        question_text: form.question_text,
        question_type: form.question_type,
        options: isTrueFalse ? ['True', 'False'] : [form.option_a, form.option_b, form.option_c, form.option_d],
        correct_answer: form.correct_answer,
        explanation: form.explanation,
      }
      const data = await analyzeQuestionDraft(payload)
      setAnalysis(data)
    } finally {
      setAnalysisLoading(false)
    }
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
            <option value="easy">{t('common.easy')}</option>
            <option value="medium">{t('common.medium')}</option>
            <option value="hard">{t('common.hard')}</option>
          </select>
        </label>
      </div>
      {isTrueFalse ? (
        <div className="grid gap-3 md:grid-cols-2">
          <input value={t('common.true')} readOnly className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600" />
          <input value={t('common.false')} readOnly className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <input value={form.option_a} onChange={update('option_a')} placeholder={t('academy.optionA')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
          <input value={form.option_b} onChange={update('option_b')} placeholder={t('academy.optionB')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
          <input value={form.option_c} onChange={update('option_c')} placeholder={t('academy.optionC')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
          <input value={form.option_d} onChange={update('option_d')} placeholder={t('academy.optionD')} className="rounded-2xl border border-slate-200 px-4 py-2.5" />
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-sm font-semibold text-slate-700">
          {t('academy.correctAnswer')}
          <select value={form.correct_answer} onChange={update('correct_answer')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
            {isTrueFalse ? (
              <>
                <option value="TRUE">{t('common.true')}</option>
                <option value="FALSE">{t('common.false')}</option>
              </>
            ) : (
              <>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </>
            )}
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
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analysisLoading}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {analysisLoading ? t('academy.analysisLoading') : t('academy.analyzeQuestion')}
        </button>
        <PrimaryButton type="submit" disabled={loading}>{loading ? t('academy.saving') : t('academy.saveQuestion')}</PrimaryButton>
      </div>
      {analysis ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">{t('academy.analysisTitle')}</p>
              <p className="mt-1 text-sm text-slate-600">{analysis.summary}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-2 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('academy.analysisScore')}</p>
              <p className="text-2xl font-bold text-slate-900">{analysis.quality_score}/100</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-emerald-700">{t('academy.analysisStrengths')}</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {(analysis.strengths || []).length ? analysis.strengths.map((item) => <li key={item}>• {item}</li>) : <li>• {t('academy.analysisNoStrengths')}</li>}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700">{t('academy.analysisIssues')}</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {(analysis.issues || []).length ? analysis.issues.map((item) => <li key={item}>• {item}</li>) : <li>• {t('academy.analysisNoIssues')}</li>}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-700">{t('academy.analysisSuggestions')}</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {(analysis.suggestions || []).length ? analysis.suggestions.map((item) => <li key={item}>• {item}</li>) : <li>• {t('academy.analysisNoSuggestions')}</li>}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  )
}

export default AddQuestionForm
