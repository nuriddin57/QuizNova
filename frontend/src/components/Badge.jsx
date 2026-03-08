import { cn } from '../utils/cn'

const palette = {
  primary: 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-primary-300/70 dark:bg-primary-500/38 dark:text-white',
  accent: 'border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-accent-cyan/70 dark:bg-cyan-500/32 dark:text-white',
  neutral: 'border border-slate-200 bg-white text-slate-600 dark:border-slate-400/60 dark:bg-slate-800/78 dark:text-slate-100',
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
