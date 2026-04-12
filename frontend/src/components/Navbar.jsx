import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiBars3BottomRight, HiXMark } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'
import LocaleThemeControl from './LocaleThemeControl'
import { getApiBaseUrl, getHealth } from '../api/axios'
import { clearTokens, getCurrentUserRole, isAuthenticated } from '../utils/auth'
import { toastHelpers } from '../utils/toastHelpers'
import { useRoomStore } from '../store/roomStore'
import { useAuth } from '../context/AuthContext'
import quizNovaLogo from '../assets/brand/quiznova/quiznova-icon.svg'

const Navbar = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearRoom = useRoomStore((state) => state.clearRoom)
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState({ label: t('nav.apiChecking'), tone: 'pending' })
  const lastToneRef = useRef('pending')
  const authed = isAuthenticated()
  const role = getCurrentUserRole()
  const canManageSets = authed && (role === 'teacher' || role === 'admin')

  const links = useMemo(
    () => {
      const baseLinks = [
        { label: t('nav.discover'), path: '/discover' },
        { label: t('academy.subjectsNav'), path: '/subjects' },
        { label: t('nav.dashboard'), path: '/dashboard' },
        { label: t('academy.resultsNav'), path: '/results' },
        { label: t('nav.lobby'), path: '/lobby' },
        { label: t('nav.play'), path: '/play' },
      ]
      if (canManageSets) {
        baseLinks.splice(2, 0, { label: t('nav.adminPanel'), path: role === 'admin' ? '/admin/users' : '/teacher/dashboard' })
      }
      return baseLinks
    },
    [canManageSets, role, t]
  )

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
      } catch {
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
      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-950/70 dark:text-emerald-100'
      : apiStatus.tone === 'offline'
      ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/50 dark:bg-rose-950/70 dark:text-rose-100'
      : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/45 dark:bg-slate-900/80 dark:text-slate-100'

  const handleLogout = () => {
    clearTokens()
    logout()
    clearRoom()
    setOpen(false)
    toastHelpers.success(t('nav.loggedOut'))
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto mt-4 flex w-[95%] max-w-[1200px] items-center rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:frost-panel dark:shadow-soft">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          <img src={quizNovaLogo} alt="QuizNova logo" className="h-9 w-9 rounded-xl object-cover" />
          {t('nav.brand')}
        </Link>

        <nav className="ml-8 hidden flex-1 items-center gap-3 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'text-slate-900 after:absolute after:left-2 after:right-2 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-indigo-500 after:to-blue-500 dark:text-cyan-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-cyan-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <LocaleThemeControl />
          <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${statusStyles}`}>{apiStatus.label}</span>
          {authed ? (
            <SecondaryButton type="button" onClick={handleLogout}>
              {t('nav.logout')}
            </SecondaryButton>
          ) : (
            <>
              <SecondaryButton as={Link} to="/login">{t('nav.login')}</SecondaryButton>
              <PrimaryButton as={Link} to="/login">{t('nav.universityAccess')}</PrimaryButton>
            </>
          )}
        </div>

        <button
          className="btn-glass ml-auto rounded-xl p-2.5 text-slate-700 dark:text-cyan-100 lg:hidden"
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
            className="frost-card mx-auto mt-3 w-[92%] max-w-[1200px] rounded-2xl p-5 lg:hidden"
          >
            <div className="mb-4">
              <LocaleThemeControl compact />
            </div>
            <div className="flex flex-col gap-3">
              {links.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-300/45 dark:hover:bg-cyan-300/10"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <span className={`rounded-xl px-4 py-2 text-sm font-semibold ${statusStyles}`}>{apiStatus.label}</span>
            </div>
            {authed ? (
              <div className="mt-4 flex flex-col gap-3">
                <SecondaryButton type="button" className="w-full" onClick={handleLogout}>
                  {t('nav.logout')}
                </SecondaryButton>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <SecondaryButton as={Link} to="/login" className="w-full" onClick={() => setOpen(false)}>
                  {t('nav.login')}
                </SecondaryButton>
                <PrimaryButton as={Link} to="/login" className="w-full" onClick={() => setOpen(false)}>
                  {t('nav.universityAccess')}
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
