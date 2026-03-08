import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import PatternBackground from './PatternBackground'

const Layout = ({ children }) => {
  const location = useLocation()
  const authRoutes = ['/login', '/register', '/forgot-password']
  const isUniversityCallback = location.pathname.startsWith('/auth/university/callback')
  const showNav = !authRoutes.includes(location.pathname) && !isUniversityCallback

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-base text-slate-900 transition-colors dark:text-[#eaf2ff]">
      <PatternBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        {showNav && <Navbar />}
        <main className={`${showNav ? 'pt-28' : 'pt-16'} flex-1 px-4 pb-20 sm:px-6 lg:px-12`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
