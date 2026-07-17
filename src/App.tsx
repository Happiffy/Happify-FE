import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getFirebaseAuth } from '@/config/firebase'
import LandingPage from '@/pages/landing'
import AuthPage from '@/pages/auth'
import OnboardingPage from '@/pages/onboarding'
import DashboardPage from '@/pages/dashboard'
import DownloadsPage from '@/pages/downloads'
import './App.css'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = getFirebaseAuth();
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(Boolean(auth.currentUser));

  useEffect(() => {
    let active = true;
    void auth.authStateReady().then(() => {
      if (!active) return;
      setSignedIn(Boolean(auth.currentUser));
      setAuthReady(true);
    });
    return () => { active = false; };
  }, [auth]);

  if (!authReady) return <div className="grid min-h-screen place-items-center font-black text-[#58CC02]">Loading Happify...</div>;
  if (!signedIn) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/downloads" element={<DownloadsPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/:section" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
