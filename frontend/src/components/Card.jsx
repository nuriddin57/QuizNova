import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const Card = ({ children, className = '', hover = true }) => (
  <motion.div
    whileHover={hover ? { y: -6 } : undefined}
    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    className={cn(
      'rounded-3xl bg-white/80 p-6 shadow-card ring-1 ring-black/5 backdrop-blur-xl sm:p-7',
      className
    )}
  >
    {children}
  </motion.div>
)

export default Card
