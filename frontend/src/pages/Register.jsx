import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import InputField from '../components/InputField'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { useAuth } from '../context/AuthContext'
import { getRoleEmailDomainError, normalizeEmail } from '../utils/roleEmailPolicy'

const initialForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'student',
  student_profile: {
    university: '',
    faculty: '',
    semester: '1',
    group: '',
    student_id: '',
  },
  teacher_profile: {
    university: '',
    department: '',
    employee_id: '',
    subject_area: '',
  },
  parent_profile: {
    relationship: '',
    notes: '',
    linked_students: '',
  },
}

const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const isStudent = form.role === 'student'
  const isParent = form.role === 'parent'

  const profileFields = useMemo(
    () => (isStudent
      ? [
          { key: 'university', label: t('registerPage.profileFields.university') },
          { key: 'faculty', label: t('registerPage.profileFields.faculty') },
          { key: 'semester', label: t('registerPage.profileFields.semester'), type: 'number' },
          { key: 'group', label: t('registerPage.profileFields.group') },
          { key: 'student_id', label: t('registerPage.profileFields.studentId') },
        ]
      : isParent
      ? [
          { key: 'relationship', label: t('registerPage.profileFields.relationship') },
          { key: 'linked_students', label: t('registerPage.profileFields.linkedStudents') },
          { key: 'notes', label: t('registerPage.profileFields.notes') },
        ]
      : [
          { key: 'university', label: t('registerPage.profileFields.university') },
          { key: 'department', label: t('registerPage.profileFields.department') },
          { key: 'employee_id', label: t('registerPage.profileFields.employeeId') },
          { key: 'subject_area', label: t('registerPage.profileFields.subjectArea') },
        ]),
    [isParent, isStudent, t]
  )

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const updateProfileField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [isStudent ? 'student_profile' : isParent ? 'parent_profile' : 'teacher_profile']: {
        ...prev[isStudent ? 'student_profile' : isParent ? 'parent_profile' : 'teacher_profile'],
        [field]: event.target.value,
      },
    }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.full_name.trim()) nextErrors.full_name = t('registerPage.fullNameRequired')
    if (!form.email.trim()) nextErrors.email = t('auth.emailRequired')
    if (form.password.length < 8) nextErrors.password = t('registerPage.passwordMin')
    const domainError = getRoleEmailDomainError(form.role, form.email)
    if (domainError) nextErrors.email = domainError

    const profile = isStudent ? form.student_profile : isParent ? form.parent_profile : form.teacher_profile
    profileFields.forEach(({ key, label }) => {
      if (!String(profile[key] || '').trim()) {
        nextErrors[key] = t('registerPage.fieldRequired', { field: label })
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        email: normalizeEmail(form.email),
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        [isStudent ? 'student_profile' : isParent ? 'parent_profile' : 'teacher_profile']: isStudent ? {
          ...form.student_profile,
          semester: Number(form.student_profile.semester),
        } : isParent ? {
          relationship: form.parent_profile.relationship,
          notes: form.parent_profile.notes,
          linked_students: String(form.parent_profile.linked_students || '')
            .split(',')
            .map((value) => Number(value.trim()))
            .filter(Boolean),
        } : form.teacher_profile,
      }

      const user = await register(payload)
      toast.success(t('auth.accountCreated'))

      if (user?.role === 'admin') {
        navigate('/admin-panel', { replace: true })
      } else if (user?.role === 'teacher') {
        navigate('/teacher/dashboard', { replace: true })
      } else if (user?.role === 'parent') {
        navigate('/parent/dashboard', { replace: true })
      } else {
        navigate('/student/dashboard', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center px-4 py-10"
    >
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr,1fr]">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary-700">
            {t('auth.registerTag')}
          </span>
          <h1 className="mt-5 text-4xl font-display font-semibold text-slate-900">{t('auth.registerTitle')}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{t('auth.registerDesc')}</p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>{t('auth.feature1')}</p>
            <p>{t('auth.feature2')}</p>
            <p>{t('auth.feature3')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4">
            <InputField
              label={t('registerPage.fullName')}
              value={form.full_name}
              onChange={updateField('full_name')}
              placeholder={t('registerPage.fullNamePlaceholder')}
              error={errors.full_name}
            />
            <InputField
              label={t('auth.email')}
              type="email"
              value={form.email}
              onChange={updateField('email')}
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email}
            />
            <InputField
              label={t('auth.password')}
              type="password"
              value={form.password}
              onChange={updateField('password')}
              placeholder={t('auth.passwordPlaceholder')}
              error={errors.password}
            />

            <label className="text-sm font-semibold text-slate-700">
              {t('auth.role')}
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              >
                <option value="student">{t('auth.student')}</option>
                <option value="teacher">{t('auth.teacher')}</option>
                <option value="parent">{t('auth.parent')}</option>
              </select>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {isStudent ? t('registerPage.studentProfile') : isParent ? t('registerPage.parentProfile') : t('registerPage.teacherProfile')}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {profileFields.map(({ key, label, type = 'text' }) => (
                  <InputField
                    key={key}
                    label={label}
                    type={type}
                    value={(isStudent ? form.student_profile : isParent ? form.parent_profile : form.teacher_profile)[key]}
                    onChange={updateProfileField(key)}
                    error={errors[key]}
                  />
                ))}
              </div>
            </div>

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? t('auth.creating') : t('auth.createAccount')}
            </PrimaryButton>
            <SecondaryButton as={Link} to="/login">
              {t('auth.alreadyHave')}
            </SecondaryButton>
          </div>
        </form>
      </div>
    </motion.section>
  )
}

export default Register
