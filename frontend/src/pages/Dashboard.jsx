import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const { logout } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/produtos/dashboard')
      setStats(data.dados)
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  return (
    <div className="dashboard">
      <header>
        <h1>🧂 Cheiraí - Dashboard</h1>
        <button onClick={logout}>Sair</button>
      </header>
      
      <div className="stats">
        <div className="stat-card">
          <h2>Total</h2>
          <p>{stats?.total || 0}</p>
        </div>
        <div className="stat-card">
          <h2>OK</h2>
          <p>{stats?.validos || 0}</p>
        </div>
        <div className="stat-card">
          <h2>Atenção</h2>
          <p>{stats?.atencao || 0}</p>
        </div>
        <div className="stat-card">
          <h2>Vence Hoje</h2>
          <p>{stats?.vence_hoje || 0}</p>
        </div>
        <div className="stat-card">
          <h2>Vencidos</h2>
          <p>{stats?.vencidos || 0}</p>
        </div>
      </div>
    </div>
  )
}
