import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const SecondaryButton = ({ children, className = '', Icon, as: Component = 'button', ...props }) => (
  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
    <Component
      className={cn('btn-press btn-glass', className)}
      {...props}
    >
      {Icon && <Icon className="text-base" />}
      {children}
    </Component>
  </motion.div>
)

export default SecondaryButton
