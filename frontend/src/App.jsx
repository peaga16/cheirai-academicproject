import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Registrar from './pages/Registrar'
import Dashboard from './pages/Dashboard'

function App() {
  const { usuario } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Registrar />} />
      <Route path="/dashboard" element={usuario ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/" element={usuario ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
    </Routes>
  )
}

export default App
