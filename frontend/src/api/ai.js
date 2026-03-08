import api from './axios'

export const generateAIQuestions = async (payload) => {
  const { data } = await api.post('/api/ai/questions/generate/', payload)
  return data
}

export const bulkAddAIQuestions = async (payload) => {
  const { data } = await api.post('/api/ai/questions/bulk-add/', payload)
  return data
}

export const saveAIQuestionsToBank = async (payload) => {
  const { data } = await api.post('/api/ai/questions/save-to-bank/', payload)
  return data
}
