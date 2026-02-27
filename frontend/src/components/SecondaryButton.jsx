import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const SecondaryButton = ({ children, className = '', Icon, as: Component = 'button', ...props }) => (
  <motion.div
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.985 }}
  >
    <Component
      className={cn(
        'btn-press inline-flex items-center justify-center gap-2 rounded-2xl border border-primary-100/60 bg-white/70 px-5 py-2.5 text-sm font-semibold text-primary-600 shadow-soft transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-100',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="text-base" />}
      {children}
    </Component>
  </motion.div>
)

export default SecondaryButton
