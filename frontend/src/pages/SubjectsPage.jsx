import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { listStudyFields } from '../api/fields'
import { listSubjects } from '../api/subjects'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SectionWrapper from '../components/SectionWrapper'
import SubjectCard from '../components/SubjectCard'
import SubjectFilterBar from '../components/SubjectFilterBar'
import { useAuth } from '../context/AuthContext'
import { isTeacherRole } from '../utils/role'

const SubjectsPage = () => {
  const { t } = useTranslation()
  const { role } = useAuth()
  const [fields, setFields] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({ q: '', field_id: '', semester: '', is_active: 'true' })

  useEffect(() => {
    listStudyFields().then(setFields).catch(() => setFields([]))
  }, [])

  useEffect(() => {
    listSubjects(filters).then(setSubjects).catch(() => setSubjects([]))
  }, [filters])

  const semesters = useMemo(() => Array.from({ length: 8 }, (_, index) => index + 1), [])

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('academy.subjectsNav')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{t('academy.subjectCatalogTitle')}</h1>
            </div>
            {isTeacherRole(role) ? <PrimaryButton as={Link} to="/teacher/quiz/create">{t('academy.createQuiz')}</PrimaryButton> : null}
          </div>
        </Card>
        <SubjectFilterBar fields={fields} semesters={semesters} value={filters} onChange={setFilters} />
        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} actionLabel={t('academy.viewSubject')} actionTo={`/subjects/${subject.id}`} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

export default SubjectsPage
