import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiPlay, HiRocketLaunch } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'

import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { getQuiz, getQuizLeaderboard, submitQuizAttempt } from '../api/axios'
import { getAccessTokenPayload, getCurrentUserRole, isAuthenticated } from '../utils/auth'

const getChoiceKey = (choice, index) => String(choice?.id ?? `choice-${index}`)
const getQuestionKey = (question, index) => String(question?.id ?? `question-${index}`)
const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0
const getChoiceLabel = (index) => String.fromCharCode(65 + index)

const SetDetail = () => {
  const { t } = useTranslation()
  const { setId: rawSetId = '' } = useParams()
  const setId = decodeURIComponent(rawSetId)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [leaderboardRows, setLeaderboardRows] = useState([])
  const [canViewAllStats, setCanViewAllStats] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [lastSubmittedAttempt, setLastSubmittedAttempt] = useState(null)
  const errorToastShown = useRef(false)
  const authed = isAuthenticated()
  const role = getCurrentUserRole()
  const payload = getAccessTokenPayload()
  const currentUserId = Number(payload?.user_id || 0) || null

  useEffect(() => {
    let mounted = true
    errorToastShown.current = false
    ;(async () => {
      setLoading(true)
      setNotFound(false)
      setQuiz(null)
      setLeaderboardRows([])
      setCanViewAllStats(false)
      try {
        const data = await getQuiz(setId, { silent: true })
        if (mounted) setQuiz(data)
      } catch (error) {
        if (!mounted) return
        if (error?.response?.status === 404) {
          setNotFound(true)
        } else {
          errorToastShown.current = true
          toast.error(t('messages.somethingWentWrong'))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [setId, t])

  const loadStats = useCallback(async () => {
    if (!authed || !quiz?.id) {
      setLeaderboardRows([])
      setCanViewAllStats(false)
      return
    }
    setLoadingStats(true)
    try {
      const data = await getQuizLeaderboard(quiz.id, { _silent: true })
      setLeaderboardRows(Array.isArray(data?.leaderboard) ? data.leaderboard : [])
      setCanViewAllStats(Boolean(data?.can_view_all))
    } catch {
      setLeaderboardRows([])
      setCanViewAllStats(false)
    } finally {
      setLoadingStats(false)
    }
  }, [authed, quiz?.id])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const questions = useMemo(() => {
    const previewQuestions = Array.isArray(quiz?.preview_questions) ? quiz.preview_questions : []
    if (previewQuestions.length > 0) return previewQuestions

    const directQuestions = Array.isArray(quiz?.questions) ? quiz.questions : []
    if (directQuestions.length > 0) return directQuestions

    const links = Array.isArray(quiz?.question_links) ? quiz.question_links : []
    return links
      .map((link, index) => {
        if (link?.question) return link.question
        const bank = link?.question_bank_reference
        if (!bank) return null
        const mappedChoices = [
          bank.option_a,
          bank.option_b,
          bank.option_c,
          bank.option_d,
        ]
          .filter((option) => typeof option === 'string' && option.trim())
          .map((text, choiceIndex) => ({
            id: `${bank.id || `bank-${index}`}-choice-${choiceIndex + 1}`,
            text,
          }))
        return {
          id: isPositiveNumber(link?.question) ? Number(link.question) : bank.id || `bank-${index}`,
          text: bank.question_text || '',
          timer_seconds: 20,
          choices: mappedChoices,
        }
      })
      .filter(Boolean)
  }, [quiz])

  const questionCount = useMemo(
    () => quiz?.question_count ?? questions.length ?? 0,
    [quiz?.question_count, questions.length]
  )

  const myLatestAttempt = useMemo(() => {
    if (lastSubmittedAttempt && Number(lastSubmittedAttempt?.user) === currentUserId) return lastSubmittedAttempt
    if (!currentUserId) return null
    const mine = leaderboardRows.filter((row) => Number(row?.user) === currentUserId)
    if (!mine.length) return null
    return [...mine].sort((a, b) => {
      const timeA = new Date(a?.finished_at || a?.started_at || 0).getTime()
      const timeB = new Date(b?.finished_at || b?.started_at || 0).getTime()
      if (timeB !== timeA) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })[0]
  }, [currentUserId, lastSubmittedAttempt, leaderboardRows])

  const myAnswerMap = useMemo(() => {
    const map = {}
    for (const answer of myLatestAttempt?.answers || []) {
      map[String(answer.question)] = answer
    }
    return map
  }, [myLatestAttempt])

  const questionStatsMap = useMemo(() => {
    const stats = {}
    for (const question of questions) {
      stats[String(question.id)] = { answeredCount: 0, correctCount: 0, choiceStats: {} }
      for (const choice of question.choices || []) {
        stats[String(question.id)].choiceStats[String(choice.id)] = { count: 0, users: [] }
      }
    }

    for (const row of leaderboardRows) {
      const username = row?.user_username || `${t('setDetail.userFallback')} ${row?.user || '-'}`
      for (const answer of row?.answers || []) {
        const questionKey = String(answer?.question)
        const choiceKey = String(answer?.selected_choice)
        const questionStats = stats[questionKey]
        if (!questionStats || !answer?.selected_choice) continue
        if (!questionStats.choiceStats[choiceKey]) {
          questionStats.choiceStats[choiceKey] = { count: 0, users: [] }
        }
        questionStats.answeredCount += 1
        questionStats.choiceStats[choiceKey].count += 1
        if (canViewAllStats) {
          questionStats.choiceStats[choiceKey].users.push(username)
        }
        if (answer?.is_correct) questionStats.correctCount += 1
      }
    }

    for (const questionStats of Object.values(stats)) {
      for (const choiceStats of Object.values(questionStats.choiceStats)) {
        choiceStats.users = [...new Set(choiceStats.users)]
      }
    }
    return stats
  }, [canViewAllStats, leaderboardRows, questions, t])

  const canHost = role === 'teacher' || role === 'admin'

  const handleHost = () => {
    if (!canHost) {
      toast.error(t('setDetail.teacherOnlyHost'))
      return
    }
    navigate(`/host?set=${quiz.id}&mode=classic`)
  }

  const handleSelectChoice = (questionId, choiceId) => {
    if (!authed) {
      toast.error(t('setDetail.loginToAnswer'))
      return
    }
    setSelectedAnswers((prev) => ({ ...prev, [String(questionId)]: String(choiceId) }))
  }

  const handleSubmitAnswers = async () => {
    if (!authed) {
      navigate('/login', { state: { from: `/sets/${encodeURIComponent(setId)}` } })
      return
    }
    const answersPayload = Object.entries(selectedAnswers)
      .map(([questionId, choiceId]) => ({
        question_id: Number(questionId),
        choice_id: Number(choiceId),
      }))
      .filter((answer) => isPositiveNumber(answer.question_id) && isPositiveNumber(answer.choice_id))
    if (!answersPayload.length) {
      toast.error(t('setDetail.selectAtLeastOne'))
      return
    }

    setSubmitting(true)
    try {
      const attempt = await submitQuizAttempt(quiz.id, answersPayload)
      setLastSubmittedAttempt(attempt)
      toast.success(
        t('setDetail.answersSaved', {
          correct: attempt?.correct_answers || 0,
          total: attempt?.total_questions || 0,
        })
      )
      setSelectedAnswers({})
      await loadStats()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="rounded-3xl bg-white/90 p-8 shadow-card dark:bg-slate-900/90">{t('setDetail.loadingSet')}</div>
  }

  if (!quiz) {
    const title = notFound ? t('setDetail.setNotFoundTitle') : t('messages.somethingWentWrong')
    const description = notFound ? t('setDetail.setNotFoundDesc') : t('messages.somethingWentWrong')
    return (
      <Card>
        <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-300">{description}</p>
        <div className="mt-4">
          <SecondaryButton as={Link} to="/discover">{t('setDetail.backToDiscover')}</SecondaryButton>
        </div>
      </Card>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="rounded-[36px] bg-white/95 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{quiz.category || t('setDetail.defaultCategory')}</p>
            <h1 className="mt-2 text-3xl font-display font-bold text-slate-900 dark:text-slate-100">{quiz.title}</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{quiz.description || t('setDetail.noDescription')}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.06)] dark:border-white/12 dark:bg-white/10 dark:text-slate-200">
                {t('setDetail.questionsCount', { count: questionCount })}
              </span>
              {quiz.owner_username && (
                <span className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.06)] dark:border-white/12 dark:bg-white/10 dark:text-slate-200">
                  {t('setDetail.byOwner', { owner: quiz.owner_username })}
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <PrimaryButton onClick={handleHost} Icon={HiRocketLaunch}>
              {t('setDetail.hostRocketRush')}
            </PrimaryButton>
            <SecondaryButton as={Link} to="/join" Icon={HiPlay}>
              {t('setDetail.joinWithCode')}
            </SecondaryButton>
          </div>
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('setDetail.answerSummary')}</h2>
          <PrimaryButton type="button" onClick={handleSubmitAnswers} disabled={submitting || !authed || !questions.length}>
            {submitting ? t('setDetail.submittingAnswers') : t('setDetail.submitAnswers')}
          </PrimaryButton>
        </div>
        {!authed && (
          <p className="mt-3 text-sm text-slate-500">{t('setDetail.loginToViewStats')}</p>
        )}
        {myLatestAttempt && (
          <p className="mt-3 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700">
            {t('setDetail.yourResult', {
              correct: myLatestAttempt.correct_answers || 0,
              total: myLatestAttempt.total_questions || 0,
            })}
          </p>
        )}
        <div className="mt-4 space-y-2">
          {loadingStats && <p className="text-sm text-slate-500">{t('setDetail.loadingStats')}</p>}
          {!loadingStats && authed && !leaderboardRows.length && (
            <p className="text-sm text-slate-500">{t('setDetail.noAttemptsYet')}</p>
          )}
          {!loadingStats && leaderboardRows.length > 0 && (
            <>
              <p className="text-sm font-semibold text-slate-700">
                {t('setDetail.participantsCount', { count: leaderboardRows.length })}
              </p>
              <div className="space-y-2">
                {leaderboardRows.map((row) => {
                  const isSelf = Number(row?.user) === currentUserId
                  const userLabel = isSelf ? t('setDetail.you') : row?.user_username || `${t('setDetail.userFallback')} ${row?.user || '-'}`
                  if (!canViewAllStats && !isSelf) return null
                  return (
                    <div key={row.id} className="light-tile rounded-2xl px-4 py-2 text-sm">
                      <span className="font-semibold text-slate-900">{userLabel}</span>
                      <span className="ml-2 text-slate-600">
                        {t('setDetail.correctShort', {
                          correct: row?.correct_answers || 0,
                          total: row?.total_questions || 0,
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('setDetail.questionsPreview')}</h2>
        <div className="mt-4 space-y-4">
          {questions.length ? (
            questions.map((q, index) => {
              const questionKey = getQuestionKey(q, index)
              const questionStats = questionStatsMap[questionKey] || { answeredCount: 0, correctCount: 0, choiceStats: {} }
              const persistedAnswer = myAnswerMap[questionKey]
              const activeChoiceId = selectedAnswers[questionKey] || String(persistedAnswer?.selected_choice || '')
              return (
                <div key={questionKey} className="light-tile rounded-2xl px-4 py-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{index + 1}. {q.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                      {t('setDetail.correctByCount', {
                        correct: questionStats.correctCount,
                        total: questionStats.answeredCount,
                      })}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(q.choices || []).map((choice, choiceIndex) => {
                      const choiceKey = getChoiceKey(choice, choiceIndex)
                      const choiceStats = questionStats.choiceStats[choiceKey] || { count: 0, users: [] }
                      const isSelected = String(activeChoiceId) === choiceKey
                      return (
                        <button
                          key={choiceKey}
                          type="button"
                          onClick={() => handleSelectChoice(questionKey, choiceKey)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? 'border-primary-400 bg-primary-50 text-primary-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <p className="font-semibold">{getChoiceLabel(choiceIndex)}. {choice.text}</p>
                          <p className="mt-1 text-xs">
                            {t('setDetail.selectedByCount', { count: choiceStats.count })}
                          </p>
                          {isSelected && (
                            <p className="mt-1 text-xs font-semibold">{t('setDetail.youSelected')}</p>
                          )}
                          {canViewAllStats && choiceStats.users.length > 0 && (
                            <p className="mt-1 text-xs text-slate-600">
                              {t('setDetail.selectedByUsers', { users: choiceStats.users.join(', ') })}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">{t('setDetail.questionPreviewUnavailable')}</p>
          )}
        </div>
      </Card>
    </motion.section>
  )
}

export default SetDetail
