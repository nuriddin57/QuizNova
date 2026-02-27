import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiUserCircle, HiEnvelope, HiLockClosed } from 'react-icons/hi2'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import InputField from '../components/InputField'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { postLogin, postRegister } from '../api/axios'
import { setTokens } from '../utils/auth'

const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'teacher' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const updateField = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const validate = () => {
    const draft = {}
    if (!form.username) draft.username = t('auth.usernameRequired')
    if (!form.email) draft.email = t('auth.emailRequired')
    if (form.password.length < 6) draft.password = t('auth.passwordMin')
    setErrors(draft)
    return Object.keys(draft).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await postRegister({ username: form.username, email: form.email, password: form.password, role: form.role })
      const { data } = await postLogin({ username: form.username, password: form.password })
      setTokens({ access: data?.access, refresh: data?.refresh })
      toast.success(t('auth.accountCreated'))
      navigate('/dashboard')
    } catch (error) {
      // toast handled globally
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto grid w-full max-w-5xl gap-8 rounded-[42px] bg-white/90 px-6 py-12 shadow-card dark:bg-slate-900/90 lg:grid-cols-2 lg:px-14"
    >
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">{t('auth.registerTag')}</p>
        <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-slate-100">{t('auth.registerTitle')}</h2>
        <p className="text-base text-slate-600 dark:text-slate-300">{t('auth.registerDesc')}</p>
        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-300">
          <li>- {t('auth.feature1')}</li>
          <li>- {t('auth.feature2')}</li>
          <li>- {t('auth.feature3')}</li>
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="rounded-3xl bg-surface-soft p-8 shadow-soft dark:bg-slate-800">
        <div className="space-y-4">
          <InputField label={t('auth.username')} icon={HiUserCircle} value={form.username} onChange={updateField('username')} error={errors.username} placeholder={t('auth.usernamePlaceholder')} />
          <InputField label={t('auth.email')} type="email" icon={HiEnvelope} value={form.email} onChange={updateField('email')} error={errors.email} placeholder={t('auth.emailPlaceholder')} />
          <InputField label={t('auth.password')} type="password" icon={HiLockClosed} value={form.password} onChange={updateField('password')} error={errors.password} placeholder={t('auth.passwordPlaceholder')} />
          <label className="flex w-full flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            {t('auth.role')}
            <select
              value={form.role}
              onChange={updateField('role')}
              className="rounded-2xl border border-transparent bg-white px-5 py-3 text-base font-medium text-slate-700 shadow-soft focus:border-primary-200 focus:ring-4 focus:ring-primary-100 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="teacher">{t('auth.teacher')}</option>
              <option value="student">{t('auth.student')}</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          <input required type="checkbox" className="rounded border-primary-200 text-primary-500" />
          {t('auth.agreeTerms')}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? t('auth.creating') : t('auth.createAccount')}
          </PrimaryButton>
          <SecondaryButton as={Link} to="/login" className="w-full justify-center">
            {t('auth.alreadyHave')}
          </SecondaryButton>
        </div>
      </form>
    </motion.section>
  )
}

export default Register
