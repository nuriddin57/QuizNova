import { cn } from '../utils/cn'

const shimmer = 'animate-pulse bg-surface-soft'

const LoadingSkeleton = ({ className = '', lines = 1 }) => {
  if (lines > 1) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className={cn('h-3 rounded-2xl', shimmer)} />
        ))}
      </div>
    )
  }

  return <div className={cn('rounded-2xl', shimmer, className)} />
}

export default LoadingSkeleton
