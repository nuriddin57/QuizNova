import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const PrimaryButton = ({ children, className = '', Icon, as: Component = 'button', ...props }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <span className="neon-gradient-border inline-flex">
      <Component
        className={cn(
          'btn-press inner inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 dark:focus-visible:ring-cyan-300/45',
          className
        )}
        {...props}
      >
        {Icon && <Icon className="text-lg" />}
        {children}
      </Component>
    </span>
  </motion.div>
)

export default PrimaryButton
