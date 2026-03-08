import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Card from './Card'
import SecondaryButton from './SecondaryButton'

const ModuleCard = ({ module, actionTo }) => {
  const { t } = useTranslation()

  return (
    <Card className="rounded-[28px] bg-white/95 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">{t('academy.moduleLabel')}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{module.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{module.description || t('academy.noModuleDescription')}</p>
          <p className="mt-3 text-xs text-slate-500">{t('academy.topic')}: {module.topic_name || '-'}</p>
        </div>
        {actionTo ? (
          <SecondaryButton as={Link} to={actionTo}>
            {t('academy.openModule')}
          </SecondaryButton>
        ) : null}
      </div>
    </Card>
  )
}

export default ModuleCard
