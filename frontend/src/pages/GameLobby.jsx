import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiLink, HiPlay, HiUserPlus } from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import Card from '../components/Card'
import Chip from '../components/Chip'
import Modal from '../components/Modal'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import { buildRoomWsUrl, createRoom, getHealth, getQuizzesStrict, joinRoom } from '../api/axios'
import { getCurrentUserRole, isAuthenticated } from '../utils/auth'
import { useRoomStore } from '../store/roomStore'

const RECENT_CODES_KEY = 'blooket_recent_codes'
const MAX_RECENT_CODES = 6

const normalizeJoinCode = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const cleanCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '')
  const decodeSafe = (text) => {
    try {
      return decodeURIComponent(text)
    } catch {
      return text
    }
  }

  try {
    const url = new URL(raw)
    const pathMatch = url.pathname.match(/\/(?:room|host)\/([^/?#]+)/i)
    if (pathMatch?.[1]) return cleanCode(pathMatch[1])

    const codeParam = url.searchParams.get('code')
    if (codeParam) return cleanCode(codeParam)
  } catch {
    // not a fully qualified URL, continue with pattern matching
  }

  const pathMatch = raw.match(/\/(?:room|host)\/([^/?#]+)/i)
  if (pathMatch?.[1]) return cleanCode(pathMatch[1])

  const codeParamMatch = raw.match(/[?&]code=([^&#]+)/i)
  if (codeParamMatch?.[1]) return cleanCode(decodeSafe(codeParamMatch[1]))

  return cleanCode(raw)
}

const loadRecentCodes = () => {
  try {
    const raw = localStorage.getItem(RECENT_CODES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((code) => normalizeJoinCode(code))
      .filter(Boolean)
      .slice(0, MAX_RECENT_CODES)
  } catch {
    return []
  }
}

const saveRecentCodes = (codes) => {
  try {
    localStorage.setItem(RECENT_CODES_KEY, JSON.stringify(codes.slice(0, MAX_RECENT_CODES)))
  } catch {
    // ignore storage failures
  }
}

const GameLobby = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { code: routeCode } = useParams()
  const wsRef = useRef(null)
  const room = useRoomStore((state) => state.room)
  const setRoom = useRoomStore((state) => state.setRoom)
  const clearStoredRoom = useRoomStore((state) => state.clearRoom)
  const [quizzes, setQuizzes] = useState([])
  const [hostForm, setHostForm] = useState({ quizId: '', mode: 'rocket-rush' })
  const [joinForm, setJoinForm] = useState({ code: '', name: '' })
  const [players, setPlayers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [questionState, setQuestionState] = useState({ phase: 'lobby', current_index: -1, total_questions: 0 })
  const [loading, setLoading] = useState(false)
  const [quizLoadFailed, setQuizLoadFailed] = useState(false)
  const [recentCodes, setRecentCodes] = useState(() => loadRecentCodes())
  const currentUserRole = getCurrentUserRole()
  const reconnectTimerRef = useRef(null)
  const healthCheckedRef = useRef(false)
  const connectingRef = useRef(false)

  const roomCode = room?.code || ''
  const isHost = room?.role === 'host'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const setId = params.get('set')
    const mode = params.get('mode')
    if (setId) setHostForm((prev) => ({ ...prev, quizId: String(setId) }))
    if (mode) setHostForm((prev) => ({ ...prev, mode }))
    if (routeCode) setJoinForm((prev) => ({ ...prev, code: normalizeJoinCode(routeCode) }))
  }, [location.search, routeCode])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getQuizzesStrict()
        if (!mounted) return
        setQuizzes(data)
        setQuizLoadFailed(false)
        if (data.length) {
          const validIds = new Set(data.map((quiz) => String(quiz.id)))
          setHostForm((prev) => {
            const hasValidSelectedQuiz = prev.quizId && validIds.has(String(prev.quizId))
            if (hasValidSelectedQuiz) return prev
            return { ...prev, quizId: String(data[0].id) }
          })
        }
      } catch {
        if (!mounted) return
        setQuizLoadFailed(true)
        setQuizzes([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!roomCode) return undefined
    let closedByCleanup = false

    const connect = async () => {
      if (connectingRef.current || closedByCleanup) return
      connectingRef.current = true
      setWsStatus('connecting')
      if (!healthCheckedRef.current) {
        try {
          await getHealth()
        } catch {
          // keep trying with fallback host
        } finally {
          healthCheckedRef.current = true
        }
      }
      if (closedByCleanup) {
        connectingRef.current = false
        return
      }

      const ws = new WebSocket(buildRoomWsUrl(roomCode))
      wsRef.current = ws

      ws.onopen = () => {
        connectingRef.current = false
        setWsStatus('connected')
        ws.send(JSON.stringify({ action: 'state' }))
      }
      ws.onclose = () => {
        connectingRef.current = false
        if (closedByCleanup) return
        setWsStatus('disconnected')
        reconnectTimerRef.current = window.setTimeout(connect, 1500)
      }
      ws.onerror = () => setWsStatus('error')
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'players') setPlayers(msg.players || [])
          if (msg.type === 'question') {
            setQuestionState({
              phase: msg.phase || (msg.question ? 'question' : 'lobby'),
              current_index: msg.current_index ?? -1,
              total_questions: msg.total_questions ?? 0,
            })
            if (msg.phase === 'question') navigate(`/game/${room?.sessionId || 'live'}`)
          }
          if (msg.type === 'leaderboard_update') toast.success(t('lobby.leaderboardGenerated'))
          if (msg.type === 'error') toast.error(msg.detail || t('messages.somethingWentWrong'))
        } catch {
          // ignore malformed payload
        }
      }
    }

    connect()

    return () => {
      closedByCleanup = true
      connectingRef.current = false
      healthCheckedRef.current = false
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      const ws = wsRef.current
      wsRef.current = null
      try {
        if (ws) ws.close()
      } catch { }
    }
  }, [room?.sessionId, roomCode, navigate, t])

  const copyCode = async () => {
    if (!roomCode) return
    try {
      await navigator.clipboard.writeText(roomCode)
      toast.success(t('lobby.codeCopied'))
    } catch {
      toast.success(`${t('lobby.roomCode')}: ${roomCode}`)
    }
  }

  const copyJoinLink = async () => {
    if (!roomCode) return
    const joinUrl = `${window.location.origin}/room/${roomCode}`
    try {
      await navigator.clipboard.writeText(joinUrl)
      toast.success(t('lobby.joinLinkCopied'))
    } catch {
      toast.success(joinUrl)
    }
  }

  const clearRecentCodes = () => {
    setRecentCodes([])
    try {
      localStorage.removeItem(RECENT_CODES_KEY)
    } catch {
      // ignore storage failures
    }
  }

  const hostGame = async () => {
    if (quizLoadFailed) return toast.error(t('lobby.quizLoadFailed'))
    if (!hostForm.quizId) return toast.error(t('lobby.selectQuizFirst'))
    const quizId = Number(hostForm.quizId)
    if (!Number.isFinite(quizId)) return toast.error(t('lobby.selectQuizFirst'))
    if (!isAuthenticated()) {
      toast.error(t('lobby.hostAuthRequired'))
      navigate('/login')
      return
    }
    if (currentUserRole && currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
      toast.error(t('lobby.teacherRequired'))
      return
    }
    setLoading(true)
    try {
      const { data } = await createRoom({ quiz: quizId, mode: hostForm.mode })
      const nextRoom = { sessionId: data.id, code: data.code, role: 'host', mode: data.mode, quizId: data.quiz }
      setRoom(nextRoom)
      toast.success(t('lobby.lobbyCreated', { code: data.code }))
      navigate(`/room/${data.code}`)
    } catch {
      // global interceptor shows API error
    } finally {
      setLoading(false)
    }
  }

  const joinGame = async () => {
    const normalizedCode = normalizeJoinCode(joinForm.code)
    if (!normalizedCode) return toast.error(t('lobby.enterGameCode'))
    setLoading(true)
    try {
      const { data } = await joinRoom({ code: normalizedCode, name: joinForm.name.trim() || 'Guest' }, { _silent: true })
      const nextRoom = { sessionId: data.session_id, code: data.code, role: 'player', playerId: data.player_id, name: data.name }
      setRoom(nextRoom)
      setJoinForm((prev) => ({ ...prev, code: normalizeJoinCode(data.code) }))
      setRecentCodes((prev) => {
        const normalizedJoinedCode = normalizeJoinCode(data.code)
        const nextCodes = [normalizedJoinedCode, ...prev.filter((code) => code !== normalizedJoinedCode)]
          .filter(Boolean)
          .slice(0, MAX_RECENT_CODES)
        saveRecentCodes(nextCodes)
        return nextCodes
      })
      toast.success(t('lobby.joinedRoom', { code: data.code }))
      navigate(`/room/${data.code}`)
    } catch (error) {
      const status = error?.response?.status
      if (status === 404) {
        toast.error(t('lobby.invalidGameCode'))
      } else {
        toast.error(t('messages.somethingWentWrong'))
      }
    } finally {
      setLoading(false)
    }
  }

  const sendWs = (payload) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error(t('lobby.wsDisconnected'), { id: 'ws-disconnected' })
      return
    }
    ws.send(JSON.stringify(payload))
  }

  const startGame = () => {
    sendWs({ action: 'start' })
    setModalOpen(false)
  }

  const clearRoom = () => {
    clearStoredRoom()
    setPlayers([])
    setQuestionState({ phase: 'lobby', current_index: -1, total_questions: 0 })
  }

  const statusLabel = useMemo(() => {
    if (!roomCode) return t('lobby.noLobby')
    return `${roomCode} | WS ${wsStatus}`
  }, [roomCode, wsStatus, t])

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('lobby.hostTitle')}</h3>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
            {t('lobby.quizSet')}
            <select value={hostForm.quizId} onChange={(e) => setHostForm((p) => ({ ...p, quizId: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {!quizzes.length && <option value="">{quizLoadFailed ? t('lobby.quizLoadFailed') : t('lobby.noQuizzesFound')}</option>}
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
            {t('lobby.mode')}
            <select value={hostForm.mode} onChange={(e) => setHostForm((p) => ({ ...p, mode: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="rocket-rush">Rocket Rush</option>
              <option value="classic">{t('lobby.classic')}</option>
              <option value="factory-lite">{t('lobby.factoryLite')}</option>
            </select>
          </label>
          <PrimaryButton onClick={hostGame} disabled={loading} Icon={HiPlay}>
            {loading ? t('lobby.creatingLobby') : t('lobby.createLobby')}
          </PrimaryButton>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {quizLoadFailed ? t('lobby.loginOrReloadToLoadQuizzes') : t('lobby.teacherRequired')}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('lobby.joinTitle')}</h3>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
            {t('lobby.gameCode')}
            <input
              value={joinForm.code}
              onChange={(e) => setJoinForm((p) => ({ ...p, code: normalizeJoinCode(e.target.value) }))}
              placeholder={t('lobby.codePlaceholder')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('lobby.pasteCodeOrLink')}</p>
          </label>
          {recentCodes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{t('lobby.recentCodes')}</p>
                <button
                  type="button"
                  onClick={clearRecentCodes}
                  className="text-xs font-semibold text-primary-500 hover:text-primary-400"
                >
                  {t('lobby.clearRecentCodes')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentCodes.map((code) => (
                  <Chip key={code} label={code} onClick={() => setJoinForm((p) => ({ ...p, code }))} className="!px-3 !py-1.5 !text-xs" />
                ))}
              </div>
            </div>
          )}
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
            {t('lobby.nickname')}
            <input value={joinForm.name} onChange={(e) => setJoinForm((p) => ({ ...p, name: e.target.value }))} placeholder={t('lobby.nicknamePlaceholder')} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </label>
          <SecondaryButton onClick={joinGame} Icon={HiUserPlus}>
            {loading ? t('lobby.joining') : t('lobby.joinByCode')}
          </SecondaryButton>
        </div>
      </Card>

      <Card className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary-400">{t('lobby.roomCode')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-3xl bg-surface-soft px-5 py-4 text-3xl font-black tracking-[0.3em] text-primary-500 dark:bg-slate-800">
            {roomCode || '-------'}
            <button onClick={copyCode} disabled={!roomCode} className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-primary-500 disabled:opacity-50 dark:bg-slate-900 dark:text-primary-300">
              <HiLink />
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">{statusLabel}</p>
          {!!roomCode && (
            <div className="mt-3 flex gap-3">
              <SecondaryButton onClick={() => navigate(`/game/${room?.sessionId || 'live'}`)}>{t('lobby.openPlay')}</SecondaryButton>
              <SecondaryButton onClick={clearRoom}>{t('lobby.leaveLobby')}</SecondaryButton>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:w-1/3">
          <PrimaryButton onClick={() => setModalOpen(true)} Icon={HiPlay} disabled={!isHost || !roomCode || wsStatus !== 'connected'}>{t('lobby.startGame')}</PrimaryButton>
          <SecondaryButton onClick={copyCode} Icon={HiLink} disabled={!roomCode}>{t('lobby.copyJoinCode')}</SecondaryButton>
          <SecondaryButton onClick={copyJoinLink} Icon={HiLink} disabled={!roomCode}>{t('lobby.copyJoinLink')}</SecondaryButton>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('lobby.players')}</h3>
            <span className="text-sm font-semibold text-primary-500">{t('lobby.joinedCount', { count: players.length })}</span>
          </div>
          <ul className="mt-6 space-y-3">
            {players.length ? players.map((player) => (
              <li key={player.id} className="flex items-center justify-between rounded-2xl bg-surface-soft px-4 py-3 dark:bg-slate-800">
                <div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{player.name}</p>
                  <p className="text-xs text-slate-400">ID: {player.id}</p>
                </div>
                <div className="text-sm font-semibold text-primary-500">{player.score ?? 0} pts</div>
              </li>
            )) : <li className="rounded-2xl bg-surface-soft px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">{t('lobby.noPlayers')}</li>}
          </ul>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('lobby.gameState')}</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl bg-surface-soft px-4 py-3 dark:bg-slate-800"><p className="font-semibold text-slate-800 dark:text-slate-100">{t('lobby.mode')}</p><p>{room?.mode || hostForm.mode || t('lobby.classic')}</p></div>
            <div className="rounded-2xl bg-surface-soft px-4 py-3 dark:bg-slate-800"><p className="font-semibold text-slate-800 dark:text-slate-100">{t('lobby.phase')}</p><p>{questionState.phase}</p></div>
            <div className="rounded-2xl bg-surface-soft px-4 py-3 dark:bg-slate-800"><p className="font-semibold text-slate-800 dark:text-slate-100">{t('lobby.progress')}</p><p>{questionState.current_index >= 0 ? questionState.current_index + 1 : 0} / {questionState.total_questions || 0}</p></div>
            <div className="rounded-2xl bg-surface-soft px-4 py-3 dark:bg-slate-800"><p className="font-semibold text-slate-800 dark:text-slate-100">{t('lobby.role')}</p><p>{room?.role || t('lobby.none')}</p></div>
          </div>
        </Card>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('lobby.startClassicTitle')} actionLabel={t('game.start')} onAction={startGame}>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('lobby.startClassicDesc')}</p>
      </Modal>
    </motion.section>
  )
}

export default GameLobby
