import { useTranslation } from 'react-i18next'

import Card from './Card'

const SubjectPerformanceCard = ({ item }) => {
  const { t } = useTranslation()

  return (
    <Card className="rounded-[28px] bg-white/95 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">{t('academy.subjectPerformance')}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.subject_name || item.subject || '-'}</h3>
      <p className="mt-3 text-sm text-slate-600">
        {t('academy.attempts')}: {item.attempts ?? item.total_students_attempted ?? 0} | {t('academy.best')}: {Number(item.best_score ?? item.top_score ?? 0).toFixed(1)}
      </p>
      <p className="text-sm text-slate-600">
        {t('academy.average')}: {Number(item.average_score ?? item.average_class_performance ?? 0).toFixed(1)} | {t('academy.pass')}: {item.pass_count ?? '-'} | {t('academy.fail')}: {item.fail_count ?? '-'}
      </p>
    </Card>
  )
}

export default SubjectPerformanceCard
