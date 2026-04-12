import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { getMyResults, getParentProgress, getTeacherResults } from '../api/results'
import { listSubjects } from '../api/subjects'
import Card from '../components/Card'
import ResultTable from '../components/ResultTable'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isParentRole, isStudentRole, isTeacherRole } from '../utils/role'

const ResultsPage = () => {
  const { t } = useTranslation()
  const { role, loading, isAuthed } = useAuth()
  const [rows, setRows] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')

  const isStudentView = isStudentRole(role)
  const isTeacherView = isTeacherRole(role)
  const isParentView = isParentRole(role)

  const normalizedRows = useMemo(() => {
    if (!isStudentView) return rows
    return rows.map((item) => ({
      id: item.id,
      student_name: item.student_name || '',
      student_email: item.student_email || '',
      quiz: item.quiz_id,
      quiz_title: item.quiz_title,
      quiz_subject: item.subject_name,
      quiz_subject_id: item.subject_id,
      score: item.score,
      total_questions: item.total_questions,
      correct_answers: item.correct_count,
      wrong_answers: item.wrong_count,
      percentage: item.percentage,
      pass_fail_status: item.status,
      submitted_at: item.created_at,
    }))
  }, [isStudentView, rows])

  useEffect(() => {
    if (!role || !isAuthed) return
    let mounted = true
    ;(async () => {
      try {
        if (isTeacherView) {
          setResultsLoading(true)
          const data = await getTeacherResults()
          if (mounted) setRows(data)
          return
        }
        if (isParentView) {
          setResultsLoading(true)
          const data = await getParentProgress()
          if (mounted) setRows(data?.results || [])
          return
        }
        if (isStudentView) {
          setRows([])
          setSelectedSubject('')
          setSubjectsLoading(true)
          const data = await listSubjects({ is_active: true })
          if (mounted) setSubjects(Array.isArray(data) ? data : [])
        }
      } catch {
        if (mounted) {
          setRows([])
          if (isStudentView) setSubjects([])
        }
      } finally {
        if (mounted) {
          setResultsLoading(false)
          setSubjectsLoading(false)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [isAuthed, isParentView, isStudentView, isTeacherView, role])

  useEffect(() => {
    if (!isAuthed || !isStudentView || !selectedSubject) {
      if (isStudentView && !selectedSubject) setRows([])
      return
    }

    let mounted = true
    ;(async () => {
      setResultsLoading(true)
      try {
        const data = await getMyResults(selectedSubject === 'all' ? {} : { subject_id: selectedSubject })
        if (mounted) setRows(data)
      } catch {
        if (mounted) setRows([])
      } finally {
        if (mounted) setResultsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [isAuthed, isStudentView, selectedSubject])

  if (!loading && !isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <Card className="rounded-[36px] bg-white/95 p-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">
          {isTeacherView ? t('academy.studentResults') : t('academy.myResults')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isParentView
            ? t('parentDashboard.recentResultsBody')
            : isStudentView
            ? t('academy.resultsStudentDescription')
            : t('academy.resultsTeacherDescription')}
        </p>
        {isStudentView ? (
          <>
            <div className="mt-5 max-w-sm">
              <label htmlFor="results-subject-filter" className="mb-2 block text-sm font-semibold text-slate-700">
                {t('academy.subject', { defaultValue: 'Subject' })}
              </label>
              <select
                id="results-subject-filter"
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                disabled={subjectsLoading}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
              >
                <option value="">{t('academy.selectSubjectFilter', { defaultValue: 'Select a subject' })}</option>
                <option value="all">{t('academy.allSubjects', { defaultValue: 'All Subjects' })}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={String(subject.id)}>
                    {subject.name || subject.title || `#${subject.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5">
              {subjectsLoading ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {t('academy.loadingSubjects', { defaultValue: 'Loading subjects...' })}
                </p>
              ) : !selectedSubject ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {t('academy.selectSubjectPrompt', { defaultValue: 'Select a subject to view your results' })}
                </p>
              ) : resultsLoading ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {t('academy.loadingResults', { defaultValue: 'Loading results...' })}
                </p>
              ) : (
                <ResultTable
                  rows={normalizedRows}
                  emptyText={t('academy.noResultsForSubject', { defaultValue: 'No results found for this subject' })}
                />
              )}
            </div>
          </>
        ) : (
          <div className="mt-5">
            {resultsLoading ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                {t('academy.loadingResults', { defaultValue: 'Loading results...' })}
              </p>
            ) : (
              <ResultTable rows={normalizedRows} />
            )}
          </div>
        )}
      </Card>
    </SectionWrapper>
  )
}

export default ResultsPage
