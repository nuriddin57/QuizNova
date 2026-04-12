import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { HiArrowTrendingUp, HiSparkles, HiUserGroup } from 'react-icons/hi2'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import Card from '../components/Card'
import SectionWrapper from '../components/SectionWrapper'
import StatCard from '../components/StatCard'
import ModeCard from '../components/ModeCard'
import SetCard from '../components/SetCard'
import Carousel from '../components/Carousel'
import Accordion from '../components/Accordion'
import Chip from '../components/Chip'
import Badge from '../components/Badge'
import {
  featureTiles,
  heroStats,
  recentActivity,
  socialProofStats,
  howItWorksSteps,
  gameModes,
  trendingSets,
  categoryChips,
  faqItems,
  newsletterPerks,
} from '../utils/dummyData'
import { toastHelpers } from '../utils/toastHelpers'
import { getCurrentUserRole, isAuthenticated } from '../utils/auth'
import { useRoomStore } from '../store/roomStore'
import { getCurrentWeeklyChallenge, getPublicTestimonials } from '../api/marketing'
import TestimonialCard from '../components/home/TestimonialCard'
import WeeklyChallengeSpotlight from '../components/home/WeeklyChallengeSpotlight'
import AudienceBenefitsSection from '../components/home/AudienceBenefitsSection'
import LoadingSkeleton from '../components/LoadingSkeleton'
import SectionStatusCard from '../components/home/SectionStatusCard'

const statAccents = [
  'from-[#6F5BFF] via-[#8C7CFF] to-[#C9B6FF]',
  'from-[#45E0FF] via-[#2EC9FF] to-[#1A8DFF]',
  'from-[#FFB347] via-[#FF8A5B] to-[#FF6B9C]',
  'from-[#7BF6D9] via-[#45E0FF] to-[#5B6CFF]',
]

const resolveText = (t, key, fallback = '') => (key ? t(key) : fallback)

const Landing = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const room = useRoomStore((state) => state.room)
  const [activeCategory, setActiveCategory] = useState(categoryChips[0]?.value || 'Math')
  const [testimonials, setTestimonials] = useState([])
  const [testimonialsLoading, setTestimonialsLoading] = useState(true)
  const [testimonialsError, setTestimonialsError] = useState(false)
  const [weeklyChallenge, setWeeklyChallenge] = useState(null)
  const [challengeLoading, setChallengeLoading] = useState(true)
  const [challengeError, setChallengeError] = useState(false)
  const authed = isAuthenticated()
  const role = getCurrentUserRole()

  useEffect(() => {
    let mounted = true

    const loadTestimonials = async () => {
      try {
        setTestimonialsLoading(true)
        setTestimonialsError(false)
        const data = await getPublicTestimonials()
        if (mounted) setTestimonials(data)
      } catch {
        if (mounted) {
          setTestimonials([])
          setTestimonialsError(true)
        }
      } finally {
        if (mounted) setTestimonialsLoading(false)
      }
    }

    const loadChallenge = async () => {
      try {
        setChallengeLoading(true)
        setChallengeError(false)
        const data = await getCurrentWeeklyChallenge()
        if (mounted) setWeeklyChallenge(data)
      } catch {
        if (mounted) {
          setWeeklyChallenge(null)
          setChallengeError(true)
        }
      } finally {
        if (mounted) setChallengeLoading(false)
      }
    }

    loadTestimonials()
    loadChallenge()

    return () => {
      mounted = false
    }
  }, [])

  const audienceCards = useMemo(
    () => [
      {
        id: 'teacher-benefits',
        eyebrowKey: 'landing.audience.teacher.eyebrow',
        titleKey: 'landing.audience.teacher.title',
        descriptionKey: 'landing.audience.teacher.description',
        iconBgClass: 'bg-gradient-to-br from-primary-500 to-accent-blue',
        Icon: HiSparkles,
        benefits: [
          { icon: 'teacher_quizzes', titleKey: 'landing.audience.teacher.benefits.quizzesTitle', bodyKey: 'landing.audience.teacher.benefits.quizzesBody' },
          { icon: 'teacher_live', titleKey: 'landing.audience.teacher.benefits.liveTitle', bodyKey: 'landing.audience.teacher.benefits.liveBody' },
          { icon: 'teacher_progress', titleKey: 'landing.audience.teacher.benefits.progressTitle', bodyKey: 'landing.audience.teacher.benefits.progressBody' },
          { icon: 'teacher_leaderboard', titleKey: 'landing.audience.teacher.benefits.leaderboardTitle', bodyKey: 'landing.audience.teacher.benefits.leaderboardBody' },
        ],
        primaryCta: {
          to: role === 'teacher' || role === 'admin' ? '/teacher/dashboard' : '/register',
          labelKey: role === 'teacher' || role === 'admin' ? 'landing.audience.teacher.primaryDashboard' : 'landing.audience.teacher.primarySignup',
        },
        secondaryCta: {
          to: role === 'teacher' || role === 'admin' ? '/teacher/analytics' : '/login',
          labelKey: 'landing.audience.teacher.secondaryLearnMore',
        },
      },
      {
        id: 'parent-benefits',
        eyebrowKey: 'landing.audience.parent.eyebrow',
        titleKey: 'landing.audience.parent.title',
        descriptionKey: 'landing.audience.parent.description',
        iconBgClass: 'bg-gradient-to-br from-accent-cyan to-primary-500',
        Icon: HiUserGroup,
        benefits: [
          { icon: 'parent_progress', titleKey: 'landing.audience.parent.benefits.progressTitle', bodyKey: 'landing.audience.parent.benefits.progressBody' },
          { icon: 'parent_challenge', titleKey: 'landing.audience.parent.benefits.challengeTitle', bodyKey: 'landing.audience.parent.benefits.challengeBody' },
          { icon: 'parent_strengths', titleKey: 'landing.audience.parent.benefits.strengthsTitle', bodyKey: 'landing.audience.parent.benefits.strengthsBody' },
          { icon: 'parent_activity', titleKey: 'landing.audience.parent.benefits.activityTitle', bodyKey: 'landing.audience.parent.benefits.activityBody' },
        ],
        primaryCta: {
          to: '/parents',
          labelKey: 'landing.audience.parent.primaryInfo',
        },
        secondaryCta: {
          to: authed ? '/results' : '/login',
          labelKey: 'landing.audience.parent.secondaryTrack',
        },
      },
    ],
    [authed, role]
  )

  const handleCopyChallenge = async () => {
    if (!weeklyChallenge?.code) return
    try {
      await navigator.clipboard.writeText(weeklyChallenge.code)
      toastHelpers.copy(t('landing.challengeCopied'))
    } catch (error) {
      toastHelpers.info(`${t('landing.challengeCode')}: ${weeklyChallenge.code}`)
    }
  }

  const handleNewsletter = (event) => {
    event.preventDefault()
    event.target.reset()
    toastHelpers.success(t('landing.newsletterSigned'))
  }

  const handleSaveSet = (title) => () => toastHelpers.success(t('setCard.savedToLibrary', { title }))
  const handleHostSetLocalized = (title) => () => toastHelpers.info(t('setCard.hostingShareCode', { title }))
  const goToLogin = (target) => navigate('/login', { state: { from: target } })
  const handleHowItWorksAction = (actionId) => {
    if (actionId === 'prepare_quiz') {
      if (!authed) return goToLogin('/admin-panel')
      navigate('/admin-panel')
      return
    }
    if (actionId === 'start_session') {
      if (!authed) return goToLogin('/host')
      navigate('/host')
      return
    }
    if (actionId === 'view_results') {
      if (room?.code) {
        navigate(`/game/${room?.sessionId || 'live'}`)
        return
      }
      if (!authed) return goToLogin('/dashboard')
      navigate('/dashboard')
    }
  }
  const activeCategoryLabel = resolveText(
    t,
    categoryChips.find((chip) => chip.value === activeCategory)?.labelKey,
    activeCategory
  )

  return (
    <div className="space-y-20 pb-24">
      <SectionWrapper id="hero" className="flex min-h-[calc(100vh-5rem)] items-center pt-0">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="frost-card relative overflow-hidden rounded-[34px] p-8 md:p-10">
            <motion.span
              className="absolute -right-8 top-10 hidden h-32 w-32 rounded-3xl bg-primary-400/30 blur-3xl lg:block"
              animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 8 }}
            />
            <motion.span
              className="absolute -bottom-8 left-4 hidden h-24 w-24 rounded-full bg-accent-cyan/25 blur-2xl lg:block"
              animate={{ opacity: [0.3, 0.6, 0.3], y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
            />
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 dark:border-cyan-300/40 dark:bg-cyan-300/12 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary-400 via-accent-blue to-accent-cyan" />
                {t('landing.heroBadge')}
              </p>
              <h1 className="mt-6 text-5xl font-display font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-7xl">
                {t('landing.heroTitlePrefix')} <span className="bg-gradient-to-r from-primary-300 via-accent-blue to-accent-cyan bg-clip-text text-transparent">{t('landing.heroTitleAccent')}</span> {t('landing.heroTitleSuffix')}
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-slate-600 dark:text-slate-300">{t('landing.heroDesc')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton as={Link} to="/login">
                  {t('landing.startFree')}
                </PrimaryButton>
                <SecondaryButton as={Link} to="/discover" className="min-w-[180px] justify-center">
                  {t('landing.browseSets')}
                </SecondaryButton>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {heroStats.map((stat) => (
                  <Card key={stat.id} hover={false} className="rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-cyan-100">{stat.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{resolveText(t, stat.labelKey)}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div className="frost-card relative overflow-hidden rounded-[34px] p-8 text-slate-900 dark:text-white">
            <motion.div
              className="absolute -top-10 right-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary-400/80 via-accent-blue/70 to-accent-cyan/65 blur-[2px]"
              animate={{ y: [0, -10, 0], x: [0, 8, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-4 rounded-[30px] border border-slate-200 dark:border-white/15" />
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-lg font-semibold text-indigo-600 dark:text-cyan-100">{t('landing.liveDashboard')}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{t('landing.liveDashboardDesc')}</p>
              </div>
              <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-md">
                {recentActivity.map((activity) => (
                  <motion.div key={activity.id} whileHover={{ x: 4 }} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white dark:border-white/12 dark:bg-white/10 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/15 text-xl ${activity.color}`}>{activity.icon}</span>
                      <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{resolveText(t, activity.titleKey)}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{resolveText(t, activity.timeKey)}</p>
                      </div>
                    </div>
                    <span className="text-lg text-indigo-600 dark:text-cyan-100">{'>'}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t('landing.heroPatternNote')}</p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="feature-grid" className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.features')}</p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">{t('landing.featuresTitle')}</h2>
          </div>
          <SecondaryButton as={Link} to="/discover">
            {t('landing.viewAllModes')}
          </SecondaryButton>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featureTiles.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45 }}
              className="frost-card relative overflow-hidden rounded-3xl p-6"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-20 dark:opacity-60`} />
              <div className="relative z-10">
                <div className="text-3xl">{card.icon}</div>
                <h3 className="mt-4 text-2xl font-display font-semibold text-slate-900 dark:text-slate-100">{resolveText(t, card.titleKey)}</h3>
                <p className="mt-3 text-sm text-slate-700 dark:text-white/80">{resolveText(t, card.bodyKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper id="social-proof" className="pt-0">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {socialProofStats.map((stat, index) => (
            <StatCard
              key={stat.id}
              label={resolveText(t, stat.labelKey)}
              value={stat.value}
              detail={resolveText(t, stat.detailKey)}
              icon={stat.icon}
              accent={statAccents[index % statAccents.length]}
            />
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper id="how-it-works" className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.howItWorks')}</p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">{t('landing.howItWorksTitle')}</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {howItWorksSteps.map((step) => (
            <Card key={step.id} className="flex h-full flex-col rounded-[32px] bg-white">
              <Badge tone="primary">{resolveText(t, step.badgeKey)}</Badge>
              <div className="mt-4 text-4xl">{step.icon}</div>
              <h3 className="mt-4 text-2xl font-display font-semibold text-slate-900">{resolveText(t, step.titleKey)}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{resolveText(t, step.bodyKey)}</p>
              <SecondaryButton
                type="button"
                className="mt-5 w-full justify-center"
                onClick={() => handleHowItWorksAction(step.actionId)}
              >
                {resolveText(t, step.ctaKey, t('landing.startFree'))}
              </SecondaryButton>
            </Card>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper id="game-modes" className="pt-0">
        <Carousel
          title={t('landing.gameModes')}
          description={t('landing.gameModesDesc')}
          items={gameModes}
          renderItem={(mode) => (
            <ModeCard
              {...mode}
              title={resolveText(t, mode.titleKey, mode.title)}
              description={resolveText(t, mode.descriptionKey, mode.description)}
              duration={resolveText(t, mode.durationKey, mode.duration)}
              tag={resolveText(t, mode.tagKey, mode.tag)}
            />
          )}
          itemWidth="min-w-[280px]"
        />
      </SectionWrapper>

      <SectionWrapper id="trending-sets" className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.popularSets')}</p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">{t('landing.trendingWeek')}</h2>
          </div>
          <SecondaryButton as={Link} to="/discover">
            {t('landing.viewAll')}
          </SecondaryButton>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingSets.map((set) => {
            const setTitle = resolveText(t, set.titleKey, set.title)
            return (
              <SetCard
                key={set.id}
                {...set}
                onSave={handleSaveSet(setTitle)}
                onHost={handleHostSetLocalized(setTitle)}
              />
            )
          })}
        </div>
      </SectionWrapper>

      <SectionWrapper id="categories" className="pt-0">
        <div className="rounded-[36px] bg-white/90 p-6 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.categories')}</p>
              <h3 className="text-2xl font-display font-semibold text-slate-900">{t('landing.curatedSets')}</h3>
            </div>
            <p className="text-sm font-semibold text-slate-500">{t('landing.spotlightReady', { category: activeCategoryLabel })}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {categoryChips.map((chip) => (
              <Chip
                key={chip.value}
                label={resolveText(t, chip.labelKey, chip.value)}
                active={activeCategory === chip.value}
                onClick={() => setActiveCategory(chip.value)}
              />
            ))}
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="weekly-challenge" className="pt-0">
        <WeeklyChallengeSpotlight
          challenge={weeklyChallenge}
          loading={challengeLoading}
          error={challengeError}
          onCopy={handleCopyChallenge}
          authed={authed}
        />
      </SectionWrapper>

      <SectionWrapper id="testimonials" className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.lovedBySchools')}</p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">{t('landing.testimonials')}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{t('landing.testimonialsIntro')}</p>
          </div>
          {!testimonialsLoading && testimonials.length > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
              <HiArrowTrendingUp className="text-primary-500" />
              {t('landing.socialProofSummary', { count: testimonials.length })}
            </div>
          ) : null}
        </div>
        {testimonialsLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="rounded-[32px]" hover={false}>
                <div className="flex items-center gap-4">
                  <LoadingSkeleton className="h-14 w-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <LoadingSkeleton className="h-5 w-40" />
                    <LoadingSkeleton className="h-4 w-28" />
                    <LoadingSkeleton className="h-4 w-36" />
                  </div>
                </div>
                <LoadingSkeleton className="mt-6" lines={4} />
              </Card>
            ))}
          </div>
        ) : testimonialsError ? (
          <div className="mt-8">
            <SectionStatusCard
              title={t('landing.testimonialsUnavailableTitle')}
              body={t('landing.testimonialsUnavailableBody')}
              action={<SecondaryButton as={Link} to={authed ? '/dashboard' : '/login'}>{t('landing.openDashboard')}</SecondaryButton>}
              className="rounded-[32px]"
            />
          </div>
        ) : testimonials.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                roleLabel={t(`landing.testimonialRoles.${testimonial.role}`)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <SectionStatusCard
              title={t('landing.noTestimonialsTitle')}
              body={t('landing.noTestimonialsBody')}
              action={<PrimaryButton as={Link} to={authed ? '/dashboard' : '/login'}>{t('landing.explorePlatform')}</PrimaryButton>}
              className="rounded-[32px]"
            />
          </div>
        )}
      </SectionWrapper>

      <SectionWrapper id="teacher-parent" className="pt-0">
        <div className="mb-6 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.personalizedBenefits')}</p>
          <h2 className="mt-2 text-3xl font-display font-bold text-slate-900">{t('landing.audience.sectionTitle')}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{t('landing.audience.sectionBody')}</p>
        </div>
        <AudienceBenefitsSection cards={audienceCards} />
      </SectionWrapper>

      <SectionWrapper id="faq" className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.faq')}</p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">{t('landing.faqTitle')}</h2>
          </div>
        </div>
        <Accordion
          items={faqItems.map((item) => ({
            ...item,
            question: resolveText(t, item.questionKey, item.question),
            answer: resolveText(t, item.answerKey, item.answer),
          }))}
          allowMultiple
          className="mt-8"
        />
      </SectionWrapper>

      <SectionWrapper id="newsletter" className="pt-0">
        <div className="grid gap-6 rounded-[38px] bg-white/95 p-8 shadow-card lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.stayUpdated')}</p>
            <h2 className="mt-2 text-3xl font-display font-bold text-slate-900">{t('landing.newsletterTitle')}</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {newsletterPerks.map((perkKey) => (
                <li key={perkKey} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary-400" /> {resolveText(t, perkKey, perkKey)}
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={handleNewsletter} className="space-y-4">
            <label className="text-sm font-semibold text-slate-600">{t('landing.email')}</label>
            <input
              required
              type="email"
              className="w-full rounded-2xl border border-transparent bg-surface-soft px-5 py-3 text-base font-semibold text-slate-700 focus:border-primary-200 focus:outline-none focus:ring-4 focus:ring-primary-100"
              placeholder={t('landing.newsletterPlaceholder')}
            />
            <PrimaryButton type="submit" className="w-full justify-center">
              {t('landing.subscribe')}
            </PrimaryButton>
          </form>
        </div>
      </SectionWrapper>

      <SectionWrapper id="footer" className="pt-0" disableMotion>
        <footer className="rounded-[20px] border border-slate-200 bg-white px-6 py-10 text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:rounded-t-[40px] dark:border-white/10 dark:bg-slate-900 dark:text-white">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <p className="text-lg font-display font-semibold text-slate-900 dark:text-white">{t('landing.brandName')}</p>
              <p className="mt-3 text-sm text-slate-500 dark:text-white/70">{t('landing.footerTagline')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-white/60">{t('landing.product')}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-white/80">
                <li><Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/discover">{t('landing.footerLiveModes')}</Link></li>
                <li><Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/dashboard">{t('landing.footerHomework')}</Link></li>
                <li><Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/dashboard">{t('landing.footerReports')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-white/60">{t('landing.community')}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-white/80">
                <li><Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/login">{t('landing.footerTeachers')}</Link></li>
                <li><Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/login">{t('landing.footerParents')}</Link></li>
                <li><Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/join">{t('landing.footerStudents')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-white/80">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-white/60">{t('landing.social')}</p>
                <div className="mt-3 flex gap-4">
                  <a className="hover:text-slate-900 dark:hover:text-primary-200" href="https://discord.com" target="_blank" rel="noreferrer">{t('landing.discord')}</a>
                  <a className="hover:text-slate-900 dark:hover:text-primary-200" href="https://youtube.com" target="_blank" rel="noreferrer">{t('landing.youtube')}</a>
                  <a className="hover:text-slate-900 dark:hover:text-primary-200" href="https://x.com" target="_blank" rel="noreferrer">{t('landing.x')}</a>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/60">
                <Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/privacy">{t('landing.privacy')}</Link> &middot; <Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/terms">{t('landing.terms')}</Link> &middot; <Link className="hover:text-slate-900 dark:hover:text-primary-200" to="/support">{t('landing.support')}</Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-white/60">&copy; {new Date().getFullYear()} {t('landing.brandName')}</p>
            </div>
          </div>
        </footer>
      </SectionWrapper>
    </div>
  )
}

export default Landing


