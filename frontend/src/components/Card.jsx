import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const Card = ({ children, className = '', hover = true }) => (
  <motion.div
    whileHover={hover ? { y: -5 } : undefined}
    transition={{ type: 'spring', stiffness: 240, damping: 20 }}
    className={cn(
      'frost-card rounded-[20px] p-6 sm:p-7',
      className
    )}
  >
    {children}
  </motion.div>
)

export default Card
