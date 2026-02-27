import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiPencilSquare, HiPlus } from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import QuizEditor from '../components/QuizEditor'
import { getMyQuizzes } from '../api/axios'
import { getCurrentUserRole, isAuthenticated } from '../utils/auth'

const MySets = () => {
  const authed = isAuthenticated()
  const role = getCurrentUserRole()
  const [loading, setLoading] = useState(false)
  const [quizzes, setQuizzes] = useState([])
  const [editingQuiz, setEditingQuiz] = useState(null)

  const canManageSets = useMemo(() => {
    if (!authed) return false
    if (!role) return true
    return role === 'teacher' || role === 'admin'
  }, [authed, role])

  const loadMyQuizzes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyQuizzes()
      setQuizzes(data)
    } catch {
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canManageSets) return
    loadMyQuizzes()
  }, [canManageSets, loadMyQuizzes])

  const handleSaved = async () => {
    toast.success('Quiz set saved.')
    setEditingQuiz(null)
    await loadMyQuizzes()
  }

  if (!authed) {
    return (
      <SectionWrapper className="pt-4" disableMotion>
        <Card className="rounded-[32px]">
          <h2 className="text-2xl font-semibold text-slate-900">Teacher Set Manager</h2>
          <p className="mt-3 text-sm text-slate-600">Log in first to create or edit quiz sets.</p>
          <div className="mt-5">
            <PrimaryButton as={Link} to="/login">Go to Login</PrimaryButton>
          </div>
        </Card>
      </SectionWrapper>
    )
  }

  if (!canManageSets) {
    return (
      <SectionWrapper className="pt-4" disableMotion>
        <Card className="rounded-[32px]">
          <h2 className="text-2xl font-semibold text-slate-900">Teacher Set Manager</h2>
          <p className="mt-3 text-sm text-slate-600">Only teacher accounts can create and edit quiz sets.</p>
        </Card>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="rounded-[32px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Teacher Set Manager</h2>
              <p className="mt-1 text-sm text-slate-500">Create and edit your quiz sets here.</p>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={loadMyQuizzes} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </SecondaryButton>
              <PrimaryButton onClick={() => setEditingQuiz({ title: '', description: '', category: '', questions: [] })} Icon={HiPlus}>
                New Set
              </PrimaryButton>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr,1.3fr]">
          <Card className="rounded-[32px]">
            <h3 className="text-xl font-semibold text-slate-900">My Quiz Sets</h3>
            <div className="mt-4 space-y-3">
              {!quizzes.length && (
                <p className="rounded-2xl bg-surface-soft px-4 py-3 text-sm text-slate-600">
                  {loading ? 'Loading sets...' : 'No quiz sets yet. Create your first one.'}
                </p>
              )}
              {quizzes.map((quiz) => {
                const questionCount = quiz.question_count ?? (Array.isArray(quiz.questions) ? quiz.questions.length : 0)
                return (
                  <div key={quiz.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <p className="text-base font-semibold text-slate-900">{quiz.title || 'Untitled set'}</p>
                    <p className="mt-1 text-sm text-slate-500">{quiz.description || 'No description'}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary-500">{questionCount} questions</p>
                    <div className="mt-3">
                      <SecondaryButton onClick={() => setEditingQuiz(quiz)} Icon={HiPencilSquare}>
                        Edit
                      </SecondaryButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="rounded-[32px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">{editingQuiz?.id ? 'Edit Quiz Set' : 'Create Quiz Set'}</h3>
              {editingQuiz && (
                <SecondaryButton onClick={() => setEditingQuiz(null)}>
                  Cancel
                </SecondaryButton>
              )}
            </div>
            <QuizEditor key={editingQuiz?.id || 'new-quiz'} quiz={editingQuiz} onSaved={handleSaved} />
          </Card>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}

export default MySets
