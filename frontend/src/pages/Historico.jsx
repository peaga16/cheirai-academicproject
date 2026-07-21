import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import '../styles/Historico.css'

export default function Historico() {
  const [historico, setHistorico] = useState([])
  const [stats, setStats] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const { logout } = useAuth()

  useEffect(() => {
    carregarDados()
  }, [filtroTipo])

  const carregarDados = async () => {
    try {
      const [histRes, statsRes] = await Promise.all([
        api.get('/historico', { params: { tipo: filtroTipo || undefined } }),
        api.get('/historico/estatisticas/desperdicio')
      ])
      setHistorico(histRes.data.dados || [])
      setStats(statsRes.data.dados)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>📋 Histórico</h1>
        <button onClick={logout}>Sair</button>
      </header>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}><h3>Total</h3><p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_acoes}</p></div>
          <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '5px' }}><h3>Consumidos</h3><p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.consumido}</p></div>
          <div style={{ background: '#ffebee', padding: '15px', borderRadius: '5px' }}><h3>Descartados</h3><p style={{ fontSize: '24px', fontWeight: 'bold', color: '#F44336' }}>{stats.descartado}</p></div>
          <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '5px' }}><h3>Desperdício</h3><p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>{stats.total_acoes > 0 ? ((stats.desperdicio / stats.total_acoes) * 100).toFixed(1) : 0}%</p></div>
        </div>
      )}
      <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ marginBottom: '20px' }}>
        <option value="">Todas as Ações</option>
        <option value="consumido">Consumidos</option>
        <option value="descartado">Descartados</option>
      </select>
      {carregando ? <div>Carregando...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f0f0f0' }}><th style={{ padding: '10px', textAlign: 'left' }}>Produto</th><th>Ação</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {historico.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{h.produto || 'Deletado'}</td>
                <td>{h.tipo === 'consumido' ? '✅ Consumido' : '❌ Descartado'}</td>
                <td>{h.estava_vencido ? '🔴 Vencido' : '✅ OK'}</td>
                <td>{new Date(h.data_acao).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
