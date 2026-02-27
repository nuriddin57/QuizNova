const ACCESS_KEY = 'antigravity:access'
const REFRESH_KEY = 'antigravity:refresh'

export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export const setAccessToken = (access) => {
  if (access) {
    localStorage.setItem(ACCESS_KEY, access)
  } else {
    localStorage.removeItem(ACCESS_KEY)
  }
}

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY)

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export const isAuthenticated = () => Boolean(getAccessToken())

export const getAccessTokenPayload = () => {
  const token = getAccessToken()
  if (!token) return null
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export const getCurrentUserRole = () => getAccessTokenPayload()?.role || null
