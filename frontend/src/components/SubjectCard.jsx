import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Card from './Card'
import SecondaryButton from './SecondaryButton'

const SubjectCard = ({ subject, actionLabel, actionTo }) => {
  const { t } = useTranslation()

  return (
    <Card className="rounded-[28px] bg-white/95 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">
            {subject.code} · {t('academy.semesterLabel', { semester: subject.semester })}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{subject.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{subject.description || t('academy.noDescription')}</p>
          <p className="mt-3 text-xs text-slate-500">
            {t('academy.field')}: {subject.field_name || subject.field_data?.name || '-'} | {t('academy.topics')}: {subject.topic_count ?? subject.topics?.length ?? 0}
          </p>
        </div>
        {actionTo ? <SecondaryButton as={Link} to={actionTo}>{actionLabel || t('academy.open')}</SecondaryButton> : null}
      </div>
    </Card>
  )
}

export default SubjectCard
