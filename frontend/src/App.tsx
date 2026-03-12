import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './LandingPage'
import Dashboard from './Dashboard'
import IntroPage from './IntroPage'
import { AuthModal, AuthProvider, useAuth } from './auth'

function ProtectedDashboard() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Dashboard />
}

function App() {
  const [showIntro, setShowIntro] = useState(true)

  // Skip intro if already seen in current session (optional)
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro')
    if (hasSeenIntro) {
      setShowIntro(false)
    }
  }, [])

  const handleIntroComplete = () => {
    sessionStorage.setItem('hasSeenIntro', 'true')
    setShowIntro(false)
  }

  return (
    <AuthProvider>
      {showIntro && <IntroPage onHunt={handleIntroComplete} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedDashboard />} />
        </Routes>
        <AuthModal />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
