const ACCESS_KEY = 'quiznova:access'
const REFRESH_KEY = 'quiznova:refresh'
const LEGACY_ACCESS_KEY = 'antigravity:access'
const LEGACY_REFRESH_KEY = 'antigravity:refresh'

const readToken = (key, legacyKey) => {
  const current = localStorage.getItem(key)
  if (current) return current
  const legacy = localStorage.getItem(legacyKey)
  if (legacy) {
    localStorage.setItem(key, legacy)
    localStorage.removeItem(legacyKey)
  }
  return legacy
}

export const setTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.removeItem(LEGACY_ACCESS_KEY)
  }
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.removeItem(LEGACY_REFRESH_KEY)
  }
}

export const setAccessToken = (access) => {
  if (access) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.removeItem(LEGACY_ACCESS_KEY)
  } else {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(LEGACY_ACCESS_KEY)
  }
}

export const getAccessToken = () => readToken(ACCESS_KEY, LEGACY_ACCESS_KEY)
export const getRefreshToken = () => readToken(REFRESH_KEY, LEGACY_REFRESH_KEY)

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(LEGACY_ACCESS_KEY)
  localStorage.removeItem(LEGACY_REFRESH_KEY)
}

export const isAuthenticated = () => Boolean(getAccessToken())

export const getAccessTokenPayload = () => {
  const token = getAccessToken()
  if (!token) return null
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const getCurrentUserRole = () => getAccessTokenPayload()?.role || null
