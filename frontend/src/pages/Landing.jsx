import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
  weeklyChallenge,
  testimonials,
  faqItems,
  teacherParentHighlights,
  newsletterPerks,
} from '../utils/dummyData'
import { toastHelpers } from '../utils/toastHelpers'

const statAccents = [
  'from-[#6F5BFF] via-[#8C7CFF] to-[#C9B6FF]',
  'from-[#45E0FF] via-[#2EC9FF] to-[#1A8DFF]',
  'from-[#FFB347] via-[#FF8A5B] to-[#FF6B9C]',
  'from-[#7BF6D9] via-[#45E0FF] to-[#5B6CFF]',
]

const resolveText = (t, key, fallback = '') => (key ? t(key) : fallback)

const Landing = () => {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState(categoryChips[0]?.value || 'Math')

  const handleCopyChallenge = async () => {
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
  const activeCategoryLabel = resolveText(
    t,
    categoryChips.find((chip) => chip.value === activeCategory)?.labelKey,
    activeCategory
  )

  return (
    <div className="space-y-16 pb-20">
      <SectionWrapper id="hero" className="pt-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-[40px] bg-white/95 p-8 shadow-card">
            <motion.span
              className="absolute -right-8 top-10 hidden h-28 w-28 rounded-3xl bg-primary-400/20 blur-3xl lg:block"
              animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 8 }}
            />
            <motion.span
              className="absolute -bottom-10 left-6 hidden h-16 w-16 rounded-full bg-accent-blue/20 blur-2xl lg:block"
              animate={{ opacity: [0.3, 0.6, 0.3], y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
            />
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-primary-400 to-accent-blue" />
                {t('landing.heroBadge')}
              </p>
              <h1 className="mt-6 text-4xl font-display font-bold leading-tight text-slate-900 sm:text-5xl">
                {t('landing.heroTitlePrefix')} <span className="text-primary-500">{t('landing.heroTitleAccent')}</span> {t('landing.heroTitleSuffix')}
              </h1>
              <p className="mt-4 text-lg text-slate-600">{t('landing.heroDesc')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton as={Link} to="/register">
                  {t('landing.startFree')}
                </PrimaryButton>
                <SecondaryButton as={Link} to="/discover">
                  {t('landing.browseSets')}
                </SecondaryButton>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {heroStats.map((stat) => (
                  <Card key={stat.id} hover={false} className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary-500">{stat.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{resolveText(t, stat.labelKey)}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div className="relative rounded-[40px] bg-gradient-to-br from-primary-500 to-accent-blue p-8 text-white shadow-glow">
            <div className="absolute inset-6 rounded-[34px] border border-white/10" />
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-lg font-semibold">{t('landing.liveDashboard')}</p>
                <p className="text-sm text-white/70">{t('landing.liveDashboardDesc')}</p>
              </div>
              <div className="grid gap-4 rounded-3xl bg-white/10 p-5">
                {recentActivity.map((activity) => (
                  <motion.div key={activity.id} whileHover={{ x: 4 }} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${activity.color}`}>{activity.icon}</span>
                      <div>
                        <p className="text-base font-semibold">{resolveText(t, activity.titleKey)}</p>
                        <p className="text-xs text-white/70">{resolveText(t, activity.timeKey)}</p>
                      </div>
                    </div>
                    <span className="text-lg">{'>'}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-white/70">{t('landing.heroPatternNote')}</p>
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
              className={`rounded-3xl bg-gradient-to-br ${card.accent} p-6 text-white shadow-card`}
            >
              <div className="text-3xl">{card.icon}</div>
              <h3 className="mt-4 text-2xl font-display font-semibold">{resolveText(t, card.titleKey)}</h3>
              <p className="mt-3 text-sm text-white/80">{resolveText(t, card.bodyKey)}</p>
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
            <Card key={step.id} className="h-full rounded-[32px] bg-white">
              <Badge tone="primary">{resolveText(t, step.badgeKey)}</Badge>
              <div className="mt-4 text-4xl">{step.icon}</div>
              <h3 className="mt-4 text-2xl font-display font-semibold text-slate-900">{resolveText(t, step.titleKey)}</h3>
              <p className="mt-2 text-sm text-slate-600">{resolveText(t, step.bodyKey)}</p>
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
        <div className={`rounded-[40px] bg-gradient-to-br ${weeklyChallenge.gradient} p-8 text-white shadow-glow`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">{t('landing.weeklyChallenge')}</p>
              <h2 className="mt-3 text-3xl font-display font-bold">{resolveText(t, weeklyChallenge.titleKey)}</h2>
              <p className="mt-2 text-white/85">{resolveText(t, weeklyChallenge.descriptionKey)}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-white/90">
                <span className="rounded-2xl bg-white/15 px-4 py-2">{t('landing.reward')}: {resolveText(t, weeklyChallenge.rewardKey)}</span>
                <span className="rounded-2xl bg-white/15 px-4 py-2">{resolveText(t, weeklyChallenge.deadlineKey)}</span>
              </div>
            </div>
            <div className="rounded-3xl bg-white/15 p-5 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">{t('landing.challengeCode')}</p>
              <p className="mt-2 text-4xl font-black tracking-[0.3em]">{weeklyChallenge.code}</p>
              <div className="mt-4 flex flex-col gap-3">
                <PrimaryButton type="button" className="bg-white/90 text-primary-600" onClick={handleCopyChallenge}>
                  {t('landing.copyCode')}
                </PrimaryButton>
                <SecondaryButton as={Link} to="/dashboard" className="!border-white/40 !bg-transparent !text-white">
                  {t('landing.viewChallengeDetails')}
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="testimonials" className="pt-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('landing.lovedBySchools')}</p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">{t('landing.testimonials')}</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full rounded-[32px]">
              <div className="text-4xl">{testimonial.avatar}</div>
              <p className="mt-4 text-lg font-semibold text-slate-900">{resolveText(t, testimonial.nameKey, testimonial.name)}</p>
              <p className="text-sm font-semibold text-primary-500">{resolveText(t, testimonial.roleKey, testimonial.role)}</p>
              <p className="text-sm text-slate-500">{resolveText(t, testimonial.schoolKey, testimonial.school)}</p>
              <p className="mt-4 text-base text-slate-600">"{resolveText(t, testimonial.quoteKey, testimonial.quote)}"</p>
            </Card>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper id="teacher-parent" className="pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {teacherParentHighlights.map((card) => (
            <Card key={card.id} className="h-full rounded-[36px]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{resolveText(t, card.titleKey, card.title)}</p>
              <h3 className="mt-3 text-3xl font-display font-semibold text-slate-900">{t('landing.personalizedBenefits')}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {(card.bulletsKeys || card.bullets || []).map((bulletKey) => (
                  <li key={bulletKey} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary-400" />
                    {resolveText(t, bulletKey, bulletKey)}
                  </li>
                ))}
              </ul>
              <PrimaryButton as={Link} to="/register" className="mt-6 w-full justify-center">
                {resolveText(t, card.ctaKey, card.cta)}
              </PrimaryButton>
            </Card>
          ))}
        </div>
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
        <footer className="rounded-t-[40px] bg-slate-900 px-6 py-10 text-white">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <p className="text-lg font-display font-semibold">{t('landing.brandName')}</p>
              <p className="mt-3 text-sm text-white/70">{t('landing.footerTagline')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{t('landing.product')}</p>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li><Link className="hover:text-primary-200" to="/discover">{t('landing.footerLiveModes')}</Link></li>
                <li><Link className="hover:text-primary-200" to="/dashboard">{t('landing.footerHomework')}</Link></li>
                <li><Link className="hover:text-primary-200" to="/dashboard">{t('landing.footerReports')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{t('landing.community')}</p>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li><Link className="hover:text-primary-200" to="/register">{t('landing.footerTeachers')}</Link></li>
                <li><Link className="hover:text-primary-200" to="/register">{t('landing.footerParents')}</Link></li>
                <li><Link className="hover:text-primary-200" to="/join">{t('landing.footerStudents')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4 text-sm text-white/80">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{t('landing.social')}</p>
                <div className="mt-3 flex gap-4">
                  <a className="hover:text-primary-200" href="https://discord.com" target="_blank" rel="noreferrer">{t('landing.discord')}</a>
                  <a className="hover:text-primary-200" href="https://youtube.com" target="_blank" rel="noreferrer">{t('landing.youtube')}</a>
                  <a className="hover:text-primary-200" href="https://x.com" target="_blank" rel="noreferrer">X</a>
                </div>
              </div>
              <p className="text-xs text-white/60">
                <Link className="hover:text-primary-200" to="/privacy">{t('landing.privacy')}</Link> &middot; <Link className="hover:text-primary-200" to="/terms">{t('landing.terms')}</Link> &middot; <Link className="hover:text-primary-200" to="/support">{t('landing.support')}</Link>
              </p>
              <p className="text-xs text-white/60">&copy; {new Date().getFullYear()} Quiz Nova</p>
            </div>
          </div>
        </footer>
      </SectionWrapper>
    </div>
  )
}

export default Landing

