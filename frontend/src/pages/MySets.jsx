import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiPencilSquare, HiPlus } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import QuizEditor from '../components/QuizEditor'
import { getMyQuizzes } from '../api/axios'
import { getCurrentUserRole, isAuthenticated } from '../utils/auth'

const createEmptyQuiz = () => ({ title: '', description: '', category: '', questions: [] })

const MySets = () => {
  const { t } = useTranslation()
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
    toast.success(t('mySets.saved'))
    setEditingQuiz(null)
    await loadMyQuizzes()
  }

  if (!authed) {
    return (
      <SectionWrapper className="pt-4" disableMotion>
        <Card className="rounded-[32px] bg-white/95">
          <h2 className="text-2xl font-semibold text-slate-900">{t('mySets.title')}</h2>
          <p className="mt-3 text-sm text-slate-600">{t('mySets.loginRequired')}</p>
          <div className="mt-5">
            <PrimaryButton as={Link} to="/login">{t('mySets.goToLogin')}</PrimaryButton>
          </div>
        </Card>
      </SectionWrapper>
    )
  }

  if (!canManageSets) {
    return (
      <SectionWrapper className="pt-4" disableMotion>
        <Card className="rounded-[32px] bg-white/95">
          <h2 className="text-2xl font-semibold text-slate-900">{t('mySets.title')}</h2>
          <p className="mt-3 text-sm text-slate-600">{t('mySets.teacherOnly')}</p>
        </Card>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="rounded-[32px] bg-white/95">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{t('mySets.title')}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">{t('mySets.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={loadMyQuizzes} disabled={loading}>
                {loading ? t('mySets.refreshing') : t('mySets.refresh')}
              </SecondaryButton>
              <PrimaryButton onClick={() => setEditingQuiz(createEmptyQuiz())} Icon={HiPlus}>
                {t('mySets.newSet')}
              </PrimaryButton>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr,1.3fr]">
          <Card className="rounded-[32px] bg-white/95">
            <h3 className="text-xl font-semibold text-slate-900">{t('mySets.myQuizSets')}</h3>
            <div className="mt-4 space-y-3">
              {!quizzes.length && (
                <p className="light-tile rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  {loading ? t('mySets.loadingSets') : t('mySets.noSets')}
                </p>
              )}
              {quizzes.map((quiz) => {
                const questionCount = quiz.question_count ?? (Array.isArray(quiz.questions) ? quiz.questions.length : 0)
                return (
                  <div key={quiz.id} className="light-tile rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <p className="text-base font-semibold text-slate-900">{quiz.title || t('mySets.untitled')}</p>
                    <p className="mt-1 text-sm text-slate-500">{quiz.description || t('mySets.noDescription')}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary-500">
                      {t('mySets.questionCount', { count: questionCount })}
                    </p>
                    <div className="mt-3">
                      <SecondaryButton onClick={() => setEditingQuiz(quiz)} Icon={HiPencilSquare}>
                        {t('mySets.edit')}
                      </SecondaryButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="rounded-[32px] bg-white/95">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">
                {editingQuiz?.id ? t('mySets.editTitle') : t('mySets.createTitle')}
              </h3>
              {editingQuiz && (
                <SecondaryButton onClick={() => setEditingQuiz(null)}>
                  {t('mySets.cancelEditing')}
                </SecondaryButton>
              )}
            </div>
            <QuizEditor key={editingQuiz?.id || 'new-quiz'} quiz={editingQuiz || createEmptyQuiz()} onSaved={handleSaved} />
          </Card>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}

export default MySets
