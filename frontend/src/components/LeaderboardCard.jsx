import { useTranslation } from 'react-i18next'

const LeaderboardCard = ({ rows = [] }) => {
  const { t } = useTranslation()

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">{t('teacherAnalytics.leaderboard')}</h3>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={`${row.student_id}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
              <p className="text-sm font-semibold text-slate-700">
                #{index + 1} {row.student_name || row.student_email}
              </p>
              <p className="text-sm font-bold text-primary-600">{Number(row.best_score || 0).toFixed(1)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{t('teacherAnalytics.noLeaderboardData')}</p>
        )}
      </div>
    </div>
  )
}

export default LeaderboardCard
