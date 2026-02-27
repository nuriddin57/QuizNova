import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiEnvelope, HiLockClosed } from 'react-icons/hi2'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import InputField from '../components/InputField'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { postLogin, postPasswordReset } from '../api/axios'
import { setTokens } from '../utils/auth'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showReset, setShowReset] = useState(location.pathname === '/forgot-password')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetForm, setResetForm] = useState({ username: '', email: '', newPassword: '' })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }
  const handleResetChange = (field) => (event) => {
    setResetForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  useEffect(() => {
    if (location.pathname === '/forgot-password') {
      setShowReset(true)
    }
  }, [location.pathname])

  const validate = () => {
    const draft = {}
    if (!form.username) draft.username = t('auth.usernameRequired')
    if (!form.password) draft.password = t('auth.passwordRequired')
    setErrors(draft)
    return Object.keys(draft).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await postLogin({ username: form.username, password: form.password })
      setTokens({ access: data?.access, refresh: data?.refresh })
      toast.success(t('auth.welcomeBack'))
      navigate('/dashboard')
    } catch (error) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    if (!resetForm.username && !resetForm.email) {
      toast.error(t('auth.resetNeedUsernameOrEmail'))
      return
    }
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) {
      toast.error(t('auth.passwordMin'))
      return
    }
    setResetLoading(true)
    try {
      await postPasswordReset({
        username: resetForm.username || undefined,
        email: resetForm.email || undefined,
        new_password: resetForm.newPassword,
      })
      toast.success(t('auth.resetSuccess'))
      setShowReset(false)
      setResetForm({ username: '', email: '', newPassword: '' })
    } catch (error) {
      // handled by interceptor
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-5xl flex-col items-center gap-10 rounded-[42px] bg-white/80 px-6 py-14 shadow-card dark:bg-slate-900/80 lg:flex-row lg:px-16"
    >
      <div className="w-full lg:w-1/2">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">{t('auth.loginTag')}</p>
        <h2 className="mt-3 text-4xl font-display font-bold text-slate-900 dark:text-slate-100">{t('auth.loginTitle')}</h2>
        <p className="mt-4 text-base text-slate-500 dark:text-slate-300">{t('auth.loginDesc')}</p>
        <div className="mt-8 rounded-3xl bg-surface-soft p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {t('auth.needAccount')} {' '}
          <Link to="/register" className="font-semibold text-primary-500">
            {t('auth.createOne')}
          </Link>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="w-full rounded-3xl bg-white p-8 shadow-soft dark:bg-slate-900 lg:w-1/2">
        <div className="space-y-5">
          <InputField
            label={t('auth.username')}
            icon={HiEnvelope}
            value={form.username}
            onChange={handleChange('username')}
            error={errors.username}
            placeholder={t('auth.usernamePlaceholder')}
          />
          <InputField
            label={t('auth.password')}
            icon={HiLockClosed}
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded-md border-primary-200 text-primary-500" />
            {t('auth.rememberMe')}
          </label>
          <button type="button" className="font-semibold text-primary-500" onClick={() => setShowReset((prev) => !prev)}>
            {t('auth.forgotPassword')}
          </button>
        </div>
        {showReset && (
          <div className="mt-5 rounded-2xl border border-primary-100 bg-surface-soft p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('auth.resetTitle')}</p>
            <div className="space-y-3">
              <InputField
                label={t('auth.username')}
                value={resetForm.username}
                onChange={handleResetChange('username')}
                placeholder={t('auth.resetUsernameOptional')}
              />
              <InputField
                label={t('auth.email')}
                type="email"
                value={resetForm.email}
                onChange={handleResetChange('email')}
                placeholder={t('auth.resetEmailOptional')}
              />
              <InputField
                label={t('auth.resetNewPassword')}
                type="password"
                value={resetForm.newPassword}
                onChange={handleResetChange('newPassword')}
                placeholder={t('auth.passwordPlaceholder')}
              />
              <div className="flex gap-2 pt-1">
                <SecondaryButton type="button" className="flex-1 justify-center" onClick={() => setShowReset(false)}>
                  {t('common.cancel')}
                </SecondaryButton>
                <PrimaryButton type="button" className="flex-1 justify-center" disabled={resetLoading} onClick={handlePasswordReset}>
                  {resetLoading ? t('auth.resetting') : t('auth.resetPassword')}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.logIn')}
          </PrimaryButton>
          <SecondaryButton as={Link} to="/register" className="w-full justify-center">
            {t('auth.needRegister')}
          </SecondaryButton>
        </div>
      </form>
    </motion.section>
  )
}

export default Login
