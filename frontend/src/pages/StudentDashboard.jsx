import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { listQuizzes } from '../api/quizzes'
import { getStudentResults, getStudentSubjectPerformance } from '../api/results'
import { listSubjects } from '../api/subjects'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import QuizCard from '../components/QuizCard'
import ResultTable from '../components/ResultTable'
import SectionWrapper from '../components/SectionWrapper'
import SubjectPerformanceCard from '../components/SubjectPerformanceCard'
import { useAuth } from '../context/AuthContext'
import { isStudentRole } from '../utils/role'

const StudentDashboard = () => {
  const { t } = useTranslation()
  const { user, role, loading } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [results, setResults] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectPerformance, setSubjectPerformance] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [quizData, resultData, subjectData, subjectPerformanceData] = await Promise.all([
          listQuizzes({ is_published: true }),
          getStudentResults(),
          listSubjects({ is_active: true }),
          getStudentSubjectPerformance(),
        ])
        if (mounted) {
          setQuizzes(quizData)
          setResults(resultData)
          setSubjects(subjectData)
          setSubjectPerformance(subjectPerformanceData)
        }
      } catch {
        if (mounted) {
          setQuizzes([])
          setResults([])
          setSubjects([])
          setSubjectPerformance([])
        }
      } finally {
        if (mounted) setFetching(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    if (!results.length) {
      return { highest: 0, average: 0, passCount: 0, failCount: 0 }
    }
    const highest = Math.max(...results.map((item) => Number(item.score || 0)))
    const average = results.reduce((acc, item) => acc + Number(item.score || 0), 0) / results.length
    const passCount = results.filter((item) => item.pass_fail_status === 'pass').length
    const failCount = results.filter((item) => item.pass_fail_status === 'fail').length
    return { highest, average, passCount, failCount }
  }, [results])

  if (!loading && !isStudentRole(role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('academy.studentDashboard')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{user?.full_name || user?.username}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {t('academy.field')}: {user?.field_of_study_name || t('academy.notSelected')} | {t('academy.semesterCode')}: {user?.semester_code || '-'} | {t('academy.semesterNumber')}: {user?.semester_number || '-'} | {t('academy.section')}: {user?.section || '-'}
              </p>
            </div>
            <PrimaryButton as={Link} to="/field-selection">
              {t('academy.updateField')}
            </PrimaryButton>
          </div>
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{t('academy.mySubjects')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('academy.mySubjectsDescription')}</p>
            </div>
            <PrimaryButton as={Link} to="/subjects">{t('academy.openSubjectCatalog')}</PrimaryButton>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {subjects.slice(0, 6).map((subject) => (
              <div key={subject.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">{subject.code}</p>
                <p className="mt-2 font-semibold text-slate-900">{subject.name}</p>
                <p className="text-sm text-slate-600">{t('academy.semesterLabel', { semester: subject.semester })}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('academy.highestScore')}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.highest}</p>
          </Card>
          <Card className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('academy.averageScore')}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.average.toFixed(1)}</p>
          </Card>
          <Card className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('academy.pass')}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.passCount}</p>
          </Card>
          <Card className="rounded-3xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('academy.fail')}</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">{stats.failCount}</p>
          </Card>
        </div>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.availableQuizzesForField')}</h2>
          {fetching ? (
            <p className="mt-3 text-sm text-slate-500">{t('academy.loadingQuizzes')}</p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {quizzes.length ? (
                quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    actionLabel={quiz.quiz_type === 'exam' ? t('academy.startExam') : t('academy.takeQuiz')}
                    actionTo={`/quiz/${quiz.id}/take`}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('academy.noFieldQuizzes')}</p>
              )}
            </div>
          )}
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.resultsHistory')}</h2>
          <div className="mt-4">
            <ResultTable rows={results.map((item) => ({ ...item, student_name: user?.full_name || user?.username }))} />
          </div>
        </Card>

        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.subjectPerformance')}</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {subjectPerformance.map((item) => (
              <SubjectPerformanceCard key={`${item.subject_id}-${item.subject_name}`} item={item} />
            ))}
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default StudentDashboard
