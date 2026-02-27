import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import LeaderboardPanel from '../components/LeaderboardPanel'
import HostControlsPanel from '../components/HostControlsPanel'
import useGameSocket from '../hooks/useGameSocket'
import { useRoomStore } from '../store/roomStore'

const GamePlay = () => {
  const { t } = useTranslation()
  const room = useRoomStore((state) => state.room)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [answerResult, setAnswerResult] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)
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
  }, [answerAck])

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
    if (!ok) {
      toast.error('WS uzildi', { id: 'ws-disconnected' })
    }
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
      <section className="rounded-3xl bg-white p-8 shadow-card dark:bg-slate-900">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('game.noActiveRoomTitle')}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('game.noActiveRoomDesc')}</p>
      </section>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-[32px] bg-gradient-to-r from-primary-500 via-primary-400 to-accent-blue p-6 text-white shadow-glow">
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          <span>{room?.mode || t('lobby.classic')}</span>
          <span className="text-white/70">|</span>
          <span>{t('game.room')} {room.code}</span>
          <span className="text-white/70">|</span>
          <span>{wsLabel}</span>
          <span className="text-white/70">|</span>
          <span>{phase === 'question' ? currentIndex + 1 : Math.max(currentIndex, 0)} / {totalQuestions || 0}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase tracking-[0.3em] text-white/70">{t('lobby.phase')}</p><p className="text-lg font-semibold">{phase}</p></div>
          <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase tracking-[0.3em] text-white/70">{t('game.myScore')}</p><p className="text-lg font-semibold">{me?.score ?? 0}</p></div>
          <div className="rounded-2xl bg-white/15 px-4 py-3"><p className="text-xs uppercase tracking-[0.3em] text-white/70">{t('lobby.players')}</p><p className="text-lg font-semibold">{players.length}</p></div>
        </div>
        {wsStatus !== 'connected' && <p className="mt-3 text-xs font-semibold text-rose-100">WS uzildi</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-card dark:bg-slate-900">
          {phase === 'lobby' && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">{t('game.waitingRoom')}</p>
              <h2 className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{t('game.waitingForHost')}</h2>
            </div>
          )}

          {phase === 'question' && question && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">{t('game.question')} {currentIndex + 1}</p>
              <h2 className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{question.text}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('game.timer')}: {Math.max(0, remainingTime ?? question.timer)}s</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(question.choices || []).map((choice) => {
                  const selected = selectedChoice === choice.id
                  return (
                    <button
                      key={choice.id}
                      onClick={() => submitAnswer(choice.id)}
                      disabled={locked && !selected}
                      className={`rounded-3xl border-2 px-4 py-5 text-left text-lg font-semibold transition ${selected ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-transparent bg-surface-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100'} ${locked && !selected ? 'opacity-70' : ''}`}
                    >
                      {choice.text}
                    </button>
                  )
                })}
              </div>
              {answerResult && (
                <p className={`mt-4 text-sm font-semibold ${answerResult.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {answerResult.correct ? t('game.correct') : t('game.incorrect')} {answerResult.points ? `(+${answerResult.points})` : ''}
                </p>
              )}
            </div>
          )}

          {phase === 'finished' && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">{t('game.results')}</p>
              <h2 className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">{t('game.gameComplete')}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('game.resultsHint')}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <LeaderboardPanel players={players} leaderboard={leaderboard} />
          <HostControlsPanel
            isHost={isHost}
            phase={phase}
            wsStatus={wsStatus}
            onStart={hostStart}
            onNext={hostNext}
            onEnd={hostEnd}
          />
        </div>
      </div>
    </motion.section>
  )
}

export default GamePlay
