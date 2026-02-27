import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const PrimaryButton = ({ children, className = '', Icon, as: Component = 'button', ...props }) => (
  <motion.div
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <Component
      className={cn(
        'btn-press inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 via-primary-400 to-accent-blue px-6 py-3 text-base font-semibold text-white shadow-glow transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200/70',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="text-lg" />}
      {children}
    </Component>
  </motion.div>
)

export default PrimaryButton
