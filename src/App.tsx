import { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from '@/pages/landing'
import AuthPage from '@/pages/auth'
import OnboardingPage from '@/pages/onboarding'
import DashboardPage from '@/pages/dashboard'
import './App.css'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const hasSession = Boolean(localStorage.getItem('happify.userId'));
  if (!hasSession) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/:section" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
