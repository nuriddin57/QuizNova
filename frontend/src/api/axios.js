import axios from 'axios'
import { discoverSets, profileStub } from '../utils/dummyData'
import i18n from '../i18n'
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from '../utils/auth'
import { toastHelpers } from '../utils/toastHelpers'

const appEnv = import.meta.env.VITE_APP_ENV || 'development'
const fallbackBaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackBaseUrl,
  headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language || 'en' },
})

const getLanguageHeader = () => ({ 'Accept-Language': i18n.language || 'en' })
export const getApiBaseUrl = () => api.defaults.baseURL

const cardGradients = [
  'from-[#7BD8FF] via-[#6C9CFF] to-[#5B6CFF]',
  'from-[#FFB347] via-[#FF889A] to-[#FF6B9C]',
  'from-[#7BF6D9] via-[#45E0FF] to-[#5B6CFF]',
  'from-[#FFE066] via-[#FFC857] to-[#FF9E7A]',
  'from-[#FF9DE2] via-[#FF6BD6] to-[#CF63FF]',
]

const normalizeSetCard = (set, index = 0) => {
  if (!set || typeof set !== 'object') return set
  return {
    ...set,
    subject: set.subject || set.category || 'General',
    questions: set.questions_count || set.question_count || (Array.isArray(set.questions) ? set.questions.length : 0),
    plays: set.plays || '0',
    gradient: set.gradient || cardGradients[index % cardGradients.length],
    creator: set.creator || set.owner_username || 'Community',
    rating: set.rating || 4.5,
    updatedAt: set.updatedAt || set.created_at || null,
  }
}

const normalizeSetCards = (items) => (Array.isArray(items) ? items.map((item, index) => normalizeSetCard(item, index)) : [])

const buildCollectionDetailPaths = (identifier) => {
  const normalizedIdentifier = encodeURIComponent(String(identifier ?? '').trim())
  return [
    `/api/sets/${normalizedIdentifier}/`,
    `/api/quizzes/${normalizedIdentifier}/`,
  ]
}

const isRetriableRequestError = (error) => {
  const status = error?.response?.status
  return !status || status >= 500
}

api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  config.headers['Accept-Language'] = i18n.language || 'en'
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

const extractErrorMessage = (payload) => {
  if (!payload) return null
  if (typeof payload === 'string') return payload
  if (typeof payload.detail === 'string') return payload.detail
  if (Array.isArray(payload)) return payload.map((item) => extractErrorMessage(item)).filter(Boolean).join(', ')
  if (typeof payload === 'object') {
    const first = Object.entries(payload)[0]
    if (!first) return null
    const [key, value] = first
    const inner = extractErrorMessage(value)
    return inner ? `${key}: ${inner}` : key
  }
  return null
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error?.response?.status
    if (status === 401 && !originalRequest?._retry) {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((queueError) => Promise.reject(queueError))
      }

      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/api/auth/token/refresh/`, { refresh: refreshToken }, { headers: { 'Accept-Language': i18n.language || 'en' } })
        setAccessToken(data.access)
        processQueue(null, data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (!originalRequest?._silent) {
      const message = extractErrorMessage(error?.response?.data) || i18n.t('messages.somethingWentWrong')
      toastHelpers.error(message)
    }
    return Promise.reject(error)
  }
)

export const getHealth = async () => {
  const candidates = [
    api.defaults.baseURL,
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : null,
    appEnv === 'development' && typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : null,
    appEnv === 'development' ? 'http://127.0.0.1:8000' : null,
    appEnv === 'development' ? 'http://localhost:8000' : null,
  ].filter(Boolean)

  const uniqueCandidates = [...new Set(candidates)]
  let lastError = null

  for (const base of uniqueCandidates) {
    try {
      const { data } = await axios.get(`${base}/api/health/`, {
        timeout: 3000,
        headers: getLanguageHeader(),
      })
      api.defaults.baseURL = base
      api.defaults.headers.common = api.defaults.headers.common || {}
      api.defaults.headers.common['Accept-Language'] = i18n.language || 'en'
      return data
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

export const postLogin = (payload) => api.post('/api/auth/login/', payload)
export const postRegister = (payload) => api.post('/api/auth/register/', payload)
export const postPasswordReset = (payload) => api.post('/api/auth/password-reset/', payload)

export const getProfile = async () => {
  try {
    const { data } = await api.get('/api/auth/me/', { _silent: true })
    return data
  } catch (error) {
    return profileStub
  }
}

export const getStats = async () => {
  try {
    const { data } = await api.get('/api/stats/me/', { _silent: true })
    return data
  } catch (error) {
    return {
      total_attempts: 0,
      average_score: 0,
      highest_score: 0,
      accuracy: 0,
      question_performance: [],
    }
  }
}

export const getSets = async (params = {}) => {
  const requestConfig = {
    _silent: true,
    params: {
      search: params.search || undefined,
      category: params.category || undefined,
      sort: params.sort || undefined,
      page: params.page || undefined,
    },
  }
  try {
    const { data } = await api.get('/api/sets/', requestConfig)
    const results = Array.isArray(data) ? data : data?.results || []
    return {
      ...(data && typeof data === 'object' && !Array.isArray(data) ? data : {}),
      fallback: false,
      results: normalizeSetCards(results),
    }
  } catch (firstError) {
    try {
      await getHealth()
      const { data } = await api.get('/api/sets/', requestConfig)
      const results = Array.isArray(data) ? data : data?.results || []
      return {
        ...(data && typeof data === 'object' && !Array.isArray(data) ? data : {}),
        fallback: false,
        results: normalizeSetCards(results),
      }
    } catch (retryError) {
      return { fallback: false, results: [] }
    }
  }
}

export const getQuizzes = async () => {
  try {
    const { data } = await api.get('/api/quizzes/', { _silent: true })
    return Array.isArray(data) ? data : data?.results || []
  } catch (error) {
    return discoverSets.map((set) => ({
      id: set.id,
      title: set.title,
      description: set.title,
      category: set.subject,
      questions: Array.from({ length: set.questions }).map((_, idx) => ({
        id: `${set.id}-${idx}`,
        text: `${set.title} question ${idx + 1}`,
        timer_seconds: 20,
        choices: [
          { id: `${set.id}-${idx}-a`, text: 'Option A', is_correct: idx % 4 === 0 },
          { id: `${set.id}-${idx}-b`, text: 'Option B', is_correct: idx % 4 === 1 },
          { id: `${set.id}-${idx}-c`, text: 'Option C', is_correct: idx % 4 === 2 },
          { id: `${set.id}-${idx}-d`, text: 'Option D', is_correct: idx % 4 === 3 },
        ],
      })),
    }))
  }
}

export const getQuizzesStrict = async () => {
  try {
    const { data } = await api.get('/api/quizzes/')
    return Array.isArray(data) ? data : data?.results || []
  } catch (firstError) {
    // Common local dev issue: backend started on :8000 instead of :8001.
    await getHealth()
    const { data } = await api.get('/api/quizzes/')
    return Array.isArray(data) ? data : data?.results || []
  }
}

export const getMyQuizzes = async () => {
  const { data } = await api.get('/api/quizzes/', { params: { mine: true } })
  return Array.isArray(data) ? data : data?.results || []
}

export const getQuiz = async (id, options = {}) => {
  const requestConfig = options?.silent ? { _silent: true } : {}
  const detailPaths = buildCollectionDetailPaths(id)
  let lastError = null

  for (const path of detailPaths) {
    try {
      const { data } = await api.get(path, requestConfig)
      return data
    } catch (error) {
      lastError = error
    }
  }

  if (!isRetriableRequestError(lastError)) {
    throw lastError
  }

  await getHealth()

  for (const path of detailPaths) {
    try {
      const { data } = await api.get(path, requestConfig)
      return data
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

export const getQuizLeaderboard = async (quizId, config = {}) => {
  const { data } = await api.get(`/api/quiz/${quizId}/leaderboard/`, config)
  return data
}

export const submitQuizAttempt = async (quizId, answers = []) => {
  const { data } = await api.post(`/api/quiz/${quizId}/attempt/submit/`, { answers })
  return data?.attempt || null
}

export const listSessions = async () => {
  const { data } = await api.get('/api/sessions/')
  return Array.isArray(data) ? data : data?.results || []
}

export const getSession = async (id) => {
  const { data } = await api.get(`/api/sessions/${id}/`)
  return data
}

export const createSession = (payload) => api.post('/api/sessions/', payload)
export const joinSession = (sessionId, name) => api.post(`/api/sessions/${sessionId}/join/`, { name })
export const joinSessionByCode = (code, name) => api.post('/api/sessions/join-by-code/', { code, name })
export const createRoom = (payload, config = {}) => api.post('/api/rooms/create', payload, config)
export const joinRoom = (payload, config = {}) => api.post('/api/rooms/join', payload, config)
export const getHostHistory = async () => {
  const { data } = await api.get('/api/stats/history/host/')
  return data
}
export const getHostInsights = async () => {
  const { data } = await api.get('/api/stats/insights/host/')
  return data
}
export const getGameReport = async (gameId) => {
  const { data } = await api.get(`/api/games/${gameId}/report`)
  return data
}
export const importQuizCsv = async (quizId, { file = null, csv = '', replace = true } = {}) => {
  if (file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('replace', replace ? '1' : '0')
    const { data } = await api.post(`/api/quizzes/${quizId}/import-csv/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }
  const { data } = await api.post(`/api/quizzes/${quizId}/import-csv/`, { csv, replace })
  return data
}
export const getGameState = async (id) => {
  const { data } = await api.get(`/api/games/${id}/state`)
  return data
}

export const buildRoomWsUrl = (code, options = {}) => {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = (() => {
    if (import.meta.env.VITE_API_URL) return new URL(import.meta.env.VITE_API_URL).host
    try {
      if (api.defaults.baseURL) return new URL(api.defaults.baseURL).host
    } catch {
      // ignore and fall back below
    }
    if (typeof window !== 'undefined' && window.location.port === '5173') return '127.0.0.1:8001'
    if (typeof window !== 'undefined') return window.location.host
    return '127.0.0.1:8001'
  })()
  const params = new URLSearchParams()
  const token = options.token || getAccessToken()
  if (token) params.set('token', token)
  if (options.playerId) params.set('player_id', String(options.playerId))
  if (options.reconnectToken) params.set('reconnect_token', String(options.reconnectToken))
  if (options.clientId) params.set('client_id', String(options.clientId))
  const query = params.toString()
  return `${protocol}://${host}/ws/game/${code}/${query ? `?${query}` : ''}`
}

export default api


i18n.on('languageChanged', (lng) => {
  api.defaults.headers.common['Accept-Language'] = lng || 'en'
})
