import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const baseVariants = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
}

const SectionWrapper = ({
  children,
  as: Component = 'section',
  id,
  className = '',
  contentClass = '',
  disableMotion = false,
}) => {
  const Wrapper = disableMotion ? 'div' : motion.div
  const motionProps = disableMotion
    ? {}
    : {
        initial: baseVariants.initial,
        whileInView: baseVariants.whileInView,
        viewport: { once: true, amount: 0.2, margin: '-80px' },
        transition: { duration: 0.35, ease: 'easeOut' },
      }

  return (
    <Component id={id} className={cn('py-20 lg:py-24', className)}>
      <Wrapper {...motionProps} className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8', contentClass)}>
        {children}
      </Wrapper>
    </Component>
  )
}

export default SectionWrapper
