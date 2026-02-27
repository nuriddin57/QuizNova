import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Layout from './components/Layout'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  const location = useLocation()
  const { i18n } = useTranslation()

  return (
    <Layout>
      <AnimatePresence mode="wait" initial={false}>
        <AppRoutes key={`${location.pathname}:${i18n.language}`} />
      </AnimatePresence>
    </Layout>
  )
}
