import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HiCalendarDays, HiMiniClipboardDocument, HiMiniGift, HiSparkles } from 'react-icons/hi2'

import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { getWeeklyChallengeDetail } from '../api/marketing'
import { toastHelpers } from '../utils/toastHelpers'
import { isAuthenticated } from '../utils/auth'

const WeeklyChallengeDetail = () => {
  const { t, i18n } = useTranslation()
  const { code } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const authed = isAuthenticated()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(false)
        const data = await getWeeklyChallengeDetail(code)
        if (mounted) setChallenge(data)
      } catch {
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [code])

  const formattedDeadline = useMemo(() => {
    if (!challenge?.deadline) return ''
    return new Intl.DateTimeFormat(i18n.language || 'en', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(challenge.deadline))
  }, [challenge?.deadline, i18n.language])

  const handleCopy = async () => {
    if (!challenge?.code) return
    try {
      await navigator.clipboard.writeText(challenge.code)
      toastHelpers.copy(t('landing.challengeCopied'))
    } catch {
      toastHelpers.info(`${t('landing.challengeCode')}: ${challenge.code}`)
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <Card className="rounded-[36px]">
          <LoadingSkeleton className="h-5 w-40" />
          <LoadingSkeleton className="mt-4 h-12 w-4/5" />
          <LoadingSkeleton className="mt-4" lines={4} />
        </Card>
      </section>
    )
  }

  if (error || !challenge) {
    return (
      <section className="space-y-6">
        <Card className="rounded-[36px]" hover={false}>
          <h1 className="text-3xl font-display font-bold text-slate-900">{t('landing.challengeMissingTitle')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{t('landing.challengeMissingBody')}</p>
          <div className="mt-6">
            <SecondaryButton as={Link} to="/">{t('landing.backToHome')}</SecondaryButton>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden rounded-[40px] border border-white/80 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.2),_transparent_28%),linear-gradient(140deg,_rgba(255,255,255,0.98),_rgba(238,242,255,0.96))] p-8 shadow-[0_24px_80px_rgba(59,130,246,0.14)]" hover={false}>
        <p className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary-600">
          <HiSparkles className="text-base" />
          {t('landing.weeklyChallenge')}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-display font-bold text-slate-900">{challenge.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{challenge.description}</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              <HiMiniGift className="text-lg text-primary-500" />
              {t('landing.reward')}
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">{challenge.reward}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              <HiCalendarDays className="text-lg text-primary-500" />
              {t('landing.deadline')}
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">{formattedDeadline}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('landing.challengeCode')}</p>
            <p className="mt-3 break-all text-3xl font-black tracking-[0.24em] text-slate-900">{challenge.code}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton type="button" onClick={handleCopy} Icon={HiMiniClipboardDocument}>
            {t('landing.copyCode')}
          </PrimaryButton>
          <SecondaryButton as={Link} to={authed ? '/discover' : '/login'}>
            {authed ? t('landing.goToDiscover') : t('landing.signInToJoin')}
          </SecondaryButton>
          <SecondaryButton as={Link} to="/">
            {t('landing.backToHome')}
          </SecondaryButton>
        </div>
      </Card>
    </section>
  )
}

export default WeeklyChallengeDetail

