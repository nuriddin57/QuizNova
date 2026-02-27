import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const InputField = ({ label, icon: Icon, error, className = '', ...props }) => (
  <label className="flex w-full flex-col gap-2 text-sm font-semibold text-slate-600">
    {label}
    <motion.div whileFocusWithin={{ scale: 1 }} className={cn('relative w-full')}> 
      {Icon && (
        <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-primary-400" />
      )}
      <input
        className={cn(
          'w-full rounded-2xl border border-transparent bg-white px-5 py-3 pl-12 text-base font-medium text-slate-800 shadow-soft transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100/80',
          error && 'border-rose-300 focus:ring-rose-100',
          className
        )}
        {...props}
      />
      {error && <span className="mt-2 block text-xs font-medium text-rose-500">{error}</span>}
    </motion.div>
  </label>
)

export default InputField
