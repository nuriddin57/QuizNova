import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { getCurrentProfile, login, register, updateMyProfile, updateStudentAcademicProfile } from '../api/auth'
import { clearTokens, getCurrentUserRole, isAuthenticated, setTokens } from '../utils/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const me = await getCurrentProfile()
      setUser(me)
      return me
    } catch {
      clearTokens()
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const applyAuthResponse = useCallback(async (responseData) => {
    setTokens({ access: responseData?.access, refresh: responseData?.refresh })
    if (responseData?.user) {
      setUser(responseData.user)
      return responseData.user
    }
    return loadMe()
  }, [loadMe])

  const loginUser = useCallback(async ({ email, password, role }) => {
    const data = await login({ email, password, role })
    return applyAuthResponse(data)
  }, [applyAuthResponse])

  const registerUser = useCallback(async (payload) => {
    const data = await register(payload)
    return applyAuthResponse(data)
  }, [applyAuthResponse])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const updated = await updateMyProfile(payload)
    setUser(updated)
    return updated
  }, [])

  const updateMyAcademicProfile = useCallback(async (payload) => {
    const updated = await updateStudentAcademicProfile(payload)
    setUser(updated)
    return updated
  }, [])

  const role = user?.role || getCurrentUserRole()

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      isAuthed: isAuthenticated(),
      login: loginUser,
      register: registerUser,
      logout,
      loadMe,
      updateProfile,
      updateMyAcademicProfile,
    }),
    [user, role, loading, loginUser, registerUser, logout, loadMe, updateProfile, updateMyAcademicProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
