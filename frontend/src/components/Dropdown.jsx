import { HiChevronDown } from 'react-icons/hi2'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const Dropdown = ({ label, value, options = [], onChange, className = '', renderLabel }) => (
  <label className={cn('relative inline-flex w-full max-w-xs flex-col gap-2 text-sm font-semibold text-slate-600', className)}>
    {label}
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-transparent bg-white px-5 py-3 text-base font-medium text-slate-700 shadow-soft focus:border-primary-200 focus:outline-none focus:ring-4 focus:ring-primary-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderLabel ? renderLabel(option) : option}
          </option>
        ))}
      </select>
      <HiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-primary-400" />
    </motion.div>
  </label>
)

export default Dropdown
