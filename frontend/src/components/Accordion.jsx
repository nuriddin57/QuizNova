import { useState } from 'react'
import { HiChevronDown } from 'react-icons/hi2'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils/cn'

const AccordionItem = ({ item, isOpen, onToggle }) => (
  <div className="rounded-3xl bg-white/80 p-5 shadow-soft">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <div>
        <p className="text-base font-semibold text-slate-900">{item.question}</p>
      </div>
      <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
        <HiChevronDown className="text-lg text-primary-400" />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 text-sm text-slate-600"
        >
          {item.answer}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
)

const Accordion = ({ items = [], allowMultiple = false, className = '' }) => {
  const [openItems, setOpenItems] = useState([])

  const toggleItem = (id) => {
    if (allowMultiple) {
      setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    } else {
      setOpenItems((prev) => (prev[0] === id ? [] : [id]))
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item) => (
        <AccordionItem key={item.id} item={item} isOpen={openItems.includes(item.id)} onToggle={() => toggleItem(item.id)} />
      ))}
    </div>
  )
}

export default Accordion
