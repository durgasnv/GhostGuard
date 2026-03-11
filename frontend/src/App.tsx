import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './LandingPage'
import Dashboard from './Dashboard'
import { AuthModal, AuthProvider, useAuth } from './auth'

function ProtectedDashboard() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
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
