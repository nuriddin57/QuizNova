import api from './axios'

export const listStudyFields = async () => {
  const { data } = await api.get('/api/fields/')
  return Array.isArray(data) ? data : data?.results || []
}
