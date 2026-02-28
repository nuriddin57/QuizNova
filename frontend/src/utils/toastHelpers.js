import i18n from '../i18n'
import toast from 'react-hot-toast'

const baseOptions = {
  duration: 3200,
  style: {
    borderRadius: '999px',
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 600,
  },
}

export const toastHelpers = {
  success: (message) => toast.success(message, baseOptions),
  info: (message) => toast(message, { ...baseOptions, icon: '*' }),
  error: (message) =>
    toast.error(message, {
      ...baseOptions,
      style: {
        ...baseOptions.style,
        background: '#fee2e2',
        color: '#b91c1c',
      },
    }),
  copy: (message = i18n.t('common.copied')) => toast.success(message, { ...baseOptions, icon: '??' }),
}
