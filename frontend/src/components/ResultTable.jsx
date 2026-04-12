import { useTranslation } from 'react-i18next'

import { formatDate } from '../utils/intl'

const ResultTable = ({ rows = [], emptyText = '' }) => {
  const { t } = useTranslation()

  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        {emptyText || t('academy.noResultsYet')}
      </p>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">{t('academy.student')}</th>
            <th className="px-4 py-3 text-left">{t('academy.studentId')}</th>
            <th className="px-4 py-3 text-left">{t('academy.field')}</th>
            <th className="px-4 py-3 text-left">{t('academy.section')}</th>
            <th className="px-4 py-3 text-left">{t('academy.quiz')}</th>
            <th className="px-4 py-3 text-left">{t('academy.submittedAt')}</th>
            <th className="px-4 py-3 text-left">{t('academy.score')}</th>
            <th className="px-4 py-3 text-left">{t('academy.correctWrong')}</th>
            <th className="px-4 py-3 text-left">{t('academy.percentage')}</th>
            <th className="px-4 py-3 text-left">{t('academy.status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{row.student_name || row.student_email || '-'}</p>
                <p className="mt-1 break-all text-xs text-slate-500">{row.student_email || '-'}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{row.student_id || row.student_id_value || '-'}</td>
              <td className="px-4 py-3 text-slate-700">{row.field || '-'}</td>
              <td className="px-4 py-3 text-slate-700">{row.section || '-'}</td>
              <td className="px-4 py-3 break-words text-slate-700">
                <p className="font-medium text-slate-900">{row.quiz_title || '-'}</p>
                <p className="mt-1 text-xs text-slate-500">{row.quiz_subject || '-'}</p>
              </td>
              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                {row.submitted_at ? formatDate(row.submitted_at, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.score}</td>
              <td className="px-4 py-3 text-slate-700">{row.correct_answers}/{row.total_questions}</td>
              <td className="px-4 py-3 text-slate-700">{Number(row.percentage || 0).toFixed(2)}%</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    row.pass_fail_status === 'pass'
                      ? 'bg-emerald-100 text-emerald-700'
                      : row.pass_fail_status === 'fail'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {row.pass_fail_status === 'pass'
                    ? t('academy.pass')
                    : row.pass_fail_status === 'fail'
                    ? t('academy.fail')
                    : t('academy.pending')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResultTable
