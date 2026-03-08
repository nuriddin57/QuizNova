import api from './axios'

export const listSubjects = async (params = {}) => {
  const { data } = await api.get('/api/subjects/', { params })
  return Array.isArray(data) ? data : data?.results || []
}

export const getSubjectById = async (id) => {
  const { data } = await api.get(`/api/subjects/${id}/`)
  return data
}

export const getSubjectQuizzes = async (id) => {
  const { data } = await api.get(`/api/subjects/${id}/quizzes/`)
  return Array.isArray(data) ? data : data?.results || []
}

export const createSubject = async (payload) => {
  const { data } = await api.post('/api/subjects/', payload)
  return data
}

export const updateSubject = async (id, payload) => {
  const { data } = await api.put(`/api/subjects/${id}/`, payload)
  return data
}

export const deleteSubject = async (id) => {
  const { data } = await api.delete(`/api/subjects/${id}/`)
  return data
}

export const listTopics = async (params = {}) => {
  const { data } = await api.get('/api/topics/', { params })
  return Array.isArray(data) ? data : data?.results || []
}

export const getTopicById = async (id) => {
  const { data } = await api.get(`/api/topics/${id}/`)
  return data
}

export const getTopicQuizzes = async (id) => {
  const { data } = await api.get(`/api/topics/${id}/quizzes/`)
  return Array.isArray(data) ? data : data?.results || []
}

export const createTopic = async (payload) => {
  const { data } = await api.post('/api/topics/', payload)
  return data
}

export const updateTopic = async (id, payload) => {
  const { data } = await api.put(`/api/topics/${id}/`, payload)
  return data
}

export const deleteTopic = async (id) => {
  const { data } = await api.delete(`/api/topics/${id}/`)
  return data
}

export const listModules = async (params = {}) => {
  const { data } = await api.get('/api/modules/', { params })
  return Array.isArray(data) ? data : data?.results || []
}

export const getModuleById = async (id) => {
  const { data } = await api.get(`/api/modules/${id}/`)
  return data
}

export const getModuleQuizzes = async (id) => {
  const { data } = await api.get(`/api/modules/${id}/quizzes/`)
  return Array.isArray(data) ? data : data?.results || []
}

export const createModule = async (payload) => {
  const { data } = await api.post('/api/modules/', payload)
  return data
}

export const updateModule = async (id, payload) => {
  const { data } = await api.put(`/api/modules/${id}/`, payload)
  return data
}

export const deleteModule = async (id) => {
  const { data } = await api.delete(`/api/modules/${id}/`)
  return data
}
