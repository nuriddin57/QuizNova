import { Link } from 'react-router-dom'
import { HiCalendarDays, HiMiniClipboardDocument, HiMiniGift, HiMiniRocketLaunch } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import PrimaryButton from '../PrimaryButton'
import SecondaryButton from '../SecondaryButton'
import LoadingSkeleton from '../LoadingSkeleton'
import SectionStatusCard from './SectionStatusCard'

const WeeklyChallengeSpotlight = ({ challenge, loading, error, onCopy, authed }) => {
  const { t, i18n } = useTranslation()

  if (loading) {
    return (
      <div className="rounded-[40px] bg-gradient-to-br from-[#eef5ff] via-white to-[#eef2ff] p-8 shadow-card">
        <div className="grid gap-6 lg:grid-cols-[1.4fr,360px] lg:items-center">
          <div className="space-y-4">
            <LoadingSkeleton className="h-4 w-36" />
            <LoadingSkeleton className="h-10 w-4/5" />
            <LoadingSkeleton lines={3} />
            <div className="flex flex-wrap gap-3">
              <LoadingSkeleton className="h-12 w-40" />
              <LoadingSkeleton className="h-12 w-52" />
            </div>
          </div>
          <div className="rounded-[30px] bg-white/90 p-6">
            <LoadingSkeleton className="h-4 w-28" />
            <LoadingSkeleton className="mt-4 h-12 w-40" />
            <LoadingSkeleton className="mt-6 h-12 w-full" />
            <LoadingSkeleton className="mt-3 h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <SectionStatusCard
        title={t('landing.challengeUnavailableTitle')}
        body={t('landing.challengeUnavailableBody')}
        className="rounded-[40px]"
        action={<SecondaryButton as={Link} to={authed ? '/dashboard' : '/login'}>{t('landing.openDashboard')}</SecondaryButton>}
      />
    )
  }

  if (!challenge) {
    return (
      <SectionStatusCard
        title={t('landing.noChallengeTitle')}
        body={t('landing.noChallengeBody')}
        className="rounded-[40px]"
        action={<PrimaryButton as={Link} to={authed ? '/discover' : '/login'}>{t('landing.explorePlatform')}</PrimaryButton>}
      />
    )
  }

  const formattedDeadline = new Intl.DateTimeFormat(i18n.language || 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(challenge.deadline))

  return (
    <div className="relative overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.24),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,0.97),_rgba(238,242,255,0.97))] p-8 shadow-[0_28px_80px_rgba(59,130,246,0.15)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] lg:block" />
      <div className="relative grid gap-8 lg:grid-cols-[1.45fr,360px] lg:items-center">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary-600">
            <HiMiniRocketLaunch className="text-base" />
            {t('landing.weeklyChallenge')}
          </div>
          <h2 className="mt-5 max-w-3xl text-3xl font-display font-bold text-slate-900 sm:text-4xl">{challenge.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{challenge.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700">
              <HiMiniGift className="text-lg text-primary-500" />
              {t('landing.reward')}: {challenge.reward}
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700">
              <HiCalendarDays className="text-lg text-primary-500" />
              {t('landing.deadlineLabel', { deadline: formattedDeadline })}
            </div>
          </div>
        </section>

        <aside className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{t('landing.challengeCode')}</p>
          <p className="mt-3 break-all text-4xl font-black tracking-[0.28em] text-slate-900">{challenge.code}</p>
          <p className="mt-4 text-sm leading-6 text-slate-500">{t('landing.challengeCodeHelp')}</p>
          <div className="mt-6 flex flex-col gap-3">
            <PrimaryButton type="button" onClick={onCopy} Icon={HiMiniClipboardDocument}>
              {t('landing.copyCode')}
            </PrimaryButton>
            <SecondaryButton as={Link} to={`/challenges/${challenge.code}`} className="justify-center">
              {t('landing.viewChallengeDetails')}
            </SecondaryButton>
            <SecondaryButton as={Link} to={authed ? '/discover' : '/login'} className="justify-center">
              {t('landing.explorePlatform')}
            </SecondaryButton>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default WeeklyChallengeSpotlight

