import { cn } from '../utils/cn'

const palette = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-blue/10 text-accent-blue',
  neutral: 'bg-surface-soft text-slate-500',
}

const Badge = ({ children, tone = 'primary', className = '' }) => {
  const toneClasses = tone === null ? '' : palette[tone] || palette.neutral

  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', toneClasses, className)}>
      {children}
    </span>
  )
}

export default Badge
