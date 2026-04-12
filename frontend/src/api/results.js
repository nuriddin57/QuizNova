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

export const getMyResults = async (params = {}) => {
  const { data } = await api.get('/api/results/my-results/', { params })
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

export const getParentLinkedStudents = async () => {
  const { data } = await api.get('/api/results/parent/children/')
  return data?.students || []
}

export const getParentProgress = async (params = {}) => {
  const { data } = await api.get('/api/results/parent/progress/', { params })
  return data || { children: [], results: [] }
}
