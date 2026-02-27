import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

const useRequireAuth = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [navigate, location])
}

export default useRequireAuth
