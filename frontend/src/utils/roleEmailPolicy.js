export const STUDENT_EMAIL_DOMAIN = '@ug.shardauniversity.uz'
export const TEACHER_EMAIL_DOMAIN = '@shardauniversity.uz'

export const STUDENT_DOMAIN_ERROR_MESSAGE = 'Students must use an email ending with @ug.shardauniversity.uz'
export const TEACHER_DOMAIN_ERROR_MESSAGE = 'Teachers must use an email ending with @shardauniversity.uz'

export const normalizeEmail = (email = '') => String(email || '').trim().toLowerCase()

export const getRoleEmailDomainError = (role, email) => {
  const normalized = normalizeEmail(email)
  if (!normalized) return null

  if (role === 'student' && !normalized.endsWith(STUDENT_EMAIL_DOMAIN)) {
    return STUDENT_DOMAIN_ERROR_MESSAGE
  }
  if (role === 'teacher') {
    const isTeacherDomain = normalized.endsWith(TEACHER_EMAIL_DOMAIN) && !normalized.endsWith(STUDENT_EMAIL_DOMAIN)
    if (!isTeacherDomain) {
      return TEACHER_DOMAIN_ERROR_MESSAGE
    }
  }
  return null
}

