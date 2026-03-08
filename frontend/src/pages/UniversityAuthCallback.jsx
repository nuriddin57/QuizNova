import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import Card from '../components/Card'
import SectionWrapper from '../components/SectionWrapper'
import { useAuth } from '../context/AuthContext'
import { setTokens } from '../utils/auth'

const parseHash = (hash) => {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  return {
    access: params.get('access'),
    refresh: params.get('refresh'),
    error: params.get('error'),
  }
}

const UniversityAuthCallback = () => {
  const navigate = useNavigate()
  const { loadMe } = useAuth()

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const { access, refresh, error } = parseHash(window.location.hash)
        if (error) {
          toast.error(error)
          navigate('/login', { replace: true })
          return
        }

        if (!access || !refresh) {
          toast.error('University login did not return local tokens.')
          navigate('/login', { replace: true })
          return
        }

        setTokens({ access, refresh })
        const user = await loadMe()
        if (!active) return

        if (user?.role === 'admin') {
          navigate('/admin/users', { replace: true })
        } else if (user?.role === 'teacher') {
          navigate('/teacher/dashboard', { replace: true })
        } else if (!user?.field_of_study) {
          navigate('/field-selection', { replace: true })
        } else {
          navigate('/student/dashboard', { replace: true })
        }
      } catch {
        toast.error('University login failed.')
        navigate('/login', { replace: true })
      }
    })()

    return () => {
      active = false
    }
  }, [loadMe, navigate])

  return (
    <SectionWrapper className="pt-8" disableMotion>
      <Card className="mx-auto max-w-xl rounded-[32px] bg-white/95 text-center">
        <h1 className="text-3xl font-display font-semibold text-slate-900">Finishing university login</h1>
        <p className="mt-3 text-sm text-slate-600">Your QuizNova session is being established.</p>
      </Card>
    </SectionWrapper>
  )
}

export default UniversityAuthCallback
