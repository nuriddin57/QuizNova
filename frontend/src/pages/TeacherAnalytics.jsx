import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  getEasiestQuestions,
  getFieldPerformance,
  getHardestQuestions,
  getHighestScorer,
  getLowestScorer,
  getModulePerformance,
  getQuestionAccuracy,
  getQuizPerformance,
  getRecentAttempts,
  getSectionPerformance,
  getSemesterCodePerformance,
  getSemesterPerformance,
  getSubjectPerformance,
  getTopicPerformance,
  getTeacherLeaderboard,
  getTeacherSummary,
} from '../api/analytics'
import { listStudyFields } from '../api/fields'
import { listMyQuizzes } from '../api/quizzes'
import { getTeacherResults } from '../api/results'
import { listSubjects } from '../api/subjects'
import AnalyticsSummaryCard from '../components/AnalyticsSummaryCard'
import Card from '../components/Card'
import LeaderboardCard from '../components/LeaderboardCard'
import ResultTable from '../components/ResultTable'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isTeacherRole } from '../utils/role'

const TeacherAnalytics = () => {
  const { t } = useTranslation()
  const { role, loading } = useAuth()
  const [summary, setSummary] = useState({})
  const [leaderboard, setLeaderboard] = useState([])
  const [highest, setHighest] = useState(null)
  const [lowest, setLowest] = useState(null)
  const [fieldPerformance, setFieldPerformance] = useState([])
  const [subjectPerformance, setSubjectPerformance] = useState([])
  const [topicPerformance, setTopicPerformance] = useState([])
  const [modulePerformance, setModulePerformance] = useState([])
  const [quizPerformance, setQuizPerformance] = useState([])
  const [semesterCodePerformance, setSemesterCodePerformance] = useState([])
  const [semesterPerformance, setSemesterPerformance] = useState([])
  const [sectionPerformance, setSectionPerformance] = useState([])
  const [questionAccuracy, setQuestionAccuracy] = useState([])
  const [hardestQuestions, setHardestQuestions] = useState([])
  const [easiestQuestions, setEasiestQuestions] = useState([])
  const [recentAttempts, setRecentAttempts] = useState([])
  const [resultRows, setResultRows] = useState([])
  const [fields, setFields] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({
    field_id: '',
    semester_code: '',
    semester_number: '',
    section: '',
    quiz_id: '',
    subject_id: '',
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [fieldOptions, quizOptions, subjectOptions] = await Promise.all([listStudyFields(), listMyQuizzes(), listSubjects({ is_active: true })])
        if (!mounted) return
        setFields(fieldOptions)
        setQuizzes(quizOptions)
        setSubjects(subjectOptions)
      } catch {
        if (!mounted) return
        setFields([])
        setQuizzes([])
        setSubjects([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [
          summaryData,
          leaderboardData,
          highestData,
          lowestData,
          fieldData,
          subjectData,
          topicData,
          moduleData,
          quizData,
          semesterCodeData,
          semesterData,
          sectionData,
          questionData,
          hardestData,
          easiestData,
          recentData,
          resultData,
        ] = await Promise.all([
          getTeacherSummary(filters),
          getTeacherLeaderboard(filters),
          getHighestScorer(filters),
          getLowestScorer(filters),
          getFieldPerformance(filters),
          getSubjectPerformance(filters),
          getTopicPerformance(filters),
          getModulePerformance(filters),
          getQuizPerformance(filters),
          getSemesterCodePerformance(filters),
          getSemesterPerformance(filters),
          getSectionPerformance(filters),
          getQuestionAccuracy(filters),
          getHardestQuestions(filters),
          getEasiestQuestions(filters),
          getRecentAttempts(filters),
          getTeacherResults(filters),
        ])
        if (!mounted) return
        setSummary(summaryData || {})
        setLeaderboard(leaderboardData || [])
        setHighest(highestData)
        setLowest(lowestData)
        setFieldPerformance(fieldData || [])
        setSubjectPerformance(subjectData || [])
        setTopicPerformance(topicData || [])
        setModulePerformance(moduleData || [])
        setQuizPerformance(quizData || [])
        setSemesterCodePerformance(semesterCodeData || [])
        setSemesterPerformance(semesterData || [])
        setSectionPerformance(sectionData || [])
        setQuestionAccuracy(questionData || [])
        setHardestQuestions(hardestData || [])
        setEasiestQuestions(easiestData || [])
        setRecentAttempts(recentData || [])
        setResultRows(resultData || [])
      } catch {
        if (!mounted) return
        setSummary({})
        setLeaderboard([])
        setHighest(null)
        setLowest(null)
        setFieldPerformance([])
        setSubjectPerformance([])
        setTopicPerformance([])
        setModulePerformance([])
        setQuizPerformance([])
        setSemesterCodePerformance([])
        setSemesterPerformance([])
        setSectionPerformance([])
        setQuestionAccuracy([])
        setHardestQuestions([])
        setEasiestQuestions([])
        setRecentAttempts([])
        setResultRows([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [filters])

  if (!loading && !isTeacherRole(role)) {
    return <Navigate to="/login" replace />
  }

  const resetFilters = () => setFilters({ field_id: '', semester_code: '', semester_number: '', section: '', quiz_id: '', subject_id: '' })

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[36px] bg-white/95 p-6">
          <h1 className="text-3xl font-display font-bold text-slate-900">{t('teacherAnalytics.title')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('teacherAnalytics.description')}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            <select value={filters.field_id} onChange={(e) => setFilters((prev) => ({ ...prev, field_id: e.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">{t('academy.allFields')}</option>
              {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
            </select>
            <select value={filters.subject_id} onChange={(e) => setFilters((prev) => ({ ...prev, subject_id: e.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">{t('teacherAnalytics.allSubjects')}</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <input value={filters.semester_code} onChange={(e) => setFilters((prev) => ({ ...prev, semester_code: e.target.value }))} placeholder={t('teacherAnalytics.semesterCodePlaceholder')} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
            <select value={filters.semester_number} onChange={(e) => setFilters((prev) => ({ ...prev, semester_number: e.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">{t('academy.allSemesters')}</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>{semester}</option>)}
            </select>
            <select value={filters.section} onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">{t('teacherAnalytics.allSections')}</option>
              {['A', 'B', 'C', 'D'].map((section) => <option key={section} value={section}>{section}</option>)}
            </select>
            <select value={filters.quiz_id} onChange={(e) => setFilters((prev) => ({ ...prev, quiz_id: e.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">{t('teacherAnalytics.allQuizzes')}</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              {t('discoverPage.resetFilters')}
            </button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <AnalyticsSummaryCard title={t('teacherDashboard.highestScore')} value={Number(summary.highest_score || 0).toFixed(1)} />
          <AnalyticsSummaryCard title={t('teacherDashboard.lowestScore')} value={Number(summary.lowest_score || 0).toFixed(1)} tone="danger" />
          <AnalyticsSummaryCard title={t('teacherDashboard.averageScore')} value={Number(summary.average_score || 0).toFixed(1)} />
          <AnalyticsSummaryCard title={t('teacherAnalytics.totalStudents')} value={summary.total_students_attempted || 0} />
          <AnalyticsSummaryCard title={t('teacherDashboard.passCount')} value={summary.pass_count || 0} tone="success" />
          <AnalyticsSummaryCard title={t('teacherDashboard.failCount')} value={summary.fail_count || 0} tone="danger" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.topVsLowest')}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t('teacherDashboard.highestScore')}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">{highest?.student_name || highest?.student_email || '-'}</p>
                <p className="text-sm text-emerald-700">{t('academy.score')}: {highest?.score || 0}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{t('teacherDashboard.lowestScore')}</p>
                <p className="mt-1 text-sm font-semibold text-rose-900">{lowest?.student_name || lowest?.student_email || '-'}</p>
                <p className="text-sm text-rose-700">{t('academy.score')}: {lowest?.score || 0}</p>
              </div>
            </div>
          </Card>
          <LeaderboardCard rows={leaderboard.slice(0, 10)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.fieldWise')}</h3>
            <div className="mt-4 space-y-2">
              {fieldPerformance.length ? (
                fieldPerformance.map((item, index) => (
                  <div key={`${item.field_id}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.field_name}</p>
                    <p className="text-slate-600">
                      {t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)} | {t('academy.pass')}: {item.pass_count} | {t('academy.fail')}: {item.fail_count}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noFieldData')}</p>
              )}
            </div>
          </Card>

          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.subjectWise')}</h3>
            <div className="mt-4 space-y-2">
              {subjectPerformance.length ? (
                subjectPerformance.map((item, index) => (
                  <div key={`${item.subject}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.subject}</p>
                    <p className="text-slate-600">
                      {t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)} | {t('teacherAnalytics.highShort')}: {item.highest_score} | {t('teacherDashboard.lowestScore')}: {item.lowest_score}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noSubjectData')}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.moduleWise')}</h3>
            <div className="mt-4 space-y-2">
              {modulePerformance.length ? (
                modulePerformance.map((item, index) => (
                  <div key={`${item.module_id}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.module_title}</p>
                    <p className="text-slate-600">
                      {t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)} | {t('teacherAnalytics.highShort')}: {item.highest_score} | {t('teacherDashboard.lowestScore')}: {item.lowest_score}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noModuleData')}</p>
              )}
            </div>
          </Card>

          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.quizWise')}</h3>
            <div className="mt-4 space-y-2">
              {quizPerformance.length ? (
                quizPerformance.map((item) => (
                  <div key={item.quiz_id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.quiz_title}</p>
                    <p className="text-slate-600">
                      {t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_percentage || 0).toFixed(2)}% | {t('academy.pass')}: {item.pass_count} | {t('academy.fail')}: {item.fail_count}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noQuizAnalytics')}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.topicWise')}</h3>
            <div className="mt-4 space-y-2">
              {topicPerformance.length ? (
                topicPerformance.map((item, index) => (
                  <div key={`${item.topic_id}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.unit_name ? `${item.unit_name} · ` : ''}{item.topic_name}</p>
                    <p className="text-slate-600">{t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noTopicData')}</p>
              )}
            </div>
          </Card>

          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.questionAccuracy')}</h3>
            <div className="mt-4 space-y-2">
              {questionAccuracy.length ? (
                questionAccuracy.slice(0, 10).map((item) => (
                  <div key={item.question_id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.question_text}</p>
                    <p className="text-slate-600">{t('academy.accuracy')}: {Number(item.accuracy_rate || 0).toFixed(2)}% | {t('academy.attempts')}: {item.total_attempts}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noQuestionAccuracy')}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.semesterCodePerformance')}</h3>
            <div className="mt-4 space-y-2">
              {semesterCodePerformance.map((item) => (
                <div key={item.semester_code} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{item.semester_code}</p>
                  <p className="text-slate-600">{t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.semesterPerformance')}</h3>
            <div className="mt-4 space-y-2">
              {semesterPerformance.map((item) => (
                <div key={String(item.semester_number)} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{t('academy.semesterLabel', { semester: item.semester_number ?? '-' })}</p>
                  <p className="text-slate-600">{t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.sectionPerformance')}</h3>
            <div className="mt-4 space-y-2">
              {sectionPerformance.map((item) => (
                <div key={item.section} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{t('fieldSelection.sectionLabel', { section: item.section })}</p>
                  <p className="text-slate-600">{t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.hardestQuestions')}</h3>
            <div className="mt-4 space-y-2">
              {hardestQuestions.map((item) => (
                <div key={item.question_id} className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  <p className="font-semibold">{item.question_text}</p>
                  <p>{t('academy.accuracy')}: {Number(item.accuracy_rate || 0).toFixed(2)}%</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.easiestQuestions')}</h3>
            <div className="mt-4 space-y-2">
              {easiestQuestions.map((item) => (
                <div key={item.question_id} className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <p className="font-semibold">{item.question_text}</p>
                  <p>{t('academy.accuracy')}: {Number(item.accuracy_rate || 0).toFixed(2)}%</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-3xl bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.recentAttempts')}</h3>
            <div className="mt-4 space-y-2">
              {recentAttempts.length ? (
                recentAttempts.map((item) => (
                  <div key={item.attempt_id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">{item.student_name || item.student_email}</p>
                    <p className="text-slate-600">{item.quiz_title} | {item.score} | {Number(item.percentage || 0).toFixed(1)}%</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('teacherAnalytics.noRecentAttempts')}</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="rounded-[36px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('teacherAnalytics.submissionResults')}</h2>
          <div className="mt-4">
            <ResultTable rows={resultRows} />
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default TeacherAnalytics
