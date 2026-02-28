import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Badge from './Badge'
import { cn } from '../utils/cn'

const ModeCard = ({ title, description, icon, players, duration, tag, accent }) => {
  const { t } = useTranslation()

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      className="frost-card flex h-full flex-col overflow-hidden rounded-[20px]"
    >
      <div className={cn('h-1.5 w-full bg-gradient-to-r', accent)} />
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{icon}</span>
          <Badge tone={null} className="border border-slate-200 bg-white text-xs text-slate-600 shadow-[0_6px_16px_rgba(15,23,42,0.06)] dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:shadow-none">
            {tag}
          </Badge>
        </div>

        <h3 className="mt-6 text-2xl font-display font-semibold leading-tight text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1 shadow-[0_6px_16px_rgba(15,23,42,0.06)] dark:border-white/20 dark:bg-white/10 dark:shadow-none">
            {players} {t('common.players')}
          </span>
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1 shadow-[0_6px_16px_rgba(15,23,42,0.06)] dark:border-white/20 dark:bg-white/10 dark:shadow-none">
            {duration}
          </span>
        </div>
      </div>
    </motion.article>
  )
}

export default ModeCard
