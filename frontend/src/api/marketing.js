import api, { getHealth } from './axios'

const withHealthRetry = async (request) => {
  try {
    return await request()
  } catch (firstError) {
    await getHealth()
    return request()
  }
}

export const getPublicTestimonials = async () => {
  const { data } = await withHealthRetry(() => api.get('/api/marketing/testimonials/', { _silent: true }))
  return data?.results || []
}

export const getCurrentWeeklyChallenge = async () => {
  const { data } = await withHealthRetry(() => api.get('/api/marketing/weekly-challenge/current/', { _silent: true }))
  return data?.challenge || null
}

export const getWeeklyChallengeDetail = async (code) => {
  const { data } = await withHealthRetry(() => api.get(`/api/marketing/weekly-challenge/${code}/`, { _silent: true }))
  return data
}

