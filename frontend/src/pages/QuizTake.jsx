import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { startExam, submitExam } from '../api/results'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isStudentRole } from '../utils/role'

const getChoiceLabel = (index) => String.fromCharCode(65 + index)

const QuizTake = () => {
  const { t } = useTranslation()
  const { quizId } = useParams()
  const { role, loading } = useAuth()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [startedAt, setStartedAt] = useState(Date.now())

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await startExam(quizId)
        if (mounted) {
          setExam(data)
          setStartedAt(Date.now())
        }
      } catch {
        if (mounted) setExam(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [quizId])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const choose = (questionId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }))
  }

  const submit = async () => {
    if (!exam) return
    setSubmitting(true)
    try {
      const payload = {
        answers: Object.entries(answers).map(([question_id, choice_id]) => ({
          question_id: Number(question_id),
          choice_id: Number(choice_id),
        })),
        duration_taken: (Date.now() - startedAt) / 1000,
      }
      const data = await submitExam(quizId, payload)
      setResult(data?.result || null)
      toast.success(t('quizTake.examSubmitted'))
    } catch {
      // handled globally
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && !isStudentRole(role)) {
    return <Navigate to="/login" replace />
  }

  if (result) {
    return (
      <SectionWrapper className="pt-4" disableMotion>
        <Card className="mx-auto max-w-2xl rounded-[36px] bg-white/95 p-8">
          <h1 className="text-3xl font-display font-bold text-slate-900">{t('quizTake.examResult')}</h1>
          <p className="mt-3 text-lg text-slate-700">{t('quizTake.score')}: {result.score}</p>
          <p className="text-lg text-slate-700">{t('quizTake.correct')}: {result.correct_answers}</p>
          <p className="text-lg text-slate-700">{t('quizTake.wrong')}: {result.wrong_answers}</p>
          <p className="text-lg text-slate-700">{t('quizTake.percentage')}: {Number(result.percentage || 0).toFixed(2)}%</p>
          <p className="text-lg text-slate-700">
            {t('quizTake.status')}:{' '}
            <span className={result.pass_fail_status === 'pass' ? 'text-emerald-600' : 'text-rose-600'}>
              {result.pass_fail_status === 'pass' ? t('quizTake.pass') : t('quizTake.fail')}
            </span>
          </p>
          <div className="mt-6 flex gap-2">
            <PrimaryButton as={Link} to="/results">{t('quizTake.viewHistory')}</PrimaryButton>
            <SecondaryButton as={Link} to="/student/dashboard">{t('quizTake.backToDashboard')}</SecondaryButton>
          </div>
        </Card>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <Card className="mx-auto max-w-4xl rounded-[36px] bg-white/95 p-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">{exam?.title || t('quizTake.loadingExam')}</h1>
        {exam ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {t('quizTake.subject')}: {exam.subject} | {t('quizTake.difficulty')}: {exam.difficulty} | {t('quizTake.duration')}: {exam.duration_minutes} {t('quizTake.minutes')}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t('quizTake.answeredCount', { answered: answeredCount, total: exam.questions.length })}
            </p>
            <div className="mt-5 space-y-4">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {index + 1}. {question.text}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {(question.choices || []).map((choice, choiceIndex) => {
                      const active = answers[question.id] === choice.id
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => choose(question.id, choice.id)}
                          className={`rounded-2xl border px-4 py-2 text-left text-sm ${
                            active ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {getChoiceLabel(choiceIndex)}. {choice.text}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <PrimaryButton type="button" disabled={submitting} onClick={submit}>
                {submitting ? t('quizTake.submitting') : t('quizTake.submitExam')}
              </PrimaryButton>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t('quizTake.notAvailable')}</p>
        )}
      </Card>
    </SectionWrapper>
  )
}

export default QuizTake
