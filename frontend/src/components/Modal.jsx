import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { IoClose } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import SecondaryButton from './SecondaryButton'

const modalRoot = typeof document !== 'undefined' ? document.body : null

const Modal = ({ isOpen, onClose, title, children, actionLabel, onAction }) => {
  const { t } = useTranslation()
  if (!modalRoot) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-[min(90vw,500px)] rounded-3xl bg-white p-8 shadow-card"
          >
            <button
              aria-label={t('common.close')}
              className="absolute right-4 top-4 rounded-full bg-surface-soft p-2 text-slate-500"
              onClick={onClose}
            >
              <IoClose size={18} />
            </button>
            <h3 className="text-2xl font-display font-semibold text-primary-600">{title}</h3>
            <div className="mt-4 text-slate-600">{children}</div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={onClose}>{t('common.cancel')}</SecondaryButton>
              {actionLabel && (
                <button
                  onClick={onAction}
                  className="rounded-2xl bg-primary-500 px-5 py-2 text-white shadow-glow transition hover:bg-primary-600"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot
  )
}

export default Modal
