import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { isStudentRole, isTeacherRole } from '../utils/role'
import AdminUsersPage from '../pages/AdminUsersPage'
import Discover from '../pages/Discover'
import FieldSelection from '../pages/FieldSelection'
import GameLobby from '../pages/GameLobby'
import GamePlay from '../pages/GamePlay'
import Landing from '../pages/Landing'
import LegalInfo from '../pages/LegalInfo'
import Login from '../pages/Login'
import ModuleDetailPage from '../pages/ModuleDetailPage'
import MySets from '../pages/MySets'
import AIGenerateQuestions from '../pages/AIGenerateQuestions'
import QuizCreate from '../pages/QuizCreate'
import QuizTake from '../pages/QuizTake'
import Register from '../pages/Register'
import ResultsPage from '../pages/ResultsPage'
import SetDetail from '../pages/SetDetail'
import StudentDashboard from '../pages/StudentDashboard'
import SubjectAnalyticsPage from '../pages/SubjectAnalyticsPage'
import SubjectDetailPage from '../pages/SubjectDetailPage'
import SubjectsPage from '../pages/SubjectsPage'
import TeacherAnalytics from '../pages/TeacherAnalytics'
import TeacherDashboard from '../pages/TeacherDashboard'
import QuestionBankPage from '../pages/QuestionBankPage'
import BulkImportQuestionsPage from '../pages/BulkImportQuestionsPage'
import TopicDetailPage from '../pages/TopicDetailPage'
import UniversityAuthCallback from '../pages/UniversityAuthCallback'

const RequireAuth = ({ children }) => {
  const { isAuthed, loading } = useAuth()
  if (loading) return null
  if (!isAuthed) return <Navigate to="/login" replace />
  return children
}

const RequireStudent = ({ children }) => {
  const { role, loading, isAuthed } = useAuth()
  if (loading) return null
  if (!isAuthed) return <Navigate to="/login" replace />
  if (!isStudentRole(role)) return <Navigate to="/dashboard" replace />
  return children
}

const RequireTeacher = ({ children }) => {
  const { role, loading, isAuthed } = useAuth()
  if (loading) return null
  if (!isAuthed) return <Navigate to="/login" replace />
  if (!isTeacherRole(role)) return <Navigate to="/dashboard" replace />
  return children
}

const RequireAdmin = ({ children }) => {
  const { role, loading, isAuthed } = useAuth()
  if (loading) return null
  if (!isAuthed) return <Navigate to="/login" replace />
  if (role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

const DashboardRedirect = () => {
  const { role, isAuthed, loading } = useAuth()
  if (loading) return null
  if (!isAuthed) return <Navigate to="/login" replace />
  if (role === 'admin') return <Navigate to="/admin/users" replace />
  if (isTeacherRole(role)) return <Navigate to="/teacher/dashboard" replace />
  return <Navigate to="/student/dashboard" replace />
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/auth/university/callback" element={<UniversityAuthCallback />} />
    <Route path="/dashboard" element={<DashboardRedirect />} />

    <Route
      path="/field-selection"
      element={(
        <RequireStudent>
          <FieldSelection />
        </RequireStudent>
      )}
    />
    <Route
      path="/student/dashboard"
      element={(
        <RequireStudent>
          <StudentDashboard />
        </RequireStudent>
      )}
    />
    <Route
      path="/teacher/dashboard"
      element={(
        <RequireTeacher>
          <TeacherDashboard />
        </RequireTeacher>
      )}
    />
    <Route
      path="/teacher/quiz/create"
      element={(
        <RequireTeacher>
          <QuizCreate />
        </RequireTeacher>
      )}
    />
    <Route
      path="/teacher/analytics"
      element={(
        <RequireTeacher>
          <TeacherAnalytics />
        </RequireTeacher>
      )}
    />
    <Route
      path="/teacher/analytics/subjects"
      element={(
        <RequireTeacher>
          <SubjectAnalyticsPage />
        </RequireTeacher>
      )}
    />
    <Route
      path="/teacher/ai-generate"
      element={(
        <RequireTeacher>
          <AIGenerateQuestions />
        </RequireTeacher>
      )}
    />
    <Route
      path="/teacher/question-bank"
      element={(
        <RequireTeacher>
          <QuestionBankPage />
        </RequireTeacher>
      )}
    />
    <Route
      path="/teacher/bulk-import"
      element={(
        <RequireTeacher>
          <BulkImportQuestionsPage />
        </RequireTeacher>
      )}
    />
    <Route
      path="/quiz/:quizId/take"
      element={(
        <RequireStudent>
          <QuizTake />
        </RequireStudent>
      )}
    />
    <Route
      path="/results"
      element={(
        <RequireAuth>
          <ResultsPage />
        </RequireAuth>
      )}
    />

    <Route path="/discover" element={<RequireAuth><Discover /></RequireAuth>} />
    <Route path="/subjects" element={<RequireAuth><SubjectsPage /></RequireAuth>} />
    <Route path="/subjects/:subjectId" element={<RequireAuth><SubjectDetailPage /></RequireAuth>} />
    <Route path="/topics/:topicId" element={<RequireAuth><TopicDetailPage /></RequireAuth>} />
    <Route path="/modules/:moduleId" element={<RequireAuth><ModuleDetailPage /></RequireAuth>} />
    <Route path="/sets/:id" element={<RequireAuth><SetDetail /></RequireAuth>} />
    <Route path="/admin-panel" element={<RequireTeacher><MySets /></RequireTeacher>} />
    <Route path="/my-sets" element={<RequireTeacher><MySets /></RequireTeacher>} />
    <Route path="/admin/users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
    <Route path="/host" element={<RequireTeacher><GameLobby /></RequireTeacher>} />
    <Route path="/join" element={<RequireStudent><GameLobby /></RequireStudent>} />
    <Route path="/lobby" element={<RequireAuth><GameLobby /></RequireAuth>} />
    <Route path="/room/:code" element={<RequireAuth><GameLobby /></RequireAuth>} />
    <Route path="/play" element={<RequireAuth><GamePlay /></RequireAuth>} />
    <Route path="/game/:id" element={<RequireAuth><GamePlay /></RequireAuth>} />
    <Route path="/privacy" element={<LegalInfo />} />
    <Route path="/terms" element={<LegalInfo />} />
    <Route path="/support" element={<LegalInfo />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default AppRoutes
