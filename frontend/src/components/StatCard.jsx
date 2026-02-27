import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const StatCard = ({ label, value, detail, icon, accent = 'from-[#6F5BFF] via-[#8C7CFF] to-[#C9B6FF]' }) => (
  <motion.div
    whileHover={{ y: -6 }}
    transition={{ duration: 0.2 }}
    className={cn('rounded-[26px] p-5 text-white shadow-card', `bg-gradient-to-br ${accent}`)}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{label}</p>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="mt-3 text-3xl font-display font-semibold leading-tight">{value}</p>
    <p className="text-sm text-white/80">{detail}</p>
  </motion.div>
)

export default StatCard
