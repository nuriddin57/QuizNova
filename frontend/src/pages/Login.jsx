import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import Card from '../components/Card'
import RoleLoginSwitcher from '../components/RoleLoginSwitcher'
import StudentLoginForm from '../components/StudentLoginForm'
import TeacherLoginForm from '../components/TeacherLoginForm'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { getApiBaseUrl } from '../api/axios'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)

  const resolveRedirect = (user) => {
    if (user?.role === 'admin') return '/admin-panel'
    if (user?.role === 'teacher') return '/teacher/dashboard'
    if (!user?.field_of_study) return '/field-selection'
    return '/student/dashboard'
  }

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    try {
      const user = await login({ email, password })
      const roleMatches =
        (role === 'student' && user?.role === 'student') ||
        (role === 'teacher' && (user?.role === 'teacher' || user?.role === 'admin'))

      if (!roleMatches) {
        throw new Error('role_mismatch')
      }

      toast.success(role === 'student' ? t('loginPage.studentLoginSuccess') : t('loginPage.teacherLoginSuccess'))
      navigate(resolveRedirect(user), { replace: true })
    } catch (error) {
      if (error.message === 'role_mismatch') {
        toast.error(role === 'student' ? 'This account is not a student account.' : 'This account is not a teacher account.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUniversityLogin = () => {
    window.location.href = `${getApiBaseUrl()}/api/integrations/university/login/`
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card className="overflow-hidden rounded-[36px] border border-slate-200/70 bg-white/95 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary-700">
            {t('loginPage.accessBadge')}
          </span>
          <h1 className="mt-5 text-4xl font-display font-semibold text-slate-900">{t('loginPage.portalTitle')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t('loginPage.portalDescription')}</p>
          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 text-sm text-slate-700">
            <p>{t('loginPage.ruleRestricted')}</p>
            <p className="mt-2">{t('auth.email')}</p>
            <p className="mt-2">{t('auth.password')}</p>
          </div>
        </Card>

        <Card className="rounded-[36px] border border-slate-200/70 bg-white/95 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <RoleLoginSwitcher role={role} onChange={setRole} />
          <div className="mt-6">
            {role === 'student' ? (
              <StudentLoginForm loading={loading} onSubmit={onSubmit} />
            ) : (
              <TeacherLoginForm loading={loading} onSubmit={onSubmit} />
            )}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleUniversityLogin}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              University Login
            </button>
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default Login
