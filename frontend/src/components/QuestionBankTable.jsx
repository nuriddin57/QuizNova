import { useTranslation } from 'react-i18next'

import SecondaryButton from './SecondaryButton'

const QuestionBankTable = ({
  rows = [],
  selectedIds = [],
  onToggle,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">{t('academy.pick')}</th>
            <th className="px-4 py-3">{t('academy.question')}</th>
            <th className="px-4 py-3">{t('academy.subject')}</th>
            <th className="px-4 py-3">{t('academy.topic')}</th>
            <th className="px-4 py-3">{t('academy.moduleLabel')}</th>
            <th className="px-4 py-3">{t('academy.difficulty')}</th>
            <th className="px-4 py-3">{t('academy.type')}</th>
            <th className="px-4 py-3">{t('academy.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">
                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => onToggle?.(row.id)} />
              </td>
              <td className="px-4 py-3 text-slate-800">{row.question_text}</td>
              <td className="px-4 py-3 text-slate-600">{row.subject_data?.name || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{row.topic_data?.name || row.topic || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{row.module_data?.title || row.unit_name || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{t(`common.difficulty.${row.difficulty}`, { defaultValue: row.difficulty })}</td>
              <td className="px-4 py-3 text-slate-600">{t(`common.questionType.${row.question_type}`, { defaultValue: row.question_type })}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton type="button" onClick={() => onDuplicate?.(row)}>{t('academy.duplicate')}</SecondaryButton>
                  <SecondaryButton type="button" onClick={() => onDelete?.(row)}>{t('academy.delete')}</SecondaryButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default QuestionBankTable
