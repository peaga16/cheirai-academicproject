import { AlertTriangle, CalendarClock, CheckCircle2, CircleX, Package, Plus, Refrigerator } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import api, { mensagemErro } from '../services/api'

const statusInfo = {
  ok: { label: 'Dentro do prazo', className: 'success' },
  atencao: { label: 'Próximo do vencimento', className: 'warning' },
  vence_hoje: { label: 'Vence hoje', className: 'orange' },
  vencido: { label: 'Vencido', className: 'danger' }
}

function dataPt(data) {
  if (!data) return '—'
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
}

export default function Dashboard() {
  const [resumo, setResumo] = useState(null)
  const [urgentes, setUrgentes] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resumoRes, produtosRes] = await Promise.all([
          api.get('/produtos/resumo'),
          api.get('/produtos')
        ])
        setResumo(resumoRes.data.dados)
        setUrgentes((produtosRes.data.dados || []).slice(0, 5))
      } catch (error) { setErro(mensagemErro(error)) }
      finally { setCarregando(false) }
    }
    carregar()
  }, [])

  if (carregando) return <div className="skeleton-grid"><div /><div /><div /><div /></div>

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div><span className="eyebrow">Controle pós-abertura</span><h2>Seus alimentos, no tempo certo.</h2><p>Cadastre o que abriu hoje e deixe o Cheiraí acompanhar o vencimento.</p></div>
        <Link className="button light" to="/produtos?novo=1"><Plus size={18} /> Novo produto</Link>
      </section>

      {erro && <div className="alert error">{erro}</div>}

      <section className="stats-grid">
        <article className="stat-card"><div className="stat-icon neutral"><Package /></div><div><span>Total ativo</span><strong>{resumo?.total || 0}</strong></div></article>
        <article className="stat-card"><div className="stat-icon success"><CheckCircle2 /></div><div><span>Dentro do prazo</span><strong>{resumo?.validos || 0}</strong></div></article>
        <article className="stat-card"><div className="stat-icon warning"><AlertTriangle /></div><div><span>Atenção / hoje</span><strong>{(resumo?.atencao || 0) + (resumo?.vence_hoje || 0)}</strong></div></article>
        <article className="stat-card"><div className="stat-icon danger"><CircleX /></div><div><span>Vencidos</span><strong>{resumo?.vencidos || 0}</strong></div></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel next-card">
          <div className="panel-heading"><div><span className="eyebrow">Prioridade</span><h2>Próximo vencimento</h2></div><CalendarClock size={24} /></div>
          {resumo?.proximo ? (
            <div className="next-product">
              <div className="product-emoji">{resumo.proximo.categoria_icone || '📦'}</div>
              <div><strong>{resumo.proximo.nome_produto}</strong><span>{resumo.proximo.nome_local || 'Sem local'}</span></div>
              <div className="next-date"><strong>{dataPt(resumo.proximo.data_vencimento)}</strong><span>{resumo.proximo.dias_restantes < 0 ? `${Math.abs(resumo.proximo.dias_restantes)} dia(s) vencido` : resumo.proximo.dias_restantes === 0 ? 'Vence hoje' : `Faltam ${resumo.proximo.dias_restantes} dia(s)`}</span></div>
            </div>
          ) : <EmptyState icon="🌿" title="Tudo limpo por aqui" description="Cadastre um produto para acompanhar o próximo vencimento." />}
        </article>

        <article className="panel tips-card"><div className="panel-heading"><div><span className="eyebrow">Organização</span><h2>Dica do dia</h2></div><Refrigerator size={24} /></div><p>Posicione os produtos que vencem primeiro na parte da frente da geladeira. Assim, eles ficam visíveis e são consumidos antes.</p></article>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Ordenado por urgência</span><h2>Produtos que pedem atenção</h2></div><Link to="/produtos" className="text-link">Ver todos</Link></div>
        {urgentes.length ? (
          <div className="compact-list">
            {urgentes.map((produto) => {
              const status = statusInfo[produto.status] || statusInfo.ok
              return <div className="compact-row" key={produto.id_produto}><div className="product-emoji small">{produto.categoria_icone || '📦'}</div><div className="grow"><strong>{produto.nome_produto}</strong><span>{produto.nome_categoria} · {produto.nome_local}</span></div><span className={`status-badge ${status.className}`}>{status.label}</span><strong className="date-column">{dataPt(produto.data_vencimento)}</strong></div>
            })}
          </div>
        ) : <EmptyState icon="📦" title="Nenhum produto ativo" description="Seu dashboard será preenchido depois do primeiro cadastro." />}
      </section>
    </div>
  )
}
