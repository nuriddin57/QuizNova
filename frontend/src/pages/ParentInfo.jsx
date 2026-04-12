import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HiArrowTrendingUp, HiChartBarSquare, HiClipboardDocumentCheck, HiSparkles } from 'react-icons/hi2'

import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { useAuth } from '../context/AuthContext'

const ParentInfo = () => {
  const { t } = useTranslation()
  const { role, isAuthed } = useAuth()

  const highlights = [
    {
      icon: HiArrowTrendingUp,
      titleKey: 'landing.parentPage.cards.progressTitle',
      bodyKey: 'landing.parentPage.cards.progressBody',
    },
    {
      icon: HiSparkles,
      titleKey: 'landing.parentPage.cards.challengeTitle',
      bodyKey: 'landing.parentPage.cards.challengeBody',
    },
    {
      icon: HiChartBarSquare,
      titleKey: 'landing.parentPage.cards.insightTitle',
      bodyKey: 'landing.parentPage.cards.insightBody',
    },
    {
      icon: HiClipboardDocumentCheck,
      titleKey: 'landing.parentPage.cards.activityTitle',
      bodyKey: 'landing.parentPage.cards.activityBody',
    },
  ]

  return (
    <section className="space-y-6">
      <Card className="rounded-[40px] bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.16),_transparent_30%),linear-gradient(140deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-8" hover={false}>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-500">{t('landing.parentPage.eyebrow')}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-display font-bold text-slate-900">{t('landing.parentPage.title')}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{t('landing.parentPage.description')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton as={Link} to={isAuthed && role === 'parent' ? '/parent/dashboard' : '/login'}>{t('landing.parentPage.primaryCta')}</PrimaryButton>
          <SecondaryButton as={Link} to="/support">{t('landing.parentPage.secondaryCta')}</SecondaryButton>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {highlights.map((item) => (
          <Card key={item.titleKey} className="rounded-[32px]" hover={false}>
            <div className="inline-flex rounded-2xl bg-primary-50 p-3 text-primary-600">
              <item.icon className="text-2xl" />
            </div>
            <h2 className="mt-5 text-2xl font-display font-semibold text-slate-900">{t(item.titleKey)}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{t(item.bodyKey)}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default ParentInfo
