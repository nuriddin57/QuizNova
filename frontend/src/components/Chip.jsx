import { cn } from '../utils/cn'

const Chip = ({ label, active = false, onClick, icon: Icon, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200',
      active
        ? 'border-transparent bg-primary-500 text-white shadow-glow'
        : 'border-transparent bg-surface-soft text-slate-500 hover:text-primary-500',
      className
    )}
  >
    {Icon && <Icon className="text-base" />}
    {label}
  </button>
)

export default Chip
