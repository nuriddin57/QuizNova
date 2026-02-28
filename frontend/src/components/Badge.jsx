import { cn } from '../utils/cn'

const palette = {
  primary: 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-primary-300/45 dark:bg-primary-400/18 dark:text-primary-100',
  accent: 'border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-accent-cyan/45 dark:bg-accent-cyan/15 dark:text-cyan-100',
  neutral: 'border border-slate-200 bg-white text-slate-600 dark:border-white/25 dark:bg-white/10 dark:text-slate-200',
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
