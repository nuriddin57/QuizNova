import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import PrimaryButton from './PrimaryButton'

const ParentLoginForm = ({ loading = false, onSubmit }) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (event) => {
    event.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        {t('auth.email')}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('loginPage.parentEmailPlaceholder')}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        {t('auth.password')}
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5"
        />
      </label>
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? t('auth.signingIn') : t('loginPage.loginAsParent')}
      </PrimaryButton>
    </form>
  )
}

export default ParentLoginForm
