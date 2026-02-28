import { useRef } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const Carousel = ({ title, description, items = [], renderItem, className = '', itemWidth = 'min-w-[260px]' }) => {
  const trackRef = useRef(null)

  const scroll = (direction) => {
    const track = trackRef.current
    if (!track) return
    const distance = direction === 'left' ? -320 : 320
    track.scrollBy({ left: distance, behavior: 'smooth' })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && <h2 className="text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
            {description && <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>}
          </div>
          <div className="hidden gap-3 sm:flex">
            <motion.button type="button" whileTap={{ scale: 0.94 }} className="btn-glass rounded-xl p-3 text-lg" onClick={() => scroll('left')}>
              <HiChevronLeft />
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.94 }} className="btn-glass rounded-xl p-3 text-lg" onClick={() => scroll('right')}>
              <HiChevronRight />
            </motion.button>
          </div>
        </div>
      )}

      <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-cyan-400/60">
        {items.map((item) => (
          <div key={item.id} className={cn('snap-start h-full', itemWidth)}>
            {renderItem?.(item)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Carousel

