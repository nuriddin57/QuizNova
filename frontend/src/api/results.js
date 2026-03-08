import api from './axios'

export const startExam = async (quizId) => {
  const { data } = await api.post(`/api/exams/${quizId}/start/`)
  return data
}

export const submitExam = async (quizId, payload) => {
  const { data } = await api.post(`/api/exams/${quizId}/submit/`, payload)
  return data
}

export const getStudentResults = async (params = {}) => {
  const { data } = await api.get('/api/results/history/', { params })
  return data?.results || []
}

export const getTeacherResults = async (params = {}) => {
  const { data } = await api.get('/api/results/teacher/', { params })
  return data?.results || []
}

export const getStudentSubjectPerformance = async () => {
  const { data } = await api.get('/api/results/subject-performance/')
  return data?.subjects || []
}
