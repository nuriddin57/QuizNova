import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import LeaderboardPanel from '../components/LeaderboardPanel'
import HostControlsPanel from '../components/HostControlsPanel'
import useGameSocket from '../hooks/useGameSocket'
import { useRoomStore } from '../store/roomStore'

const TimerRing = ({ total = 0, remaining = 0 }) => {
  const safeTotal = Math.max(Number(total) || 1, 1)
  const safeRemaining = Math.max(0, Number(remaining) || 0)
  const progress = Math.min(1, safeRemaining / safeTotal)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference * (1 - progress)
  const urgent = safeRemaining <= Math.ceil(safeTotal * 0.25)

  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r={radius} className="fill-none stroke-slate-200 dark:stroke-white/15" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          className={`fill-none transition-all duration-200 ${urgent ? 'stroke-rose-400' : 'stroke-indigo-500 dark:stroke-cyan-300'}`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border border-slate-200 bg-white text-center dark:border-white/20 dark:bg-white/8 dark:backdrop-blur-md">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Time</span>
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{safeRemaining}s</span>
      </div>
    </div>
  )
}

const GamePlay = () => {
  const { t } = useTranslation()
  const room = useRoomStore((state) => state.room)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [answerResult, setAnswerResult] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [rewardBurst, setRewardBurst] = useState(null)
  const questionShownAtRef = useRef(Date.now())

  const {
    wsStatus,
    phase,
    question,
    currentIndex,
    totalQuestions,
    players,
    leaderboard,
    answerAck,
    lastError,
    sendAction,
  } = useGameSocket(room?.code)

  useEffect(() => {
    if (!question) return
    setSelectedChoice(null)
    setLocked(false)
    setAnswerResult(null)
    questionShownAtRef.current = Date.now()
    setRemainingTime(question?.timer || 0)
  }, [question?.id, question])

  useEffect(() => {
    if (!answerAck) return
    setAnswerResult(answerAck)
    setLocked(true)
    if (answerAck.correct) {
      const points = Number(answerAck.points || 120)
      setRewardBurst({
        id: Date.now(),
        xp: Math.max(25, points),
        coins: Math.max(5, Math.round(points / 8)),
      })
    }
  }, [answerAck])

  useEffect(() => {
    if (!rewardBurst) return undefined
    const timer = window.setTimeout(() => setRewardBurst(null), 1000)
    return () => window.clearTimeout(timer)
  }, [rewardBurst])

  useEffect(() => {
    if (!lastError) return
    toast.error(lastError, { id: 'ws-server-error' })
  }, [lastError])

  useEffect(() => {
    if (phase !== 'question' || !question?.timer) return undefined
    setRemainingTime(question.timer)
    const startedAt = questionShownAtRef.current
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      setRemainingTime(Math.max(0, Math.ceil((question.timer || 0) - elapsed)))
    }, 250)
    return () => window.clearInterval(interval)
  }, [phase, question?.id, question?.timer])

  const sendWithGuard = (action, payload = {}) => {
    const ok = sendAction(action, payload)
    if (!ok) toast.error('WS uzildi', { id: 'ws-disconnected' })
    return ok
  }

  const submitAnswer = (choiceId) => {
    if (!room?.playerId) return toast.error(t('game.joinAsPlayerFirst'))
    if (!question || locked) return
    setSelectedChoice(choiceId)
    setLocked(true)
    const elapsedSec = Math.max(0, (Date.now() - questionShownAtRef.current) / 1000)
    const sent = sendWithGuard('answer', { player_id: room.playerId, choice_id: choiceId, ts: elapsedSec })
    if (!sent) setLocked(false)
  }

  const hostStart = () => sendWithGuard('start')
  const hostNext = () => sendWithGuard('next')
  const hostEnd = () => sendWithGuard('end')

  const isHost = room?.role === 'host'
  const me = players.find((p) => p.id === room?.playerId)
  const wsLabel =
    wsStatus === 'connected'
      ? 'WS ulangan'
      : wsStatus === 'connecting'
      ? 'WS ulanmoqda'
      : wsStatus === 'reconnecting'
      ? 'WS qayta ulanmoqda'
      : wsStatus === 'error'
      ? 'WS xato'
      : 'WS uzildi'

  if (!room?.code) {
    return (
      <section className="frost-card rounded-[20px] p-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('game.noActiveRoomTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('game.noActiveRoomDesc')}</p>
      </section>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="frost-card rounded-[20px] p-6 text-slate-900 dark:text-white">
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 dark:border-cyan-300/45 dark:bg-cyan-300/14 dark:text-cyan-100">
            {room?.mode || t('lobby.classic')}
          </span>
          <span className="text-slate-400 dark:text-slate-300">|</span>
          <span>{t('game.room')} {room.code}</span>
          <span className="text-slate-400 dark:text-slate-300">|</span>
          <span>{wsLabel}</span>
          <span className="text-slate-400 dark:text-slate-300">|</span>
          <span>{phase === 'question' ? currentIndex + 1 : Math.max(currentIndex, 0)} / {totalQuestions || 0}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/18 dark:bg-white/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">{t('lobby.phase')}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{phase}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/18 dark:bg-white/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">{t('game.myScore')}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{me?.score ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/18 dark:bg-white/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">{t('lobby.players')}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{players.length}</p>
          </div>
        </div>

        {wsStatus !== 'connected' && <p className="mt-3 text-xs font-semibold text-rose-500">WS uzildi</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="frost-card relative overflow-hidden rounded-[20px] p-8">
          {phase === 'lobby' && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-500 dark:text-cyan-200">{t('game.waitingRoom')}</p>
              <h2 className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{t('game.waitingForHost')}</h2>
            </div>
          )}

          {phase === 'question' && question && (
            <div className="relative">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-500 dark:text-cyan-200">{t('game.question')} {currentIndex + 1}</p>
                  <h2 className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{question.text}</h2>
                </div>
                <TimerRing total={question?.timer || 0} remaining={remainingTime ?? question?.timer} />
              </div>

              <AnimatePresence>
                {rewardBurst && (
                  <motion.div
                    key={rewardBurst.id}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: -12, scale: 1 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.32 }}
                    className="pointer-events-none absolute -top-2 right-2 rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-right dark:border-emerald-300/55 dark:bg-emerald-500/16"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-100">Reward</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-100">+{rewardBurst.xp} XP</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-200">+{rewardBurst.coins} Coins</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(question.choices || []).map((choice) => {
                  const selected = selectedChoice === choice.id
                  const selectedResultClass =
                    selected && answerResult
                      ? answerResult.correct
                        ? 'choice-correct'
                        : 'choice-wrong'
                      : selected
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-cyan-300/70 dark:bg-cyan-300/14 dark:text-cyan-100'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/16 dark:bg-white/8 dark:text-slate-100 dark:hover:border-cyan-300/45 dark:hover:bg-cyan-300/12'

                  return (
                    <button
                      key={choice.id}
                      onClick={() => submitAnswer(choice.id)}
                      disabled={locked && !selected}
                      className={`rounded-2xl border-2 px-4 py-5 text-left text-lg font-semibold transition duration-150 ${selectedResultClass} ${locked && !selected ? 'opacity-65' : ''}`}
                    >
                      {choice.text}
                    </button>
                  )
                })}
              </div>

              {answerResult && (
                <p className={`mt-4 text-sm font-semibold ${answerResult.correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                  {answerResult.correct ? t('game.correct') : t('game.incorrect')} {answerResult.points ? `(+${answerResult.points})` : ''}
                </p>
              )}
            </div>
          )}

          {phase === 'finished' && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-500 dark:text-cyan-200">{t('game.results')}</p>
              <h2 className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{t('game.gameComplete')}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('game.resultsHint')}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <LeaderboardPanel players={players} leaderboard={leaderboard} />
          <HostControlsPanel isHost={isHost} phase={phase} wsStatus={wsStatus} onStart={hostStart} onNext={hostNext} onEnd={hostEnd} />
        </div>
      </div>
    </motion.section>
  )
}

export default GamePlay
