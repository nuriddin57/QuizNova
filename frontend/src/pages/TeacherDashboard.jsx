import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { getHighestScorer, getLowestScorer, getSubjectSummary, getTeacherSummary } from '../api/analytics'
import { listMyQuizzes, publishQuiz } from '../api/quizzes'
import AnalyticsSummaryCard from '../components/AnalyticsSummaryCard'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import QuizCard from '../components/QuizCard'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isTeacherRole } from '../utils/role'

const TeacherDashboard = () => {
  const { t } = useTranslation()
  const { user, role, loading } = useAuth()
  const [summary, setSummary] = useState(null)
  const [highest, setHighest] = useState(null)
  const [lowest, setLowest] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [subjectSummary, setSubjectSummary] = useState([])
  const [fetching, setFetching] = useState(true)

  const loadData = async () => {
    setFetching(true)
    try {
      const [quizData, summaryData, highestData, lowestData, subjectSummaryData] = await Promise.all([
        listMyQuizzes(),
        getTeacherSummary(),
        getHighestScorer(),
        getLowestScorer(),
        getSubjectSummary(),
      ])
      setQuizzes(quizData)
      setSummary(summaryData)
      setHighest(highestData)
      setLowest(lowestData)
      setSubjectSummary(subjectSummaryData)
    } catch {
      setQuizzes([])
      setSummary(null)
      setHighest(null)
      setLowest(null)
      setSubjectSummary([])
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const togglePublish = async (quiz) => {
    try {
      await publishQuiz(quiz.id, !quiz.is_published)
      toast.success(quiz.is_published ? t('teacherDashboard.quizUnpublished') : t('teacherDashboard.quizPublished'))
      await loadData()
    } catch {
      // handled globally
    }
  }

  if (!loading && !isTeacherRole(role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('teacherDashboard.badge')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{user?.full_name || user?.username}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {t('academy.department')}: {user?.teacher_department || user?.department || '-'} | {t('teacherDashboard.designation')}: {user?.teacher_designation || '-'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton as={Link} to="/teacher/quiz/create">{t('academy.createQuiz')}</PrimaryButton>
              <SecondaryButton as={Link} to="/subjects">{t('academy.subjectsNav')}</SecondaryButton>
              <SecondaryButton as={Link} to="/teacher/question-bank">{t('academy.questionBank')}</SecondaryButton>
              <SecondaryButton as={Link} to="/teacher/bulk-import">{t('academy.bulkImportQuestions')}</SecondaryButton>
              <SecondaryButton as={Link} to="/teacher/ai-generate">{t('aiGenerator.title')}</SecondaryButton>
              <SecondaryButton as={Link} to="/teacher/analytics">{t('teacherDashboard.viewAnalytics')}</SecondaryButton>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <AnalyticsSummaryCard title={t('teacherDashboard.highestScore')} value={Number(summary?.highest_score || 0).toFixed(1)} />
          <AnalyticsSummaryCard title={t('teacherDashboard.lowestScore')} value={Number(summary?.lowest_score || 0).toFixed(1)} tone="danger" />
          <AnalyticsSummaryCard title={t('teacherDashboard.averageScore')} value={Number(summary?.average_score || 0).toFixed(1)} />
          <AnalyticsSummaryCard title={t('teacherDashboard.studentsAttempted')} value={summary?.total_students_attempted || 0} />
          <AnalyticsSummaryCard title={t('teacherDashboard.passCount')} value={summary?.pass_count || 0} tone="success" />
          <AnalyticsSummaryCard title={t('teacherDashboard.failCount')} value={summary?.fail_count || 0} tone="danger" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherDashboard.highestScorer')}</h3>
            <p className="mt-3 text-sm text-slate-700">
              {highest?.student_name || highest?.student_email || t('teacherDashboard.noData')}
            </p>
            <p className="text-sm text-slate-600">
              {t('academy.score')}: {highest?.score || 0} | {t('academy.percentage')}: {Number(highest?.percentage || 0).toFixed(2)}%
            </p>
          </Card>
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherDashboard.lowestScorer')}</h3>
            <p className="mt-3 text-sm text-slate-700">
              {lowest?.student_name || lowest?.student_email || t('teacherDashboard.noData')}
            </p>
            <p className="text-sm text-slate-600">
              {t('academy.score')}: {lowest?.score || 0} | {t('academy.percentage')}: {Number(lowest?.percentage || 0).toFixed(2)}%
            </p>
          </Card>
        </div>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">{t('teacherDashboard.subjectSnapshot')}</h2>
            <SecondaryButton as={Link} to="/teacher/analytics/subjects">{t('teacherDashboard.fullSubjectAnalytics')}</SecondaryButton>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {subjectSummary.slice(0, 6).map((item) => (
              <Card key={`${item.subject_id}-${item.subject_name}`} className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{item.subject_name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {t('teacherDashboard.quizzes')}: {item.total_quizzes} | {t('teacherDashboard.students')}: {item.total_students_attempted}
                </p>
                <p className="text-sm text-slate-600">
                  {t('teacherDashboard.averageShort')}: {Number(item.average_class_performance || 0).toFixed(1)} | {t('teacherDashboard.topShort')}: {item.top_score}
                </p>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">{t('teacherDashboard.yourQuizzes')}</h2>
            <SecondaryButton type="button" onClick={loadData}>
              {fetching ? t('mySets.refreshing') : t('mySets.refresh')}
            </SecondaryButton>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {quizzes.length ? (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="space-y-3">
                  <QuizCard quiz={quiz} actionLabel={t('academy.openQuiz')} actionTo={`/sets/${quiz.id}`} />
                  <div className="flex items-center gap-2">
                    <SecondaryButton type="button" onClick={() => togglePublish(quiz)}>
                      {quiz.is_published ? t('teacherDashboard.unpublish') : t('teacherDashboard.publish')}
                    </SecondaryButton>
                    <SecondaryButton as={Link} to={`/teacher/quiz/create?quizId=${quiz.id}`}>
                      {t('teacherDashboard.editMetadata')}
                    </SecondaryButton>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{t('teacherDashboard.noQuizzes')}</p>
            )}
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default TeacherDashboard
