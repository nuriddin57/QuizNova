import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { getCurrentWeeklyChallenge } from '../api/marketing'
import { getParentLinkedStudents, getParentProgress } from '../api/results'
import Card from '../components/Card'
import LoadingSkeleton from '../components/LoadingSkeleton'
import PrimaryButton from '../components/PrimaryButton'
import ResultTable from '../components/ResultTable'
import SectionWrapper from '../components/SectionWrapper'
import SecondaryButton from '../components/SecondaryButton'
import { useAuth } from '../context/AuthContext'
import { isParentRole } from '../utils/role'

const ParentDashboard = () => {
  const { t, i18n } = useTranslation()
  const { user, role, loading } = useAuth()
  const [children, setChildren] = useState([])
  const [results, setResults] = useState([])
  const [challenge, setChallenge] = useState(null)
  const [activeChildId, setActiveChildId] = useState('')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setFetching(true)
        const [childrenData, progressData, challengeData] = await Promise.all([
          getParentLinkedStudents(),
          getParentProgress(),
          getCurrentWeeklyChallenge(),
        ])
        if (!mounted) return
        setChildren(childrenData)
        setResults(progressData?.results || [])
        setChallenge(challengeData)
      } catch {
        if (!mounted) return
        setChildren([])
        setResults([])
        setChallenge(null)
      } finally {
        if (mounted) setFetching(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!activeChildId) return
    let mounted = true
    ;(async () => {
      try {
        const progressData = await getParentProgress({ child_id: activeChildId })
        if (mounted) setResults(progressData?.results || [])
      } catch {
        if (mounted) setResults([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [activeChildId])

  const stats = useMemo(() => {
    if (!results.length) {
      return { average: 0, best: 0, attempts: 0, passRate: 0 }
    }
    const attempts = results.length
    const average = results.reduce((sum, item) => sum + Number(item.score || 0), 0) / attempts
    const best = Math.max(...results.map((item) => Number(item.score || 0)))
    const passed = results.filter((item) => item.pass_fail_status === 'pass').length
    const passRate = attempts ? (passed / attempts) * 100 : 0
    return { average, best, attempts, passRate }
  }, [results])

  const formattedDeadline = challenge?.deadline
    ? new Intl.DateTimeFormat(i18n.language || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(challenge.deadline))
    : ''

  if (!loading && !isParentRole(role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{t('parentDashboard.badge')}</p>
              <h1 className="mt-2 text-3xl font-display font-bold text-slate-900">{user?.full_name || user?.username}</h1>
              <p className="mt-1 text-sm text-slate-600">{user?.school || t('parentDashboard.familyOverview')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton as={Link} to="/results">{t('parentDashboard.viewResults')}</PrimaryButton>
              <SecondaryButton as={Link} to="/parents">{t('parentDashboard.parentGuide')}</SecondaryButton>
            </div>
          </div>
        </Card>

        {fetching ? (
          <Card className="rounded-[34px] bg-white/95 p-6" hover={false}>
            <LoadingSkeleton className="h-5 w-44" />
            <LoadingSkeleton className="mt-4" lines={4} />
          </Card>
        ) : !children.length ? (
          <Card className="rounded-[34px] bg-white/95 p-6" hover={false}>
            <h2 className="text-2xl font-semibold text-slate-900">{t('parentDashboard.noLinkedStudentsTitle')}</h2>
            <p className="mt-2 text-sm text-slate-600">{t('parentDashboard.noLinkedStudentsBody')}</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="rounded-3xl bg-white p-4" hover={false}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('parentDashboard.totalAttempts')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.attempts}</p>
              </Card>
              <Card className="rounded-3xl bg-white p-4" hover={false}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('parentDashboard.averageScore')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.average.toFixed(1)}</p>
              </Card>
              <Card className="rounded-3xl bg-white p-4" hover={false}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('parentDashboard.bestScore')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.best.toFixed(1)}</p>
              </Card>
              <Card className="rounded-3xl bg-white p-4" hover={false}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('parentDashboard.passRate')}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.passRate.toFixed(0)}%</p>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
              <Card className="rounded-[34px] bg-white/95 p-6" hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{t('parentDashboard.linkedStudents')}</h2>
                    <p className="mt-1 text-sm text-slate-600">{t('parentDashboard.linkedStudentsBody')}</p>
                  </div>
                  <select
                    value={activeChildId}
                    onChange={(event) => setActiveChildId(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    <option value="">{t('parentDashboard.allChildren')}</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {children.map((child) => (
                    <div key={child.id} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                      <p className="font-semibold text-slate-900">{child.full_name}</p>
                      <p className="mt-1 text-sm text-slate-600">{child.email}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {t('academy.field')}: {child.field_of_study_name || '-'} | {t('academy.section')}: {child.section || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[34px] bg-white/95 p-6" hover={false}>
                <h2 className="text-2xl font-semibold text-slate-900">{t('parentDashboard.weeklyChallenge')}</h2>
                {challenge ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{challenge.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{challenge.description}</p>
                    <p className="mt-4 text-sm font-semibold text-primary-600">{t('parentDashboard.challengeDeadline', { deadline: formattedDeadline })}</p>
                    <div className="mt-4">
                      <SecondaryButton as={Link} to={`/challenges/${challenge.code}`}>{t('landing.viewChallengeDetails')}</SecondaryButton>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">{t('parentDashboard.noChallenge')}</p>
                )}
              </Card>
            </div>

            <Card className="rounded-[34px] bg-white/95 p-6" hover={false}>
              <h2 className="text-2xl font-semibold text-slate-900">{t('parentDashboard.recentResults')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('parentDashboard.recentResultsBody')}</p>
              <div className="mt-5">
                <ResultTable rows={results} />
              </div>
            </Card>
          </>
        )}
      </div>
    </SectionWrapper>
  )
}

export default ParentDashboard
