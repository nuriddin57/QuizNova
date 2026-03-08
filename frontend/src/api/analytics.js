import api from './axios'

export const getTeacherSummary = async (params = {}) => {
  const { data } = await api.get('/api/analytics/summary/', { params })
  return data
}

export const getTeacherLeaderboard = async (params = {}) => {
  const { data } = await api.get('/api/analytics/leaderboard/', { params })
  return data?.leaderboard || []
}

export const getHighestScorer = async (params = {}) => {
  const { data } = await api.get('/api/analytics/highest-scorer/', { params })
  return data
}

export const getLowestScorer = async (params = {}) => {
  const { data } = await api.get('/api/analytics/lowest-scorer/', { params })
  return data
}

export const getFieldPerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/field-performance/', { params })
  return data?.field_performance || []
}

export const getSemesterCodePerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/semester-code-performance/', { params })
  return data?.semester_code_performance || []
}

export const getSemesterPerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/semester-performance/', { params })
  return data?.semester_performance || []
}

export const getSectionPerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/section-performance/', { params })
  return data?.section_performance || []
}

export const getSubjectPerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/subject-performance/', { params })
  return data?.subject_performance || []
}

export const getTopicPerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/topic-performance/', { params })
  return data?.topic_performance || []
}

export const getModulePerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/module-performance/', { params })
  return data?.module_performance || []
}

export const getQuizPerformance = async (params = {}) => {
  const { data } = await api.get('/api/analytics/by-quiz/', { params })
  return data?.quiz_performance || []
}

export const getSubjectSummary = async (params = {}) => {
  const { data } = await api.get('/api/analytics/subject-summary/', { params })
  return data?.subjects || []
}

export const getQuestionAccuracy = async (params = {}) => {
  const { data } = await api.get('/api/analytics/question-accuracy/', { params })
  return data?.questions || []
}

export const getHardestQuestions = async (params = {}) => {
  const { data } = await api.get('/api/analytics/hardest-questions/', { params })
  return data?.questions || []
}

export const getEasiestQuestions = async (params = {}) => {
  const { data } = await api.get('/api/analytics/easiest-questions/', { params })
  return data?.questions || []
}

export const getRecentAttempts = async (params = {}) => {
  const { data } = await api.get('/api/analytics/recent-attempts/', { params })
  return data?.attempts || []
}
