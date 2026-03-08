import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import SecondaryButton from './SecondaryButton'
import Badge from './Badge'
import { cn } from '../utils/cn'

const SetCard = ({
  id,
  title,
  titleKey,
  subject,
  subjectKey,
  category,
  questions,
  question_count,
  plays,
  gradient,
  creator,
  creatorKey,
  owner_username,
  rating,
  detailTo,
  onOpen,
  onHost = () => {},
  onSave = () => {},
}) => {
  const { t } = useTranslation()
  const badgeLabel = subjectKey ? t(subjectKey) : subject || category || t('setCard.defaultSubject')
  const creatorLabel = creatorKey ? t(creatorKey) : creator || owner_username || t('setCard.defaultCreator')
  const titleLabel = titleKey ? t(titleKey) : title
  const questionTotal = questions ?? question_count ?? 0
  const detailPath = detailTo || (id ? `/sets/${id}` : null)

  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="frost-card overflow-hidden rounded-[20px]">
      <div className={cn('h-28 w-full bg-gradient-to-r', gradient)} />
      <div className="space-y-4 px-6 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <Badge tone="primary" className="dark:!border-primary-300/80 dark:!bg-primary-600/58 dark:!text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            {badgeLabel}
          </Badge>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
            {rating ?? 4.5} {'\u2605'}
          </span>
        </div>

        <div>
          {detailPath ? (
            <Link to={detailPath} className="text-2xl font-display font-semibold text-slate-900 transition hover:text-indigo-600 dark:text-slate-100 dark:hover:text-cyan-100">
              {titleLabel}
            </Link>
          ) : (
            <h3 className="text-2xl font-display font-semibold text-slate-900 dark:text-slate-100">{titleLabel}</h3>
          )}
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            {t('setCard.by')} {creatorLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span>{questionTotal} {t('setCard.questionsShort')}</span>
          <span>{plays || 0} {t('setCard.plays')}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {detailPath ? (
            <SecondaryButton as={Link} to={detailPath} type="button" className="!px-4 !py-2" onClick={onOpen}>
              {t('setCard.openSet')}
            </SecondaryButton>
          ) : null}

          <button type="button" onClick={onHost} className="neon-gradient-border inline-flex rounded-2xl p-0">
            <span className="inner inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold">
              {t('setCard.hostMode')}
            </span>
          </button>

          <SecondaryButton type="button" className="!px-4 !py-2" onClick={onSave}>
            {t('setCard.saveSet')}
          </SecondaryButton>
        </div>
      </div>
    </motion.article>
  )
}

export default SetCard
