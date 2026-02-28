import { Link, useLocation } from 'react-router-dom'
import Card from '../components/Card'
import SecondaryButton from '../components/SecondaryButton'
import SectionWrapper from '../components/SectionWrapper'

const legalContent = {
  '/privacy': {
    title: 'Privacy Policy',
    description: 'Quiz Nova protects classroom data and only uses required information to run accounts, sessions, and game history.',
    bullets: [
      'Only required profile and gameplay data is stored.',
      'Teacher and student access is role-restricted.',
      'You can request account data updates or deletion from support.',
    ],
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'By using Quiz Nova, users agree to classroom-safe and lawful usage of quizzes, sessions, and shared content.',
    bullets: [
      'Do not upload harmful, abusive, or copyrighted content without permission.',
      'Accounts are responsible for their own credentials and activity.',
      'Service features may evolve as the platform improves.',
    ],
  },
  '/support': {
    title: 'Support',
    description: 'Need help with hosting, joining, or account issues? The support team can guide setup and troubleshooting.',
    bullets: [
      'Check backend and frontend services are running locally.',
      'Verify game code, login, and network access before joining.',
      'Report issues with steps to reproduce for faster fixes.',
    ],
  },
}

const LegalInfo = () => {
  const { pathname } = useLocation()
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
            Back to Home
          </SecondaryButton>
        </div>
      </Card>
    </SectionWrapper>
  )
}

export default LegalInfo
