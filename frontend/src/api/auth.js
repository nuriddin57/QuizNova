import api, { getHealth } from './axios'

const withApiRecovery = async (request) => {
  try {
    return await request()
  } catch (error) {
    if (error?.response) {
      throw error
    }
    await getHealth()
    return request()
  }
}

export const login = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/auth/login/', payload))
  return data
}

export const register = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/auth/register/', payload))
  return data
}

export const getCurrentProfile = async () => {
  const { data } = await withApiRecovery(() => api.get('/api/auth/me/'))
  return data
}

export const updateMyProfile = async (payload) => {
  const { data } = await withApiRecovery(() => api.patch('/api/auth/me/', payload))
  return data
}

export const updateStudentAcademicProfile = async (payload) => {
  const { data } = await withApiRecovery(() => api.patch('/api/auth/me/field/', payload))
  return data
}

export const listUsers = async () => {
  const { data } = await withApiRecovery(() => api.get('/api/users/'))
  return data
}
