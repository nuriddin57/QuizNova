import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Card from '../components/Card'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'

const LegalInfo = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const legalContent = {
    '/privacy': {
      title: t('legal.privacyTitle'),
      description: t('legal.privacyDescription'),
      bullets: [
        t('legal.privacyBullet1'),
        t('legal.privacyBullet2'),
        t('legal.privacyBullet3'),
      ],
    },
    '/terms': {
      title: t('legal.termsTitle'),
      description: t('legal.termsDescription'),
      bullets: [
        t('legal.termsBullet1'),
        t('legal.termsBullet2'),
        t('legal.termsBullet3'),
      ],
    },
    '/support': {
      title: t('legal.supportTitle'),
      description: t('legal.supportDescription'),
      bullets: [
        t('legal.supportBullet1'),
        t('legal.supportBullet2'),
        t('legal.supportBullet3'),
      ],
    },
  }

  const content = legalContent[pathname] || legalContent['/support']

  return (
    <SectionWrapper className="pt-2">
      <Card className="max-w-3xl rounded-[32px] bg-white/95">
        <h1 className="text-3xl font-display font-semibold text-slate-900">{content.title}</h1>
        <p className="mt-3 text-slate-600">{content.description}</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-600">
          {content.bullets.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary-400" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <SecondaryButton as={Link} to="/">
            {t('legal.backHome')}
          </SecondaryButton>
        </div>
      </Card>
    </SectionWrapper>
  )
}

export default LegalInfo
