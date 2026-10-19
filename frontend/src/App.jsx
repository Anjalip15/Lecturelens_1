import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Shell from './components/Shell'
import LogoMark from './components/Logo'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ProcessLecture from './pages/ProcessLecture'
import History from './pages/History'
import LectureDetail from './pages/LectureDetail'
import PickLecture from './pages/PickLecture'

function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-5"
    >
      <LogoMark size={64} className="pulse-soft" />
      <div className="text-center">
        <p className="text-xl font-bold text-ink">LectureLens</p>
        <p className="mt-1 text-sm text-ink-muted">Loading your workspace…</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { session } = useAuth()
  if (session === undefined) return <LoadingScreen />
  if (!session) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { session } = useAuth()

  if (session === undefined) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route element={<RequireAuth><Shell /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="process" element={<ProcessLecture />} />
        <Route path="history" element={<History />} />
        <Route path="history/:lectureId" element={<LectureDetail />} />
        <Route path="pick/:service" element={<PickLecture />} />
      </Route>
    </Routes>
  )
}