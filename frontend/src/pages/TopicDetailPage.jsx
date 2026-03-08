import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { getTopicById, getTopicQuizzes } from '../api/subjects'
import Card from '../components/Card'
import ModuleCard from '../components/ModuleCard'
import QuizCard from '../components/QuizCard'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'

const TopicDetailPage = () => {
  const { t } = useTranslation()
  const { topicId } = useParams()
  const [topic, setTopic] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [topicData, quizData] = await Promise.all([
          getTopicById(topicId),
          getTopicQuizzes(topicId),
        ])
        if (!mounted) return
        setTopic(topicData)
        setQuizzes(quizData)
      } catch {
        if (!mounted) return
        setTopic(null)
        setQuizzes([])
        setError(t('academy.failedToLoadTopic'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [topicId, t])

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('academy.topicDetail')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{topic?.name || t('academy.loadingTopic')}</h1>
              <p className="mt-2 text-sm text-slate-600">{topic?.description || t('academy.noTopicDescription')}</p>
              <p className="mt-2 text-sm text-slate-500">
                {t('academy.subject')}: {topic?.subject_name || '-'} {topic?.unit_name ? `| ${t('academy.unitModule')}: ${topic.unit_name}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {topic?.subject ? (
                <SecondaryButton as={Link} to={`/subjects/${topic.subject}`}>{t('academy.backToSubject')}</SecondaryButton>
              ) : null}
              <SecondaryButton as={Link} to="/subjects">{t('academy.backToSubjects')}</SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.modules')}</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(topic?.modules || []).length ? (
              topic.modules.map((module) => (
                <ModuleCard key={module.id} module={module} actionTo={`/modules/${module.id}`} />
              ))
            ) : (
              <p className="text-sm text-slate-500">{t('academy.noModules')}</p>
            )}
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

export default TopicDetailPage
