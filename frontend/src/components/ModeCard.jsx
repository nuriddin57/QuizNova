import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Badge from './Badge'
import { cn } from '../utils/cn'

const ModeCard = ({ title, description, icon, players, duration, tag, accent }) => {
  const { t } = useTranslation()
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className={cn('flex flex-col rounded-[30px] p-6 text-white shadow-card', `bg-gradient-to-br ${accent}`)}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <Badge tone={null} className="bg-white/20 text-xs text-white">
          {tag}
        </Badge>
      </div>
      <h3 className="mt-6 text-2xl font-display font-semibold leading-tight">{title}</h3>
      <p className="mt-2 text-sm text-white/80">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-white/90">
        <span className="rounded-2xl bg-white/15 px-3 py-1">{players} {t('common.players')}</span>
        <span className="rounded-2xl bg-white/15 px-3 py-1">{duration}</span>
      </div>
    </motion.div>
  )
}

export default ModeCard
