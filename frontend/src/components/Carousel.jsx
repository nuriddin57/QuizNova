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
            {title && <h2 className="text-3xl font-display font-semibold text-slate-900">{title}</h2>}
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          <div className="hidden gap-3 sm:flex">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className="rounded-2xl bg-white/80 p-3 text-lg text-primary-500 shadow-soft"
              onClick={() => scroll('left')}
            >
              <HiChevronLeft />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className="rounded-2xl bg-white/80 p-3 text-lg text-primary-500 shadow-soft"
              onClick={() => scroll('right')}
            >
              <HiChevronRight />
            </motion.button>
          </div>
        </div>
      )}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-200"
      >
        {items.map((item) => (
          <div key={item.id} className={cn('snap-start', itemWidth)}>
            {renderItem?.(item)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Carousel
