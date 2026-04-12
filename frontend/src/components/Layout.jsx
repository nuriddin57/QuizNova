import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'
import PatternBackground from './PatternBackground'

const Layout = ({ children }) => {
  const location = useLocation()
  const { t } = useTranslation()
  const authRoutes = ['/login', '/register', '/forgot-password']
  const isUniversityCallback = location.pathname.startsWith('/auth/university/callback')
  const showNav = !authRoutes.includes(location.pathname) && !isUniversityCallback

  useEffect(() => {
    const { pathname, search } = location
    const params = new URLSearchParams(search)
    const isQuizEdit = pathname === '/teacher/quiz/create' && params.get('quizId')
    let titleKey = 'pageTitles.default'

    if (pathname === '/') titleKey = 'pageTitles.home'
    else if (pathname === '/discover') titleKey = 'pageTitles.discover'
    else if (pathname === '/login' || pathname === '/forgot-password') titleKey = 'pageTitles.login'
    else if (pathname === '/register') titleKey = 'pageTitles.register'
    else if (pathname === '/dashboard') titleKey = 'pageTitles.dashboard'
    else if (pathname === '/field-selection') titleKey = 'pageTitles.fieldSelection'
    else if (pathname === '/student/dashboard') titleKey = 'pageTitles.studentDashboard'
    else if (pathname === '/parent/dashboard') titleKey = 'pageTitles.parentDashboard'
    else if (pathname === '/teacher/dashboard') titleKey = 'pageTitles.teacherDashboard'
    else if (pathname === '/teacher/analytics') titleKey = 'pageTitles.teacherAnalytics'
    else if (pathname === '/teacher/analytics/subjects') titleKey = 'pageTitles.subjectAnalytics'
    else if (pathname === '/teacher/ai-generate') titleKey = 'pageTitles.aiGenerate'
    else if (pathname === '/teacher/question-bank') titleKey = 'pageTitles.questionBank'
    else if (pathname === '/teacher/bulk-import') titleKey = 'pageTitles.bulkImport'
    else if (pathname === '/teacher/quiz/create') titleKey = isQuizEdit ? 'pageTitles.quizEdit' : 'pageTitles.quizCreate'
    else if (/^\/quiz\/[^/]+\/take$/.test(pathname)) titleKey = 'pageTitles.quizTake'
    else if (pathname === '/results') titleKey = 'pageTitles.results'
    else if (pathname === '/subjects') titleKey = 'pageTitles.subjects'
    else if (/^\/subjects\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.subjectDetail'
    else if (/^\/topics\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.topicDetail'
    else if (/^\/modules\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.moduleDetail'
    else if (/^\/sets\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.setDetail'
    else if (pathname === '/admin-panel' || pathname === '/my-sets') titleKey = 'pageTitles.mySets'
    else if (pathname === '/admin/users') titleKey = 'pageTitles.adminUsers'
    else if (pathname === '/host' || pathname === '/join' || pathname === '/lobby' || /^\/room\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.lobby'
    else if (pathname === '/play' || /^\/game\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.play'
    else if (pathname === '/privacy') titleKey = 'pageTitles.privacy'
    else if (pathname === '/terms') titleKey = 'pageTitles.terms'
    else if (pathname === '/support') titleKey = 'pageTitles.support'
    else if (pathname === '/parents') titleKey = 'pageTitles.parents'
    else if (/^\/challenges\/[^/]+$/.test(pathname)) titleKey = 'pageTitles.weeklyChallenge'
    else if (pathname.startsWith('/auth/university/callback')) titleKey = 'pageTitles.universityAuth'

    const pageTitle = t(titleKey)
    document.title = pageTitle && pageTitle !== titleKey ? `QuizNova | ${pageTitle}` : 'QuizNova'
  }, [location, t])

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
