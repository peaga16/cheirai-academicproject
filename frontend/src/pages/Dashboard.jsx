import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    carregarStats()
  }, [])

  const carregarStats = async () => {
    try {
      const { data } = await api.get('/produtos/dashboard')
      setStats(data.dados)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🧂 Cheiraí - Dashboard</h1>
        <button onClick={logout} className="btn-logout">Sair</button>
      </header>

      <nav className="navbar">
        <button onClick={() => navigate('/dashboard')} className="nav-btn active">📊 Dashboard</button>
        <button onClick={() => navigate('/produtos')} className="nav-btn">📦 Produtos</button>
        <button onClick={() => navigate('/historico')} className="nav-btn">📋 Histórico</button>
      </nav>
      
      {carregando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>Carregando...</div>
      ) : (
        <div className="stats">
          <div className="stat-card">
            <h2>Total</h2>
            <p>{stats?.resumo?.total || 0}</p>
          </div>
          <div className="stat-card">
            <h2>✅ OK</h2>
            <p>{stats?.resumo?.validos || 0}</p>
          </div>
          <div className="stat-card">
            <h2>⚠️ Atenção</h2>
            <p>{stats?.resumo?.atencao || 0}</p>
          </div>
          <div className="stat-card">
            <h2>🔶 Vence Hoje</h2>
            <p>{stats?.resumo?.vence_hoje || 0}</p>
          </div>
          <div className="stat-card">
            <h2>❌ Vencidos</h2>
            <p>{stats?.resumo?.vencidos || 0}</p>
          </div>
        </div>
      )}

      {stats?.proximoVencimento && (
        <div className="proximo-vencimento">
          <h3>Próximo a Vencer</h3>
          <p><strong>{stats.proximoVencimento.nome}</strong></p>
          <p>Vence em: {new Date(stats.proximoVencimento.data_vencimento).toLocaleDateString('pt-BR')}</p>
        </div>
      )}
    </div>
  )
}
