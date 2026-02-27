import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiBars3BottomRight, HiXMark } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'
import LocaleThemeControl from './LocaleThemeControl'
import { getApiBaseUrl, getHealth } from '../api/axios'
import { isAuthenticated } from '../utils/auth'
import { toastHelpers } from '../utils/toastHelpers'

const Navbar = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState({ label: t('nav.apiChecking'), tone: 'pending' })
  const lastToneRef = useRef('pending')
  const authed = isAuthenticated()

  const links = useMemo(() => ([
    { label: t('nav.discover'), path: '/discover' },
    { label: t('nav.dashboard'), path: '/dashboard' },
    { label: t('nav.lobby'), path: '/lobby' },
    { label: t('nav.play'), path: '/play' },
  ]), [t])

  useEffect(() => {
    setApiStatus((prev) => ({ ...prev, label: prev.tone === 'pending' ? t('nav.apiChecking') : prev.label }))
  }, [t])

  useEffect(() => {
    let mounted = true
    const checkHealth = async () => {
      try {
        const { status } = await getHealth()
        if (!mounted) return
        const nextTone = status === 'ok' ? 'online' : 'offline'
        setApiStatus({
          label: status === 'ok' ? t('nav.apiOnline') : t('nav.apiIssue'),
          tone: nextTone,
        })
        lastToneRef.current = nextTone
      } catch (error) {
        if (!mounted) return
        setApiStatus({ label: t('nav.apiOffline'), tone: 'offline' })
        if (lastToneRef.current !== 'offline') {
          const baseUrl = getApiBaseUrl() || 'http://127.0.0.1:8001'
          toastHelpers.error(`${t('nav.apiOfflineHelp')} (${baseUrl})`, { id: 'api-offline' })
        }
        lastToneRef.current = 'offline'
      }
    }
    checkHealth()
    const timer = window.setInterval(checkHealth, 60000)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [t])

  const statusStyles =
    apiStatus.tone === 'online'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : apiStatus.tone === 'offline'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto mt-4 flex w-[95%] max-w-6xl items-center rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-soft backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-600">
          <span className="rounded-2xl bg-gradient-to-br from-primary-500 to-accent-blue p-2 text-white shadow-glow">
            *
          </span>
          {t('nav.brand')}
        </Link>

        <nav className="ml-8 hidden flex-1 items-center gap-2 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 shadow-soft dark:bg-slate-800 dark:text-primary-300'
                    : 'text-slate-500 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <LocaleThemeControl />
          <span className={`rounded-2xl px-3 py-1 text-xs font-semibold ${statusStyles}`}>{apiStatus.label}</span>
          {!authed && (
            <>
              <SecondaryButton as={Link} to="/login">{t('nav.login')}</SecondaryButton>
              <PrimaryButton as={Link} to="/register">{t('nav.startPlaying')}</PrimaryButton>
            </>
          )}
        </div>

        <button
          className="ml-auto rounded-2xl border border-primary-100 bg-white/70 p-2.5 text-primary-500 dark:border-slate-700 dark:bg-slate-800/70 lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
        >
          {open ? <HiXMark size={22} /> : <HiBars3BottomRight size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-auto mt-3 w-[92%] max-w-4xl rounded-3xl border border-white/70 bg-white/90 p-5 shadow-card backdrop-blur-xl lg:hidden dark:border-slate-700/70 dark:bg-slate-900/90"
          >
            <div className="mb-4">
              <LocaleThemeControl compact />
            </div>
            <div className="flex flex-col gap-3">
              {links.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-slate-600 transition hover:bg-primary-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <span className={`rounded-2xl px-4 py-2 text-sm font-semibold ${statusStyles}`}>{apiStatus.label}</span>
            </div>
            {!authed && (
              <div className="mt-4 flex flex-col gap-3">
                <SecondaryButton as={Link} to="/login" className="w-full" onClick={() => setOpen(false)}>
                  {t('nav.login')}
                </SecondaryButton>
                <PrimaryButton as={Link} to="/register" className="w-full" onClick={() => setOpen(false)}>
                  {t('nav.startPlaying')}
                </PrimaryButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
