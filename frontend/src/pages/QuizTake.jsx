import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { startExam, submitExam } from '../api/results'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isStudentRole } from '../utils/role'

const QuizTake = () => {
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
      toast.success('Exam submitted')
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
          <h1 className="text-3xl font-display font-bold text-slate-900">Exam Result</h1>
          <p className="mt-3 text-lg text-slate-700">Score: {result.score}</p>
          <p className="text-lg text-slate-700">Correct: {result.correct_answers}</p>
          <p className="text-lg text-slate-700">Wrong: {result.wrong_answers}</p>
          <p className="text-lg text-slate-700">Percentage: {Number(result.percentage || 0).toFixed(2)}%</p>
          <p className="text-lg text-slate-700">
            Status:{' '}
            <span className={result.pass_fail_status === 'pass' ? 'text-emerald-600' : 'text-rose-600'}>
              {result.pass_fail_status}
            </span>
          </p>
          <div className="mt-6 flex gap-2">
            <PrimaryButton as={Link} to="/results">View History</PrimaryButton>
            <SecondaryButton as={Link} to="/student/dashboard">Back to Dashboard</SecondaryButton>
          </div>
        </Card>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <Card className="mx-auto max-w-4xl rounded-[36px] bg-white/95 p-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">{exam?.title || 'Loading exam...'}</h1>
        {exam ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Subject: {exam.subject} | Difficulty: {exam.difficulty} | Duration: {exam.duration_minutes} minutes
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Answered {answeredCount} of {exam.questions.length}
            </p>
            <div className="mt-5 space-y-4">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {index + 1}. {question.text}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {(question.choices || []).map((choice) => {
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
                          {choice.text}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <PrimaryButton type="button" disabled={submitting} onClick={submit}>
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </PrimaryButton>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Exam not available or not assigned to your field.</p>
        )}
      </Card>
    </SectionWrapper>
  )
}

export default QuizTake
