import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiPlay, HiRocketLaunch } from 'react-icons/hi2'

import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { getQuiz, getSets } from '../api/axios'
import { discoverSets, trendingSets } from '../utils/dummyData'

const buildLocalFallbackQuiz = (set) => {
  if (!set) return null
  const previewCount = Math.min(Number(set.questions || 0) || 0, 6)
  return {
    id: set.id,
    title: set.title,
    description: 'Local preview sample. Run seed data on backend for full playable set content.',
    category: set.subject || 'General',
    owner_username: set.creator || 'Community',
    question_count: Number(set.questions || 0) || previewCount,
    _localPreview: true,
    questions: Array.from({ length: Math.max(previewCount, 3) }).map((_, idx) => ({
      id: `${set.id}-q-${idx + 1}`,
      text: `${set.title} - Sample question ${idx + 1}`,
      timer_seconds: 20,
      choices: [
        { id: `${set.id}-q-${idx + 1}-a`, text: 'Option A' },
        { id: `${set.id}-q-${idx + 1}-b`, text: 'Option B' },
        { id: `${set.id}-q-${idx + 1}-c`, text: 'Option C' },
        { id: `${set.id}-q-${idx + 1}-d`, text: 'Option D' },
      ],
    })),
  }
}

const localSetCatalog = [...discoverSets, ...trendingSets]
const findLocalSet = (id) => localSetCatalog.find((item) => String(item?.id) === String(id))

const SetDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState(null)
  const errorToastShown = useRef(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getQuiz(id, { silent: true })
        if (mounted) setQuiz(data)
      } catch {
        let fallbackSource = findLocalSet(id)
        if (!fallbackSource) {
          try {
            const listData = await getSets()
            fallbackSource = (listData?.results || []).find((item) => String(item?.id) === String(id)) || null
          } catch {
            fallbackSource = null
          }
        }

        const localFallback = buildLocalFallbackQuiz(fallbackSource)
        if (mounted && localFallback) {
          setQuiz(localFallback)
        } else if (!errorToastShown.current) {
          errorToastShown.current = true
          toast.error('Set not found')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id])

  const questionCount = useMemo(() => quiz?.question_count ?? quiz?.questions?.length ?? 0, [quiz])
  const handleHost = () => {
    if (quiz?._localPreview) {
      toast.error('Seed backend data first to host this set')
      return
    }
    navigate(`/host?set=${quiz.id}&mode=rocket-rush`)
  }

  if (loading) {
    return <div className="rounded-3xl bg-white/90 p-8 shadow-card dark:bg-slate-900/90">Loading set...</div>
  }

  if (!quiz) {
    return (
      <Card>
        <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-slate-100">Set not found</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-300">This set may be private or unavailable.</p>
        <div className="mt-4">
          <SecondaryButton as={Link} to="/discover">Back to Discover</SecondaryButton>
        </div>
      </Card>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="rounded-[36px] bg-white/95 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{quiz.category || 'General'}</p>
            <h1 className="mt-2 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">{quiz.title}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{quiz.description || 'No description provided.'}</p>
            {quiz._localPreview ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                Local preview only (seed backend data for real set details)
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-2xl bg-surface-soft px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{questionCount} questions</span>
              {quiz.owner_username && (
                <span className="rounded-2xl bg-surface-soft px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">by {quiz.owner_username}</span>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <PrimaryButton onClick={handleHost} Icon={HiRocketLaunch}>
              Host Rocket Rush
            </PrimaryButton>
            <SecondaryButton as={Link} to="/join" Icon={HiPlay}>
              Join with Code
            </SecondaryButton>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Questions Preview</h2>
        <div className="mt-4 space-y-4">
          {(quiz.questions || []).length ? (
            quiz.questions.map((q, index) => (
              <div key={q.id || index} className="rounded-2xl bg-surface-soft px-4 py-3 dark:bg-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{index + 1}. {q.text}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(q.choices || []).map((c) => (
                    <div key={c.id} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {c.text}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">Question preview unavailable for this set.</p>
          )}
        </div>
      </Card>
    </motion.section>
  )
}

export default SetDetail
