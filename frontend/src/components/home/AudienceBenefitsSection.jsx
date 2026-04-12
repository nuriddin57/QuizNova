import { Link } from 'react-router-dom'
import { HiArrowTrendingUp, HiChartBarSquare, HiPlayCircle, HiPresentationChartLine, HiSparkles, HiUserGroup } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import Card from '../Card'
import PrimaryButton from '../PrimaryButton'
import SecondaryButton from '../SecondaryButton'

const iconMap = {
  teacher_quizzes: HiSparkles,
  teacher_live: HiPlayCircle,
  teacher_progress: HiPresentationChartLine,
  teacher_leaderboard: HiChartBarSquare,
  parent_progress: HiArrowTrendingUp,
  parent_challenge: HiSparkles,
  parent_strengths: HiChartBarSquare,
  parent_activity: HiUserGroup,
}

const AudienceBenefitsSection = ({ cards }) => {
  const { t } = useTranslation()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.id} className="h-full rounded-[36px] border border-white/70 bg-white/95 p-7 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <article className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-500">{t(card.eyebrowKey)}</p>
                <h3 className="mt-3 text-3xl font-display font-semibold text-slate-900">{t(card.titleKey)}</h3>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">{t(card.descriptionKey)}</p>
              </div>
              <div className={`hidden rounded-3xl p-4 text-white shadow-[0_16px_40px_rgba(59,130,246,0.28)] sm:block ${card.iconBgClass}`}>
                <card.Icon className="text-2xl" />
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {card.benefits.map((benefit) => {
                const BenefitIcon = iconMap[benefit.icon] || HiSparkles
                return (
                  <li key={benefit.titleKey} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <div className="rounded-2xl bg-white p-2 text-primary-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                      <BenefitIcon className="text-lg" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{t(benefit.titleKey)}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{t(benefit.bodyKey)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton as={Link} to={card.primaryCta.to} className="justify-center sm:flex-1">
                {t(card.primaryCta.labelKey)}
              </PrimaryButton>
              <SecondaryButton as={Link} to={card.secondaryCta.to} className="justify-center sm:flex-1">
                {t(card.secondaryCta.labelKey)}
              </SecondaryButton>
            </div>
          </article>
        </Card>
      ))}
    </div>
  )
}

export default AudienceBenefitsSection

