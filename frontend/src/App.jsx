import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import LoadingScreen from './components/LoadingScreen'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import Configuracoes from './pages/Configuracoes'
import Dashboard from './pages/Dashboard'
import Historico from './pages/Historico'
import Login from './pages/Login'
import Produtos from './pages/Produtos'
import Registrar from './pages/Registrar'

export default function App() {
  const { carregando, autenticado } = useAuth()
  if (carregando) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Registrar />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to={autenticado ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={autenticado ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
