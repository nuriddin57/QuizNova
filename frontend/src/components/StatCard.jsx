import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const StatCard = ({ label, value, detail, icon, accent = 'from-indigo-500 to-blue-500' }) => (
  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="frost-card overflow-hidden rounded-[20px]">
    <div className={cn('h-1.5 w-full bg-gradient-to-r', accent)} />
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-display font-semibold leading-tight text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">{detail}</p>
    </div>
  </motion.div>
)

export default StatCard
