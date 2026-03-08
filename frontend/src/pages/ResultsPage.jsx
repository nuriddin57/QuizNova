import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { getTeacherResults, getStudentResults } from '../api/results'
import Card from '../components/Card'
import ResultTable from '../components/ResultTable'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { isStudentRole, isTeacherRole } from '../utils/role'

const ResultsPage = () => {
  const { t } = useTranslation()
  const { role, loading, isAuthed } = useAuth()
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!role) return
    let mounted = true
    ;(async () => {
      try {
        const data = isTeacherRole(role) ? await getTeacherResults() : await getStudentResults()
        if (mounted) setRows(data)
      } catch {
        if (mounted) setRows([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [role])

  if (!loading && !isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <Card className="rounded-[36px] bg-white/95 p-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">
          {isTeacherRole(role) ? t('academy.studentResults') : t('academy.myResults')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isStudentRole(role)
            ? t('academy.resultsStudentDescription')
            : t('academy.resultsTeacherDescription')}
        </p>
        <div className="mt-5">
          <ResultTable rows={rows} />
        </div>
      </Card>
    </SectionWrapper>
  )
}

export default ResultsPage
