import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { bulkAddAIQuestions, generateAIQuestions, regenerateAIQuestion, saveAIQuestionsToBank } from '../api/ai'
import { createQuiz, listMyQuizzes } from '../api/quizzes'
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
  const { t, i18n } = useTranslation()
  const { role, loading } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [questions, setQuestions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [generatedMeta, setGeneratedMeta] = useState(null)
  const [newQuizTitle, setNewQuizTitle] = useState('')

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
      const requestPayload = {
        ...payload,
        language: payload.language || i18n.language || 'en',
      }
      const data = await generateAIQuestions(requestPayload)
      const generatedCount = data?.questions?.length || 0
      setQuestions(data?.questions || [])
      setGeneratedMeta(requestPayload)
      setNewQuizTitle(payload?.topic ? `${payload.topic} Quiz` : payload?.subject ? `${payload.subject} Quiz` : '')
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

  const handleRegenerateQuestion = async (index) => {
    if (!generatedMeta) return

    setRegeneratingIndex(index)
    try {
      const data = await regenerateAIQuestion({
        ...generatedMeta,
        current_question_text: questions[index]?.question_text || '',
        current_question_type: questions[index]?.question_type || questions[index]?.type || 'multiple_choice',
        existing_questions: questions
          .filter((_, questionIndex) => questionIndex !== index)
          .map((question) => question.question_text),
      })
      if (data?.question) {
        setQuestions((prev) => prev.map((item, questionIndex) => (questionIndex === index ? data.question : item)))
        toast.success(t('aiGenerator.regeneratedQuestion'))
      }
    } catch {
      // handled globally
    } finally {
      setRegeneratingIndex(null)
    }
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
      setGeneratedMeta(null)
      setNewQuizTitle('')
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
        difficulty: generatedMeta?.difficulty || 'medium',
        marks: 1,
        questions,
      })
      toast.success(t('aiGenerator.savedToBank'))
      setQuestions([])
      setGeneratedMeta(null)
      setNewQuizTitle('')
    } catch {
      // handled globally
    } finally {
      setSaving(false)
    }
  }

  const saveAsNewQuiz = async () => {
    if (!questions.length) {
      toast.error(t('aiGenerator.noQuestionsToSave'))
      return
    }

    const normalizedTitle = newQuizTitle.trim() || generatedMeta?.topic?.trim() || generatedMeta?.subject?.trim()
    if (!normalizedTitle) {
      toast.error(t('aiGenerator.newQuizTitleRequired'))
      return
    }

    const selectedSubject = subjects.find((subject) => subject.id === Number(selectedSubjectId))
    const selectedTopic = topics.find((topic) => topic.id === Number(selectedTopicId))
    const difficulty = generatedMeta?.difficulty || 'medium'
    const totalMarks = questions.length
    const payload = {
      title: normalizedTitle,
      description: generatedMeta?.topic
        ? `${generatedMeta.subject || selectedSubject?.name || t('academy.general')}: ${generatedMeta.topic}`
        : generatedMeta?.subject || selectedSubject?.name || normalizedTitle,
      category: selectedSubject?.name || generatedMeta?.subject || t('academy.general'),
      subject: selectedSubject?.name || generatedMeta?.subject || normalizedTitle,
      subject_ref: selectedSubject ? selectedSubject.id : null,
      topic_ref: selectedTopic ? selectedTopic.id : null,
      semester: Number(selectedSubject?.semester || 1),
      difficulty,
      quiz_type: 'practice',
      duration_minutes: Math.max(10, questions.length * 2),
      total_marks: totalMarks,
      passing_marks: Math.max(1, Math.ceil(totalMarks * 0.4)),
      randomize_questions: false,
      randomize_options: false,
      allow_retry: true,
      show_answers_after_submit: true,
      is_published: false,
      visibility: 'private',
      apply_to_all_fields: !selectedSubject,
      assigned_fields: selectedSubject?.field_of_study ? [selectedSubject.field_of_study] : [],
      target_field_of_study: selectedSubject?.field_of_study || null,
      strict_structure: false,
      questions: questions.map((question, index) => ({
        text: question.question_text,
        explanation: question.explanation || '',
        question_type: question.question_type || 'mcq',
        difficulty,
        marks: 1,
        timer_seconds: 30,
        order: index,
        choices: (question.options || []).map((option, optionIndex) => ({
          text: option,
          is_correct: optionIndex === Number(question.correct_answer_index || 0),
          order: optionIndex,
        })),
      })),
    }

    setSaving(true)
    try {
      const createdQuiz = await createQuiz(payload)
      const refreshedQuizzes = await listMyQuizzes()
      setQuizzes(refreshedQuizzes)
      setSelectedQuizId(String(createdQuiz?.id || ''))
      setQuestions([])
      setGeneratedMeta(null)
      setNewQuizTitle('')
      toast.success(t('aiGenerator.savedAsNewQuiz'))
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
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              {t('aiGenerator.newQuizTitle')}
              <input
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                placeholder={t('aiGenerator.newQuizTitlePlaceholder')}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
              />
            </label>
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
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr,220px,220px,220px]">
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
              <PrimaryButton type="button" disabled={saving} onClick={saveAsNewQuiz}>
                {saving ? t('academy.saving') : t('aiGenerator.saveAsNewQuiz')}
              </PrimaryButton>
            </div>
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
                onRegenerate={() => handleRegenerateQuestion(index)}
                regenerating={regeneratingIndex === index}
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
