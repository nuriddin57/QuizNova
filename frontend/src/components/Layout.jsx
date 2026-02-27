import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import PatternBackground from './PatternBackground'

const Layout = ({ children }) => {
  const location = useLocation()
  const authRoutes = ['/login', '/register']
  const showNav = !authRoutes.includes(location.pathname)

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-base text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <PatternBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        {showNav && <Navbar />}
        <main className={`${showNav ? 'pt-28' : 'pt-16'} flex-1 px-4 pb-16 sm:px-6 lg:px-12`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
