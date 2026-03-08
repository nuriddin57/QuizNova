import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { getModuleById, getModuleQuizzes } from '../api/subjects'
import Card from '../components/Card'
import QuizCard from '../components/QuizCard'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'

const ModuleDetailPage = () => {
  const { t } = useTranslation()
  const { moduleId } = useParams()
  const [moduleItem, setModuleItem] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [moduleData, quizData] = await Promise.all([getModuleById(moduleId), getModuleQuizzes(moduleId)])
        if (!mounted) return
        setModuleItem(moduleData)
        setQuizzes(quizData)
      } catch {
        if (!mounted) return
        setModuleItem(null)
        setQuizzes([])
        setError(t('academy.failedToLoadModule'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [moduleId, t])

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('academy.moduleDetail')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{moduleItem?.title || t('academy.loadingModule')}</h1>
              <p className="mt-2 text-sm text-slate-600">{moduleItem?.description || t('academy.noModuleDescription')}</p>
              <p className="mt-2 text-sm text-slate-500">{t('academy.topic')}: {moduleItem?.topic_name || '-'}</p>
            </div>
            <div className="flex gap-2">
              {moduleItem?.topic ? (
                <SecondaryButton as={Link} to={`/topics/${moduleItem.topic}`}>{t('academy.backToTopic')}</SecondaryButton>
              ) : null}
              <SecondaryButton as={Link} to="/subjects">{t('academy.backToSubjects')}</SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.relatedQuizzes')}</h2>
          {loading ? <p className="mt-4 text-sm text-slate-500">{t('academy.loadingRelatedQuizzes')}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
          {!loading && !error ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {quizzes.length ? (
                quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} actionLabel={t('academy.openQuiz')} actionTo={`/quiz/${quiz.id}/take`} />
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('academy.noRelatedQuizzes')}</p>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default ModuleDetailPage
