import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { HiPresentationChartBar, HiSparkles, HiUserGroup, HiViewGrid } from 'react-icons/hi'
import Card from '../components/Card'
import LoadingSkeleton from '../components/LoadingSkeleton'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'
import SetCard from '../components/SetCard'
import { getProfile } from '../api/axios'
import {
  dashboardHighlights,
  dashboardQuickActions,
  dashboardTimeline,
  recommendedSets,
  continuePlayingSets,
  achievementBadges,
  leaderboardEntries,
  announcementsFeed,
} from '../utils/dummyData'
import { toastHelpers } from '../utils/toastHelpers'
import { useRoomStore } from '../store/roomStore'

const ANNOUNCEMENTS_READ_KEY = 'quiznova:dashboard:announcements:read'
const resolveText = (t, key, fallback = '') => (key ? t(key) : fallback)
const badgeAccentGradients = [
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-indigo-400 to-violet-500',
  'from-rose-400 to-fuchsia-500',
]

const loadReadAnnouncements = () => {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ANNOUNCEMENTS_READ_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const Dashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const room = useRoomStore((state) => state.room)
  const navItems = [
    { key: 'home', label: t('dashboardPage.home'), icon: HiViewGrid },
    { key: 'assignments', label: t('dashboardPage.assignments'), icon: HiPresentationChartBar },
    { key: 'students', label: t('dashboardPage.students'), icon: HiUserGroup },
    { key: 'rewards', label: t('dashboardPage.rewards'), icon: HiSparkles },
  ]
  const [profile, setProfile] = useState(null)
  const [activeNav, setActiveNav] = useState('home')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false)
  const [readAnnouncements, setReadAnnouncements] = useState(() => loadReadAnnouncements())
  const sectionRefs = useRef({
    home: null,
    assignments: null,
    students: null,
    rewards: null,
  })
  const schoolName = profile?.school || profile?.school_name || t('dashboardPage.defaultSchool')
  const streakDays = Number.isFinite(Number(profile?.streak)) ? Number(profile.streak) : 0

  const recentActivityItems = showAllActivity ? dashboardTimeline : dashboardTimeline.slice(0, 3)
  const announcementItems = showAllAnnouncements ? announcementsFeed : announcementsFeed.slice(0, 2)
  const unreadAnnouncementsCount = announcementsFeed.filter((item) => !readAnnouncements[item.id]).length

  const setSectionRef = (key) => (node) => {
    sectionRefs.current[key] = node
  }

  const goToSection = (key) => {
    setActiveNav(key)
    const section = sectionRefs.current[key]
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const data = await getProfile()
      if (mounted) setProfile(data)
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const nextKey = visible?.target?.dataset?.section
        if (nextKey) setActiveNav(nextKey)
      },
      { threshold: [0.35, 0.6], rootMargin: '-12% 0px -55% 0px' }
    )

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ANNOUNCEMENTS_READ_KEY, JSON.stringify(readAnnouncements))
  }, [readAnnouncements])

  const handleAction = (actionId) => {
    if (actionId === 'host_game') {
      navigate('/host')
      return
    }
    if (actionId === 'join_game') {
      navigate('/join')
      return
    }
    if (actionId === 'create_set') {
      navigate('/admin-panel')
      return
    }
    if (actionId === 'assign_hw') {
      toastHelpers.success(t('dashboardPage.msgAssignHw'))
      return
    }
    toastHelpers.success(t('dashboardPage.actionTriggered'))
  }

  const handleRecentActivityOpen = (item) => {
    if (!item?.id) return
    if (item.id === 'tl-1') {
      if (room?.code) {
        navigate(`/room/${room.code}`)
      } else {
        navigate('/host?mode=classic')
      }
      return
    }
    if (item.id === 'tl-2') {
      navigate('/sets/set-fractions')
      return
    }
    if (item.id === 'tl-3') {
      navigate('/support')
      return
    }
    if (item.id === 'tl-4') {
      navigate('/discover')
      return
    }
    toastHelpers.info(resolveText(t, item.titleKey, item.title))
  }

  const toggleAnnouncementRead = (announcementId) => {
    setReadAnnouncements((prev) => ({ ...prev, [announcementId]: !prev[announcementId] }))
  }

  const handleAnnouncementOpen = (announcement) => {
    if (!announcement?.id) return
    setReadAnnouncements((prev) => ({ ...prev, [announcement.id]: true }))

    if (announcement.id === 'ann-1') {
      navigate('/discover')
      return
    }
    if (announcement.id === 'ann-2') {
      navigate('/lobby')
      return
    }
    if (announcement.id === 'ann-3') {
      navigate('/support')
      return
    }
    toastHelpers.info(resolveText(t, announcement.titleKey, announcement.title))
  }

  const handleSaveSet = (title) => () => toastHelpers.success(t('setCard.savedToLibrary', { title }))
  const handleHostSet = (title) => () => toastHelpers.info(t('setCard.hostingShareCode', { title }))

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="light-tile flex items-center gap-3 rounded-3xl p-4">
            <div className="text-3xl">{profile?.avatar || 'A'}</div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{profile?.username || <LoadingSkeleton className="h-4 w-24" />}</p>
              <p className="text-xs uppercase tracking-widest text-primary-400">{t('dashboardPage.teacher')}</p>
            </div>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goToSection(item.key)}
                aria-current={activeNav === item.key ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeNav === item.key
                    ? 'bg-primary-50 text-primary-500'
                    : 'text-slate-500 hover:bg-primary-50 hover:text-primary-500'
                }`}
              >
                <item.icon className="text-lg" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-8">
          <div ref={setSectionRef('home')} data-section="home" className="scroll-mt-24 space-y-8">
            <Card className="grid gap-6 rounded-[36px] bg-gradient-to-r from-primary-500 to-accent-blue text-white lg:grid-cols-[1.3fr,0.7fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/70">{t('dashboardPage.welcomeBack')}</p>
                <h2 className="mt-2 text-3xl font-display font-semibold">
                  {profile ? `${schoolName} ${t('dashboardPage.hub')}` : <LoadingSkeleton className="mt-2 h-8 w-48 bg-white/40" />}
                </h2>
                <p className="mt-4 text-sm text-white/80">{t('dashboardPage.roomCode')}</p>
                <p className="text-4xl font-black tracking-[0.3em]">{room?.code || '-------'}</p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <PrimaryButton type="button" className="bg-white/20 text-white" onClick={() => handleAction('host_game')}>
                    {t('dashboardPage.hostGame')}
                  </PrimaryButton>
                  <SecondaryButton type="button" className="!border-white/40 !bg-white/10 !text-white" onClick={() => handleAction('assign_hw')}>
                    {t('dashboardPage.assignHw')}
                  </SecondaryButton>
                </div>
              </div>
              <div className="space-y-4 rounded-3xl bg-white/10 p-5">
                <div className="rounded-2xl bg-white/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{t('dashboardPage.streak')}</p>
                  <p className="text-3xl font-display font-semibold">{streakDays} {t('dashboardPage.days')}</p>
                  <p className="text-sm text-white/80">{t('dashboardPage.stayHot')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dashboardHighlights.map((highlight) => (
                    <div key={highlight.id} className="rounded-2xl bg-white p-4 text-slate-900 shadow-sm ring-1 ring-slate-200/80">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">{resolveText(t, highlight.labelKey, highlight.label)}</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">{highlight.value}</p>
                      <p className="text-xs font-semibold text-primary-700">{resolveText(t, highlight.badgeKey, highlight.badge)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardQuickActions.map((action) => (
                <Card key={action.id} className="flex h-full flex-col rounded-[28px] bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{resolveText(t, action.descriptionKey, action.description)}</p>
                      <h3 className="text-xl font-semibold text-slate-900">{resolveText(t, action.labelKey, action.label)}</h3>
                    </div>
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <PrimaryButton type="button" className="mt-4 w-full justify-center" onClick={() => handleAction(action.actionId)}>
                    {t('dashboardPage.go')}
                  </PrimaryButton>
                </Card>
              ))}
            </div>
          </div>

          <div ref={setSectionRef('students')} data-section="students" className="scroll-mt-24">
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <Card className="rounded-[32px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.recentActivity')}</h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary-500"
                    onClick={() => setShowAllActivity((prev) => !prev)}
                  >
                    {showAllActivity ? t('dashboardPage.showLess') : t('dashboardPage.viewAll')}
                  </button>
                </div>
                <div className="mt-6 space-y-4">
                  {recentActivityItems.map((item) => (
                    <div key={item.id} className="light-tile flex items-start gap-4 rounded-2xl px-4 py-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900">{resolveText(t, item.titleKey, item.title)}</p>
                        <p className="text-sm text-slate-500">{resolveText(t, item.detailKey, item.detail)}</p>
                        <p className="text-xs font-semibold text-primary-400">{resolveText(t, item.timestampKey, item.timestamp)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRecentActivityOpen(item)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-600"
                      >
                        {t('dashboardPage.open')}
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="rounded-[32px]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.announcements')}</h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-300/60 dark:bg-primary-500/32 dark:text-white">
                      {unreadAnnouncementsCount} {t('dashboardPage.unread')}
                    </span>
                    <button
                      type="button"
                      className="rounded-full px-2 py-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-cyan-100 dark:hover:text-white"
                      onClick={() => setShowAllAnnouncements((prev) => !prev)}
                    >
                      {showAllAnnouncements ? t('dashboardPage.showLess') : t('dashboardPage.viewAll')}
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  {announcementItems.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`light-tile rounded-2xl p-4 ${readAnnouncements[announcement.id] ? 'opacity-90' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{resolveText(t, announcement.titleKey, announcement.title)}</p>
                          <p className="text-sm text-slate-500">{resolveText(t, announcement.detailKey, announcement.detail)}</p>
                          <p className="text-xs font-semibold text-primary-400">{resolveText(t, announcement.timeKey, announcement.time)}</p>
                        </div>
                        {!readAnnouncements[announcement.id] && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAnnouncementOpen(announcement)}
                          className="rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-400"
                        >
                          {t('dashboardPage.open')}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAnnouncementRead(announcement.id)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-600"
                        >
                          {readAnnouncements[announcement.id] ? t('dashboardPage.markUnread') : t('dashboardPage.markRead')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div ref={setSectionRef('assignments')} data-section="assignments" className="scroll-mt-24">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="rounded-[32px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.recommendedSets')}</h3>
                  <SecondaryButton as={Link} to="/discover" className="!px-4 !py-2 !text-xs">
                    {t('dashboardPage.viewAll')}
                  </SecondaryButton>
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {recommendedSets.slice(0, 2).map((set) => (
                    <SetCard
                      key={set.id}
                      {...set}
                      onSave={handleSaveSet(resolveText(t, set.titleKey, set.title))}
                      onHost={handleHostSet(resolveText(t, set.titleKey, set.title))}
                    />
                  ))}
                </div>
              </Card>
              <Card className="rounded-[32px]">
                <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.continuePlaying')}</h3>
                <div className="mt-4 space-y-4">
                  {continuePlayingSets.map((session) => (
                    <div key={session.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                        <p>{resolveText(t, session.titleKey, session.title)}</p>
                        <span>{session.progress}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-surface-soft">
                        <div className={`h-full rounded-full bg-gradient-to-r ${session.color}`} style={{ width: `${session.progress}%` }} />
                      </div>
                      <p className="text-xs font-semibold text-primary-400">{t('dashboardPage.mode')}: {resolveText(t, session.modeKey, session.mode)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div ref={setSectionRef('rewards')} data-section="rewards" className="scroll-mt-24">
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="rounded-[32px]">
                <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.achievements')}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {achievementBadges.map((badge, index) => (
                    <div
                      key={badge.id}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition duration-150 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.1)] dark:border-white/12 dark:bg-white/10 dark:shadow-none"
                    >
                      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${badgeAccentGradients[index % badgeAccentGradients.length]}`} />
                      <div className="mt-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-white/10">
                        {badge.icon}
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{resolveText(t, badge.titleKey, badge.title)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{resolveText(t, badge.detailKey, badge.detail)}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="rounded-[32px] lg:col-span-1">
                <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.leaderboard')}</h3>
                <div className="mt-4 space-y-3">
                  {leaderboardEntries.map((entry, index) => (
                    <div key={entry.id} className="light-tile flex items-center justify-between rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                        <p className="text-sm font-semibold text-slate-900">{entry.teacher}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary-500">{entry.points} {t('dashboardPage.points')}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="rounded-[32px]">
                <h3 className="text-xl font-semibold text-slate-900">{t('dashboardPage.rankLeague')}</h3>
                <div className="light-tile mt-4 rounded-3xl p-5 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('dashboardPage.league')}</p>
                  <p className="mt-2 text-3xl font-display font-semibold text-slate-900">{profile?.league ?? t('dashboardPage.defaultLeague')}</p>
                  <p className="mt-1 text-sm text-slate-500">{profile?.rank ?? t('dashboardPage.defaultRank')} {t('dashboardPage.global')}</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p>{t('dashboardPage.hostMore')}</p>
                  <PrimaryButton type="button" className="mt-4 w-full justify-center" onClick={() => handleAction('host_game')}>
                    {t('dashboardPage.pushToCosmic')}
                  </PrimaryButton>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}

export default Dashboard
