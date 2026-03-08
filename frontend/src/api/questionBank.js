import api from './axios'

export const listQuestionBank = async (params = {}) => {
  const { data } = await api.get('/api/question-bank/', { params })
  return Array.isArray(data) ? data : data?.results || []
}

export const createQuestionBankEntry = async (payload) => {
  const { data } = await api.post('/api/question-bank/', payload)
  return data
}

export const updateQuestionBankEntry = async (id, payload) => {
  const { data } = await api.put(`/api/question-bank/${id}/`, payload)
  return data
}

export const deleteQuestionBankEntry = async (id) => {
  const { data } = await api.delete(`/api/question-bank/${id}/`)
  return data
}

export const duplicateQuestionBankEntry = async (id) => {
  const { data } = await api.post(`/api/question-bank/${id}/duplicate/`)
  return data
}

export const bulkImportQuestionBank = async (payload) => {
  let body = payload
  let config = {}
  if (payload?.file instanceof File) {
    body = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (key === 'file') {
        body.append('file', value)
        return
      }
      body.append(key, value)
    })
    config = { headers: { 'Content-Type': 'multipart/form-data' } }
  }
  const { data } = await api.post('/api/question-bank/import/', body, config)
  return data
}
