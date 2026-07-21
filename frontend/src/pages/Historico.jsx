import { Download, FileText, Filter, Printer } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState'
import api, { mensagemErro } from '../services/api'

const formatarDataHora = (data) => new Date(data.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export default function Historico() {
  const [historico, setHistorico] = useState([])
  const [stats, setStats] = useState(null)
  const [filtros, setFiltros] = useState({ tipo: '', mes: '' })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value))
      const [listaRes, statsRes] = await Promise.all([
        api.get('/historico', { params }),
        api.get('/historico/estatisticas')
      ])
      setHistorico(listaRes.data.dados || [])
      setStats(statsRes.data.dados)
    } catch (error) { setErro(mensagemErro(error)) }
    finally { setCarregando(false) }
  }, [filtros])

  useEffect(() => { carregar() }, [carregar])

  const exportarCsv = async () => {
    try {
      const response = await api.get('/historico/exportar.csv', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'historico-cheirai.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) { setErro(mensagemErro(error, 'Não foi possível exportar o histórico.')) }
  }

  return (
    <div className="page-stack history-page">
      <div className="page-heading"><div><span className="eyebrow">Consumo e descarte</span><h2>Histórico de ações</h2><p>Acompanhe o uso dos produtos e sua taxa de desperdício.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => window.print()}><Printer size={18} /> Salvar em PDF</button><button className="button primary" onClick={exportarCsv}><Download size={18} /> Exportar CSV</button></div></div>
      {erro && <div className="alert error">{erro}</div>}

      <section className="stats-grid history-stats">
        <article className="stat-card"><div className="stat-icon neutral"><FileText /></div><div><span>Total de ações</span><strong>{stats?.total_acoes || 0}</strong></div></article>
        <article className="stat-card"><div className="stat-icon success">✓</div><div><span>Consumidos</span><strong>{stats?.consumidos || 0}</strong></div></article>
        <article className="stat-card"><div className="stat-icon warning">↗</div><div><span>Descartados</span><strong>{stats?.descartados || 0}</strong></div></article>
        <article className="stat-card"><div className="stat-icon danger">%</div><div><span>Taxa de desperdício</span><strong>{stats?.taxa_desperdicio || 0}%</strong></div></article>
      </section>

      <section className="filters-panel history-filters">
        <div className="filter-label"><Filter size={18} /><strong>Filtros</strong></div>
        <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}><option value="">Todas as ações</option><option value="consumido">Consumidos</option><option value="descartado">Descartados</option></select>
        <input type="month" value={filtros.mes} onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })} />
      </section>

      <section className="panel table-panel">
        {carregando ? <div className="table-loading">Carregando histórico…</div> : historico.length ? (
          <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria / local</th><th>Ação</th><th>Condição</th><th>Data</th></tr></thead><tbody>{historico.map((item) => <tr key={item.id_historico}><td><strong>{item.nome_produto}</strong></td><td><span className="muted">{item.nome_categoria || '—'} · {item.nome_local || '—'}</span></td><td><span className={`status-badge ${item.tipo === 'consumido' ? 'success' : 'warning'}`}>{item.tipo === 'consumido' ? 'Consumido' : 'Descartado'}</span></td><td>{item.estava_vencido ? <span className="status-badge danger">Estava vencido</span> : <span className="status-badge neutral">Dentro do prazo</span>}</td><td>{formatarDataHora(item.data_acao)}</td></tr>)}</tbody></table></div>
        ) : <EmptyState icon="📋" title="Nenhuma ação encontrada" description="Produtos consumidos ou descartados aparecerão aqui." />}
      </section>
    </div>
  )
}
