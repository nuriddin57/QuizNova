import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { listStudyFields } from '../api/fields'
import Card from '../components/Card'
import FieldSelectDropdown from '../components/FieldSelectDropdown'
import PrimaryButton from '../components/PrimaryButton'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'

const FieldSelection = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, role, updateMyAcademicProfile } = useAuth()
  const [fields, setFields] = useState([])
  const [form, setForm] = useState({
    student_id: '',
    field_of_study: '',
    semester_code: '',
    semester_number: '1',
    section: 'A',
  })
  const [saving, setSaving] = useState(false)
  const semesterNumbers = Array.from({ length: 12 }, (_, index) => index + 1)
  const sections = ['A', 'B', 'C', 'D']

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await listStudyFields()
        if (mounted) setFields(data)
      } catch {
        if (mounted) setFields([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (user) {
      setForm({
        student_id: user.student_id || '',
        field_of_study: String(user.field_of_study || ''),
        semester_code: user.semester_code || '',
        semester_number: String(user.semester_number || '1'),
        section: user.section || 'A',
      })
    }
  }, [user])

  const submit = async () => {
    if (!form.student_id || !form.field_of_study || !form.semester_code || !form.semester_number || !form.section) {
      toast.error(t('fieldSelection.completeProfile'))
      return
    }
    setSaving(true)
    try {
      await updateMyAcademicProfile({
        student_id: form.student_id.trim(),
        field_of_study: Number(form.field_of_study),
        semester_code: form.semester_code,
        semester_number: Number(form.semester_number),
        section: form.section,
      })
      toast.success(t('fieldSelection.updated'))
      if (role === 'student') {
        navigate('/student/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch {
      // handled globally
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <Card className="mx-auto max-w-2xl rounded-[36px] bg-white/95 p-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">{t('fieldSelection.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('fieldSelection.description')}</p>
        <div className="mt-5 space-y-4">
          <input
            value={form.student_id}
            onChange={(event) => setForm((prev) => ({ ...prev, student_id: event.target.value }))}
            placeholder={t('fieldSelection.studentIdPlaceholder')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
          <FieldSelectDropdown
            fields={fields}
            value={form.field_of_study}
            onChange={(value) => setForm((prev) => ({ ...prev, field_of_study: value }))}
            label={t('academy.field')}
          />
          <input
            value={form.semester_code}
            onChange={(event) => setForm((prev) => ({ ...prev, semester_code: event.target.value }))}
            placeholder={t('fieldSelection.semesterCodePlaceholder')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.semester_number}
              onChange={(event) => setForm((prev) => ({ ...prev, semester_number: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              {semesterNumbers.map((semester) => (
                <option key={semester} value={semester}>{t('academy.semesterLabel', { semester })}</option>
              ))}
            </select>
            <select
              value={form.section}
              onChange={(event) => setForm((prev) => ({ ...prev, section: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
            >
              {sections.map((section) => (
                <option key={section} value={section}>{t('fieldSelection.sectionLabel', { section })}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6">
          <PrimaryButton type="button" disabled={saving} onClick={submit}>
            {saving ? t('academy.saving') : t('fieldSelection.save')}
          </PrimaryButton>
        </div>
      </Card>
    </SectionWrapper>
  )
}

export default FieldSelection
