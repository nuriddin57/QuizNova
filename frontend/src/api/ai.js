import api, { getHealth } from './axios'

const withApiRecovery = async (request) => {
  try {
    return await request()
  } catch (error) {
    await getHealth()
    return request()
  }
}

export const generateAIQuestions = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/ai/questions/generate/', payload))
  return data
}

export const regenerateAIQuestion = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/ai/questions/regenerate/', payload))
  return data
}

export const analyzeQuestionDraft = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/ai/questions/analyze/', payload))
  return data
}

export const bulkAddAIQuestions = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/ai/questions/bulk-add/', payload))
  return data
}

export const saveAIQuestionsToBank = async (payload) => {
  const { data } = await withApiRecovery(() => api.post('/api/ai/questions/save-to-bank/', payload))
  return data
}
