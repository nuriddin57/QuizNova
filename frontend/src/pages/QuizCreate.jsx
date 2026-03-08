import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { listStudyFields } from '../api/fields'
import { listModules, listSubjects, listTopics } from '../api/subjects'
import { createQuiz, getQuizById, updateQuiz } from '../api/quizzes'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import QuizBuilder from '../components/QuizBuilder'
import QuizRulesForm from '../components/QuizRulesForm'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isTeacherRole } from '../utils/role'

const QUIZ_TYPE_VALUES = ['practice', 'live', 'class_test', 'midterm', 'final', 'exam', 'assignment', 'timed_test']

const QuizCreate = () => {
  const { t } = useTranslation()
  const { role, loading } = useAuth()
  const [params] = useSearchParams()
  const quizId = params.get('quizId')
  const isEdit = Boolean(quizId)
  const [fields, setFields] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [modules, setModules] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    subject_ref: '',
    topic_ref: '',
    module_ref: '',
    category: '',
    semester: 1,
    unit_name: '',
    difficulty: 'medium',
    quiz_type: 'practice',
    duration_minutes: 20,
    total_marks: 100,
    passing_marks: 40,
    randomize_questions: false,
    randomize_options: false,
    allow_retry: false,
    show_answers_after_submit: false,
    is_published: false,
    apply_to_all_fields: false,
    target_field_of_study: '',
    target_semester_code: '',
    target_semester_number: '',
    target_section: '',
    assigned_fields: [],
    strict_structure: false,
    visibility: 'private',
    questions: [],
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [fieldData, subjectData] = await Promise.all([listStudyFields(), listSubjects({ is_active: true })])
        if (mounted) {
          setFields(fieldData)
          setSubjects(subjectData)
        }
      } catch {
        if (mounted) {
          setFields([])
          setSubjects([])
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let mounted = true
    ;(async () => {
      try {
        const quiz = await getQuizById(quizId)
        if (!mounted) return
        setForm({
          title: quiz.title || '',
          description: quiz.description || '',
          subject: quiz.subject || '',
          subject_ref: quiz.subject_ref || '',
          topic_ref: quiz.topic_ref || '',
          module_ref: quiz.module_ref || '',
          category: quiz.category || '',
          semester: quiz.semester || 1,
          unit_name: quiz.unit_name || '',
          difficulty: quiz.difficulty || 'medium',
          quiz_type: quiz.quiz_type || 'practice',
          duration_minutes: quiz.duration_minutes || 20,
          total_marks: quiz.total_marks || 100,
          passing_marks: quiz.passing_marks || 40,
          randomize_questions: Boolean(quiz.randomize_questions),
          randomize_options: Boolean(quiz.randomize_options),
          allow_retry: Boolean(quiz.allow_retry),
          show_answers_after_submit: Boolean(quiz.show_answers_after_submit),
          is_published: Boolean(quiz.is_published),
          apply_to_all_fields: Boolean(quiz.apply_to_all_fields),
          target_field_of_study: quiz.target_field_of_study || '',
          target_semester_code: quiz.target_semester_code || '',
          target_semester_number: quiz.target_semester_number || '',
          target_section: quiz.target_section || '',
          assigned_fields: (quiz.assigned_fields || []).map(Number),
          strict_structure: Boolean(quiz.strict_structure),
          visibility: quiz.visibility || 'private',
          questions: quiz.questions || [],
        })
      } catch {
        toast.error(t('academy.failedToLoadQuiz'))
      }
    })()
    return () => {
      mounted = false
    }
  }, [isEdit, quizId, t])

  useEffect(() => {
    if (!form.subject_ref) {
      setTopics([])
      setModules([])
      return
    }
    listTopics({ subject_id: form.subject_ref }).then(setTopics).catch(() => setTopics([]))
  }, [form.subject_ref])

  useEffect(() => {
    if (!form.topic_ref) {
      setModules([])
      return
    }
    listModules({ topic_id: form.topic_ref }).then(setModules).catch(() => setModules([]))
  }, [form.topic_ref])

  const canSelectFields = useMemo(() => !form.apply_to_all_fields, [form.apply_to_all_fields])
  const quizTypes = useMemo(
    () => QUIZ_TYPE_VALUES.map((value) => ({ value, label: t(`quizTypes.${value}`) })),
    [t]
  )

  const toggleAssignedField = (fieldId) => {
    setForm((prev) => {
      const exists = prev.assigned_fields.includes(fieldId)
      return {
        ...prev,
        assigned_fields: exists
          ? prev.assigned_fields.filter((id) => id !== fieldId)
          : [...prev.assigned_fields, fieldId],
      }
    })
  }

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    if (!form.title.trim()) {
      toast.error(t('academy.titleRequired'))
      return
    }
    setSaving(true)
    try {
      const selectedSubject = subjects.find((item) => item.id === Number(form.subject_ref))
      const payload = {
        ...form,
        subject_ref: form.subject_ref ? Number(form.subject_ref) : null,
        topic_ref: form.topic_ref ? Number(form.topic_ref) : null,
        module_ref: form.module_ref ? Number(form.module_ref) : null,
        subject: selectedSubject?.name || form.subject,
        semester: Number(form.semester || selectedSubject?.semester || 1),
        duration_minutes: Number(form.duration_minutes),
        total_marks: Number(form.total_marks),
        passing_marks: Number(form.passing_marks),
        target_field_of_study: form.target_field_of_study ? Number(form.target_field_of_study) : null,
        target_semester_number: form.target_semester_number ? Number(form.target_semester_number) : null,
        assigned_fields: form.apply_to_all_fields ? [] : form.assigned_fields,
      }
      if (isEdit) {
        await updateQuiz(quizId, payload)
        toast.success(t('academy.quizUpdated'))
      } else {
        await createQuiz(payload)
        toast.success(t('academy.quizCreated'))
      }
    } catch {
      // handled globally
    } finally {
      setSaving(false)
    }
  }

  if (!loading && !isTeacherRole(role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <Card className="mx-auto max-w-4xl rounded-[36px] bg-white/95 p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-display font-bold text-slate-900">
            {isEdit ? t('academy.editQuiz') : t('academy.createQuiz')}
          </h1>
          <SecondaryButton as={Link} to="/teacher/dashboard">{t('academy.backToTeacherDashboard')}</SecondaryButton>
        </div>

        <div className="mt-6 space-y-4">
          <QuizBuilder subjects={subjects} topics={topics} modules={modules} form={form} onChange={setForm} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.category')}
            <input value={form.category} onChange={update('category')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('academy.difficulty')}
            <select value={form.difficulty} onChange={update('difficulty')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
              <option value="easy">{t('common.easy')}</option>
              <option value="medium">{t('common.medium')}</option>
              <option value="hard">{t('common.hard')}</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.quizType')}
            <select value={form.quiz_type} onChange={update('quiz_type')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
              {quizTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.semester')}
            <input type="number" min={1} max={12} value={form.semester} onChange={update('semester')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.durationMinutes')}
            <input type="number" min={1} value={form.duration_minutes} onChange={update('duration_minutes')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('academy.totalMarks')}
            <input type="number" min={1} value={form.total_marks} onChange={update('total_marks')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('academy.passMarks')}
            <input type="number" min={0} value={form.passing_marks} onChange={update('passing_marks')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.targetField')}
            <select value={form.target_field_of_study || ''} onChange={update('target_field_of_study')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
              <option value="">{t('quizCreate.allOrDerived')}</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.targetSemesterCode')}
            <input value={form.target_semester_code || ''} onChange={update('target_semester_code')} placeholder="2501" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.targetSemesterNumber')}
            <select value={form.target_semester_number || ''} onChange={update('target_semester_number')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
              <option value="">{t('academy.allSemesters')}</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {t('quizCreate.targetSection')}
            <select value={form.target_section || ''} onChange={update('target_section')} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
              <option value="">{t('quizCreate.allSections')}</option>
              {['A', 'B', 'C', 'D'].map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          {t('academy.description')}
          <textarea value={form.description} onChange={update('description')} rows={3} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5" />
        </label>

        <div className="mt-4">
          <QuizRulesForm form={form} onChange={setForm} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_published} onChange={update('is_published')} />
            {t('quizCreate.publishImmediately')}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.apply_to_all_fields} onChange={update('apply_to_all_fields')} />
            {t('quizCreate.assignToAllFields')}
          </label>
        </div>

        {canSelectFields ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">{t('quizCreate.assignFields')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {fields.map((field) => {
                const active = form.assigned_fields.includes(field.id)
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => toggleAssignedField(field.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      active ? 'bg-primary-500 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {field.name}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <PrimaryButton type="button" disabled={saving} onClick={save}>
            {saving ? t('academy.saving') : isEdit ? t('quizCreate.updateQuiz') : t('academy.createQuiz')}
          </PrimaryButton>
          <SecondaryButton as={Link} to="/teacher/ai-generate">
            {t('quizCreate.generateWithAI')}
          </SecondaryButton>
        </div>
      </Card>
    </SectionWrapper>
  )
}

export default QuizCreate
