import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { listUsers } from '../api/auth'
import Card from '../components/Card'
import SectionWrapper from '../components/SectionWrapper'

const AdminUsersPage = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const data = await listUsers()
        if (mounted) {
          setUsers(Array.isArray(data) ? data : data?.results || [])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[32px] bg-white/95">
          <h1 className="text-3xl font-display font-semibold text-slate-900">{t('adminUsers.title')}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t('adminUsers.subtitle')}
          </p>
        </Card>

        <Card className="overflow-hidden rounded-[32px] bg-white/95 p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700">{t('adminUsers.columns.name')}</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700">{t('adminUsers.columns.email')}</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700">{t('adminUsers.columns.role')}</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700">{t('adminUsers.columns.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {!loading && !users.length && (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={4}>
                      {t('adminUsers.noUsers')}
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4 text-slate-900">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || t('adminUsers.unknownUser')}</td>
                    <td className="px-5 py-4 text-slate-600">{user.email}</td>
                    <td className="px-5 py-4 capitalize text-slate-600">{t(`adminUsers.roles.${user.role}`, { defaultValue: user.role })}</td>
                    <td className="px-5 py-4 text-slate-600">{user.is_active ? t('academy.active') : t('academy.inactive')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default AdminUsersPage
