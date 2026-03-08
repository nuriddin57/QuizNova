import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { bulkAddAIQuestions, generateAIQuestions, saveAIQuestionsToBank } from '../api/ai'
import { listMyQuizzes } from '../api/quizzes'
import { listSubjects, listTopics } from '../api/subjects'
import AIGenerateQuestionForm from '../components/AIGenerateQuestionForm'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import QuestionPreviewCard from '../components/QuestionPreviewCard'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isTeacherRole } from '../utils/role'

const AIGenerateQuestions = () => {
  const { t } = useTranslation()
  const { role, loading } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [quizData, subjectData] = await Promise.all([listMyQuizzes(), listSubjects({ is_active: true })])
        if (mounted) {
          setQuizzes(quizData)
          setSubjects(subjectData)
        }
      } catch {
        if (mounted) {
          setQuizzes([])
          setSubjects([])
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([])
      return
    }
    listTopics({ subject_id: selectedSubjectId }).then(setTopics).catch(() => setTopics([]))
  }, [selectedSubjectId])

  const handleGenerate = async (payload) => {
    setGenerating(true)
    try {
      const data = await generateAIQuestions(payload)
      const generatedCount = data?.questions?.length || 0
      setQuestions(data?.questions || [])
      toast.success(t('aiGenerator.generated', { count: generatedCount, provider: data?.provider || 'mock' }))
    } catch {
      // handled globally
    } finally {
      setGenerating(false)
    }
  }

  const updateQuestion = (index, nextQuestion) => {
    setQuestions((prev) => prev.map((item, idx) => (idx === index ? nextQuestion : item)))
  }

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const saveToQuiz = async () => {
    if (!selectedQuizId) {
      toast.error(t('aiGenerator.selectQuizFirst'))
      return
    }
    if (!questions.length) {
      toast.error(t('aiGenerator.noQuestionsToSave'))
      return
    }
    setSaving(true)
    try {
      await bulkAddAIQuestions({
        quiz_id: Number(selectedQuizId),
        questions,
      })
      toast.success(t('aiGenerator.savedToQuiz'))
      setQuestions([])
    } catch {
      // handled globally
    } finally {
      setSaving(false)
    }
  }

  const saveToBank = async () => {
    if (!selectedSubjectId) {
      toast.error(t('aiGenerator.selectSubjectFirst'))
      return
    }
    if (!questions.length) {
      toast.error(t('aiGenerator.noQuestionsToSave'))
      return
    }
    setSaving(true)
    try {
      await saveAIQuestionsToBank({
        subject_ref: Number(selectedSubjectId),
        topic_ref: selectedTopicId ? Number(selectedTopicId) : null,
        quiz_id: selectedQuizId ? Number(selectedQuizId) : undefined,
        difficulty: 'medium',
        marks: 1,
        questions,
      })
      toast.success(t('aiGenerator.savedToBank'))
      setQuestions([])
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
      <div className="space-y-6">
        <Card className="rounded-[36px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">{t('aiGenerator.title')}</h1>
              <p className="mt-2 text-sm text-slate-600">{t('aiGenerator.description')}</p>
            </div>
            <SecondaryButton as={Link} to="/teacher/dashboard">{t('aiGenerator.backToDashboard')}</SecondaryButton>
          </div>
        </Card>

        <AIGenerateQuestionForm loading={generating} onGenerate={handleGenerate} />

        <Card className="rounded-[36px] bg-white/95 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              {t('aiGenerator.subjectForSaving')}
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
                <option value="">{t('academy.selectSubject')}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              {t('aiGenerator.topicForSaving')}
              <select value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
                <option value="">{t('academy.selectTopic')}</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr,220px,220px]">
            <label className="text-sm font-semibold text-slate-700">
              {t('aiGenerator.optionalQuizTarget')}
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
              >
                <option value="">{t('aiGenerator.selectQuiz')}</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="self-end">
              <PrimaryButton type="button" disabled={saving} onClick={saveToQuiz}>
                {saving ? t('academy.saving') : t('aiGenerator.saveToQuiz')}
              </PrimaryButton>
            </div>
            <div className="self-end">
              <SecondaryButton type="button" disabled={saving} onClick={saveToBank}>
                {saving ? t('academy.saving') : t('aiGenerator.saveToBank')}
              </SecondaryButton>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {questions.length ? (
            questions.map((question, index) => (
              <QuestionPreviewCard
                key={index}
                index={index}
                question={question}
                onChange={(next) => updateQuestion(index, next)}
                onDelete={() => removeQuestion(index)}
              />
            ))
          ) : (
            <Card className="rounded-3xl bg-white p-5">
              <p className="text-sm text-slate-600">{t('aiGenerator.noGeneratedQuestions')}</p>
            </Card>
          )}
        </div>
      </div>
    </SectionWrapper>
  )
}

export default AIGenerateQuestions
