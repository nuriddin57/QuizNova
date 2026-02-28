import { cn } from '../utils/cn'

const Chip = ({ label, active = false, onClick, icon: Icon, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-150',
      active
        ? 'border-transparent bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.25)]'
        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-white/10 dark:text-slate-300 dark:hover:border-cyan-300/45 dark:hover:text-cyan-100',
      className
    )}
  >
    {Icon && <Icon className="text-base" />}
    {label}
  </button>
)

export default Chip
