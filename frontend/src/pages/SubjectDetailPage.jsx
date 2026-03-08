import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { getSubjectById, getSubjectQuizzes } from '../api/subjects'
import Card from '../components/Card'
import QuizCard from '../components/QuizCard'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'

const SubjectDetailPage = () => {
  const { t } = useTranslation()
  const { subjectId } = useParams()
  const [subject, setSubject] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [subjectData, quizData] = await Promise.all([
          getSubjectById(subjectId),
          getSubjectQuizzes(subjectId),
        ])
        if (!mounted) return
        setSubject(subjectData)
        setQuizzes(quizData)
      } catch {
        if (!mounted) return
        setSubject(null)
        setQuizzes([])
        setError(t('academy.failedToLoadSubject'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [subjectId, t])

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('academy.subjectDetail')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{subject?.code} - {subject?.name}</h1>
              <p className="mt-2 text-sm text-slate-600">{subject?.description}</p>
            </div>
            <SecondaryButton as={Link} to="/subjects">{t('academy.backToSubjects')}</SecondaryButton>
          </div>
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.topicsAndModules')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(subject?.topics || []).map((topic) => (
              <div key={topic.id} className="rounded-2xl bg-slate-50 p-4">
                <Link to={`/topics/${topic.id}`} className="block transition hover:opacity-80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">{topic.unit_name || t('academy.generalUnit')}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{topic.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{topic.description || t('academy.noTopicDescription')}</p>
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(topic.modules || []).length ? (
                    topic.modules.map((module) => (
                      <Link
                        key={module.id}
                        to={`/modules/${module.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600"
                      >
                        {module.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">{t('academy.noModules')}</span>
                  )}
                </div>
              </div>
            ))}
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

export default SubjectDetailPage
