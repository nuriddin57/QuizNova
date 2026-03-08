import api from './axios'

export const listQuizzes = async (params = {}) => {
  const { data } = await api.get('/api/quizzes/', { params })
  return Array.isArray(data) ? data : data?.results || []
}

export const getQuizById = async (id) => {
  const { data } = await api.get(`/api/quizzes/${id}/`)
  return data
}

export const createQuiz = async (payload) => {
  const { data } = await api.post('/api/quizzes/', payload)
  return data
}

export const updateQuiz = async (id, payload) => {
  const { data } = await api.put(`/api/quizzes/${id}/`, payload)
  return data
}

export const deleteQuiz = async (id) => {
  const { data } = await api.delete(`/api/quizzes/${id}/`)
  return data
}

export const publishQuiz = async (id, isPublished = true) => {
  const { data } = await api.post(`/api/quizzes/${id}/publish/`, { is_published: isPublished })
  return data
}

export const listMyQuizzes = async () => listQuizzes({ mine: true })

export const addQuestionBankEntriesToQuiz = async (quizId, questionIds) => {
  const { data } = await api.post(`/api/quizzes/${quizId}/add-bank-questions/`, {
    question_ids: questionIds,
  })
  return data
}
