import { useCallback, useEffect, useRef, useState } from 'react'
import { buildRoomWsUrl, getHealth } from '../api/axios'

const RECONNECT_DELAY_MS = 1500

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null
  const id = entry.player_id ?? entry.id ?? null
  const name = String(entry.name ?? entry.nickname ?? 'Guest').trim() || 'Guest'
  const scoreValue = Number(entry.score ?? 0)
  const avatar = String(entry.avatar ?? 'avatar-1')
  return {
    id,
    name,
    avatar,
    score: Number.isFinite(scoreValue) ? scoreValue : 0,
  }
}

const sortEntries = (items = []) =>
  [...items].sort((a, b) => {
    if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0)
    return String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' })
  })

const keyOf = (entry) => `${entry.id ?? 'anon'}::${String(entry.name || '').toLowerCase()}`

const mergeEntries = (baseList = [], incomingList = []) => {
  const merged = new Map()
  baseList.forEach((entry) => {
    const normalized = normalizeEntry(entry)
    if (normalized) merged.set(keyOf(normalized), normalized)
  })
  incomingList.forEach((entry) => {
    const normalized = normalizeEntry(entry)
    if (!normalized) return
    merged.set(keyOf(normalized), normalized)
  })
  return sortEntries([...merged.values()])
}

export default function useGameSocket(code, socketIdentity = {}) {
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const closedRef = useRef(false)
  const connectingRef = useRef(false)
  const healthCheckedRef = useRef(false)
  const playersRef = useRef([])
  const leaderboardRef = useRef([])

  const [wsStatus, setWsStatus] = useState('disconnected')
  const [phase, setPhase] = useState('lobby')
  const [question, setQuestion] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [questionToken, setQuestionToken] = useState('')
  const [questionStartedAt, setQuestionStartedAt] = useState(null)
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [answerAck, setAnswerAck] = useState(null)
  const [lastError, setLastError] = useState('')

  const applyPlayers = useCallback((payloadPlayers = []) => {
    const normalized = sortEntries(
      payloadPlayers
        .map(normalizeEntry)
        .filter(Boolean)
    )
    playersRef.current = normalized
    setPlayers(normalized)
    setLeaderboard((prev) => {
      const merged = mergeEntries(prev, normalized)
      leaderboardRef.current = merged
      return merged
    })
  }, [])

  const applyLeaderboard = useCallback((payloadLeaderboard = []) => {
    const normalized = sortEntries(
      payloadLeaderboard
        .map(normalizeEntry)
        .filter(Boolean)
    )
    const merged = mergeEntries(playersRef.current, normalized)
    leaderboardRef.current = merged
    setLeaderboard(merged)
    // Keep scores aligned with final leaderboard when server sends final table.
    if (normalized.length) {
      const mergedPlayers = mergeEntries(playersRef.current, normalized)
      playersRef.current = mergedPlayers
      setPlayers(mergedPlayers)
    }
  }, [])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const sendAction = useCallback((action, payload = {}) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify({ action, ...payload }))
    return true
  }, [])

  const handleMessage = useCallback(
    (raw) => {
      let msg
      try {
        msg = JSON.parse(raw)
      } catch {
        return
      }

      if (msg?.type === 'players') {
        applyPlayers(msg.players || [])
        return
      }

      if (msg?.type === 'question') {
        setQuestion(msg.question || null)
        setQuestionToken(String(msg.question_token || ''))
        setQuestionStartedAt(msg.question_started_at ?? null)
        setPhase(msg.phase || (msg.question ? 'question' : 'lobby'))
        setCurrentIndex(msg.current_index ?? -1)
        setTotalQuestions(msg.total_questions ?? 0)
        setAnswerAck(null)
        return
      }

      if (msg?.type === 'answer_ack') {
        setAnswerAck(msg)
        return
      }

      if (msg?.type === 'leaderboard_update') {
        applyLeaderboard(msg.leaderboard || [])
        if (msg.phase) {
          setPhase(msg.phase)
        } else {
          setPhase('finished')
        }
        return
      }

      if (msg?.type === 'error') {
        setLastError(String(msg.detail || 'Unknown websocket error'))
      }
    },
    [applyLeaderboard, applyPlayers]
  )

  const connect = useCallback(async () => {
    if (!code || closedRef.current || connectingRef.current) return
    connectingRef.current = true
    setWsStatus((prev) => (prev === 'reconnecting' ? 'reconnecting' : 'connecting'))
    if (!healthCheckedRef.current) {
      try {
        // Align HTTP and WS host once per mounted session.
        await getHealth()
      } catch {
        // Continue with fallback URL resolution.
      } finally {
        healthCheckedRef.current = true
      }
    }
    if (!code || closedRef.current) {
      connectingRef.current = false
      return
    }

    const ws = new WebSocket(
      buildRoomWsUrl(code, {
        playerId: socketIdentity?.playerId,
        reconnectToken: socketIdentity?.reconnectToken,
        clientId: socketIdentity?.clientId,
      })
    )
    wsRef.current = ws

    ws.onopen = () => {
      connectingRef.current = false
      setWsStatus('connected')
      setLastError('')
      ws.send(JSON.stringify({ action: 'state' }))
    }

    ws.onmessage = (event) => handleMessage(event.data)

    ws.onerror = () => {
      setWsStatus('error')
    }

    ws.onclose = () => {
      connectingRef.current = false
      if (closedRef.current) return
      setWsStatus('disconnected')
      clearReconnectTimer()
      reconnectTimerRef.current = window.setTimeout(() => {
        if (!closedRef.current) {
          setWsStatus('reconnecting')
          connect()
        }
      }, RECONNECT_DELAY_MS)
    }
  }, [clearReconnectTimer, code, handleMessage, socketIdentity?.clientId, socketIdentity?.playerId, socketIdentity?.reconnectToken])

  useEffect(() => {
    if (!code) return undefined
    closedRef.current = false
    connectingRef.current = false
    healthCheckedRef.current = false
    clearReconnectTimer()
    connect()

    return () => {
      closedRef.current = true
      connectingRef.current = false
      clearReconnectTimer()
      const ws = wsRef.current
      wsRef.current = null
      try {
        if (ws) ws.close()
      } catch {
        // no-op
      }
    }
  }, [clearReconnectTimer, code, connect])

  return {
    wsStatus,
    phase,
    question,
    questionToken,
    questionStartedAt,
    currentIndex,
    totalQuestions,
    players,
    leaderboard,
    answerAck,
    lastError,
    sendAction,
  }
}
