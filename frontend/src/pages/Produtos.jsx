import { Check, Copy, Edit3, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import ProductForm from '../components/ProductForm'
import api, { mensagemErro } from '../services/api'

const statusInfo = {
  ok: { label: 'Dentro do prazo', className: 'success' },
  atencao: { label: 'Atenção', className: 'warning' },
  vence_hoje: { label: 'Vence hoje', className: 'orange' },
  vencido: { label: 'Vencido', className: 'danger' }
}

const formatarData = (data) => new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')

export default function Produtos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [locais, setLocais] = useState([])
  const [filtros, setFiltros] = useState({ busca: '', status: '', id_categoria: '', id_local: '' })
  const [modal, setModal] = useState(searchParams.get('novo') === '1' ? { tipo: 'novo' } : null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const [produtosRes, categoriasRes, locaisRes] = await Promise.all([
        api.get('/produtos', { params: Object.fromEntries(Object.entries(filtros).filter(([, value]) => value)) }),
        api.get('/produtos/categorias'),
        api.get('/produtos/locais')
      ])
      setProdutos(produtosRes.data.dados || [])
      setCategorias(categoriasRes.data.dados || [])
      setLocais(locaisRes.data.dados || [])
    } catch (error) { setErro(mensagemErro(error)) }
    finally { setCarregando(false) }
  }, [filtros])

  useEffect(() => {
    const timer = setTimeout(carregar, 250)
    return () => clearTimeout(timer)
  }, [carregar])

  useEffect(() => {
    if (searchParams.get('novo') === '1') setModal({ tipo: 'novo' })
  }, [searchParams])

  const fecharModal = () => {
    setModal(null)
    if (searchParams.has('novo')) { searchParams.delete('novo'); setSearchParams(searchParams, { replace: true }) }
  }

  const executar = async (id, acao, mensagem) => {
    setProcessando(`${id}-${acao}`)
    try {
      if (acao === 'consumido' || acao === 'descartado') await api.post('/historico', { id_produto: id, tipo: acao })
      if (acao === 'duplicar') await api.post(`/produtos/${id}/duplicar`)
      if (acao === 'excluir') await api.delete(`/produtos/${id}`)
      await carregar()
      setModal(mensagem ? { tipo: 'sucesso', mensagem } : null)
    } catch (error) { setErro(mensagemErro(error)); setModal(null) }
    finally { setProcessando(null) }
  }

  const limparFiltros = () => setFiltros({ busca: '', status: '', id_categoria: '', id_local: '' })
  const filtrosAtivos = Object.values(filtros).some(Boolean)

  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">Cadastro e validade</span><h2>Produtos ativos</h2><p>A lista é ordenada automaticamente por urgência.</p></div><button className="button primary" onClick={() => setModal({ tipo: 'novo' })}><Plus size={18} /> Novo produto</button></div>
      {erro && <div className="alert error">{erro}</div>}

      <section className="filters-panel">
        <label className="search-field"><Search size={19} /><input value={filtros.busca} onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })} placeholder="Buscar por nome…" /></label>
        <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}><option value="">Todos os status</option><option value="ok">Dentro do prazo</option><option value="atencao">Atenção</option><option value="vence_hoje">Vence hoje</option><option value="vencido">Vencidos</option></select>
        <select value={filtros.id_categoria} onChange={(e) => setFiltros({ ...filtros, id_categoria: e.target.value })}><option value="">Todas as categorias</option>{categorias.map((item) => <option value={item.id_categoria} key={item.id_categoria}>{item.nome_categoria}</option>)}</select>
        <select value={filtros.id_local} onChange={(e) => setFiltros({ ...filtros, id_local: e.target.value })}><option value="">Todos os locais</option>{locais.map((item) => <option value={item.id_local} key={item.id_local}>{item.nome_local}</option>)}</select>
        {filtrosAtivos && <button className="button ghost compact" onClick={limparFiltros}><X size={17} /> Limpar</button>}
      </section>

      {carregando ? <div className="product-grid"><div className="product-card skeleton" /><div className="product-card skeleton" /><div className="product-card skeleton" /></div> : produtos.length ? (
        <section className="product-grid">
          {produtos.map((produto) => {
            const status = statusInfo[produto.status] || statusInfo.ok
            const vencido = produto.status === 'vencido'
            return (
              <article className={`product-card status-${produto.status}`} key={produto.id_produto}>
                <div className="product-card-top"><div className="product-emoji">{produto.categoria_icone || '📦'}</div><span className={`status-badge ${status.className}`}>{status.label}</span></div>
                <div className="product-card-copy"><h3>{produto.nome_produto}</h3><p>{produto.nome_categoria} · {produto.nome_local}</p></div>
                <dl className="product-details"><div><dt>Aberto em</dt><dd>{formatarData(produto.data_abertura)}</dd></div><div><dt>Vencimento</dt><dd>{formatarData(produto.data_vencimento)}</dd></div><div className="full"><dt>Prazo</dt><dd>{produto.prazo_validade} dias após abrir</dd></div></dl>
                <div className="days-left">{produto.dias_restantes < 0 ? <><strong>{Math.abs(produto.dias_restantes)}</strong><span>dia(s) vencido</span></> : produto.dias_restantes === 0 ? <><strong>Hoje</strong><span>é o último dia</span></> : <><strong>{produto.dias_restantes}</strong><span>dia(s) restante(s)</span></>}</div>
                <div className="card-actions">
                  <button title="Consumido" disabled={vencido || Boolean(processando)} onClick={() => setModal({ tipo: 'confirmar', acao: 'consumido', produto })}><Check size={18} /></button>
                  <button title="Descartado" disabled={Boolean(processando)} onClick={() => setModal({ tipo: 'confirmar', acao: 'descartado', produto })}><X size={18} /></button>
                  <button title="Editar" onClick={() => setModal({ tipo: 'editar', produto })}><Edit3 size={18} /></button>
                  <button title="Duplicar nova abertura" onClick={() => setModal({ tipo: 'confirmar', acao: 'duplicar', produto })}><Copy size={18} /></button>
                  <button title="Excluir" className="danger-action" onClick={() => setModal({ tipo: 'confirmar', acao: 'excluir', produto })}><Trash2 size={18} /></button>
                </div>
              </article>
            )
          })}
        </section>
      ) : <EmptyState icon={<SlidersHorizontal size={32} />} title={filtrosAtivos ? 'Nenhum resultado' : 'Nenhum produto cadastrado'} description={filtrosAtivos ? 'Ajuste ou limpe os filtros para procurar novamente.' : 'Cadastre o primeiro produto aberto para começar o controle.'} action={!filtrosAtivos && <button className="button primary" onClick={() => setModal({ tipo: 'novo' })}><Plus size={18} /> Cadastrar produto</button>} />}

      {(modal?.tipo === 'novo' || modal?.tipo === 'editar') && <Modal title={modal.tipo === 'novo' ? 'Cadastrar produto' : 'Editar produto'} onClose={fecharModal}><ProductForm categorias={categorias} locais={locais} produto={modal.produto} onCancel={fecharModal} onSaved={async () => { fecharModal(); await carregar() }} /></Modal>}
      {modal?.tipo === 'confirmar' && <Modal title="Confirmar ação" onClose={() => setModal(null)}><div className="confirm-box"><div className="confirm-icon">{modal.acao === 'consumido' ? '✅' : modal.acao === 'descartado' ? '🗑️' : modal.acao === 'duplicar' ? '📋' : '⚠️'}</div><h3>{modal.acao === 'consumido' ? 'Marcar como consumido?' : modal.acao === 'descartado' ? 'Marcar como descartado?' : modal.acao === 'duplicar' ? 'Criar nova abertura?' : 'Excluir definitivamente?'}</h3><p><strong>{modal.produto.nome_produto}</strong>{modal.acao === 'excluir' ? ' será removido sem ir para o histórico.' : modal.acao === 'duplicar' ? ' será duplicado com a data de abertura de hoje.' : ' sairá da lista ativa e será registrado no histórico.'}</p><div className="form-actions"><button className="button secondary" onClick={() => setModal(null)}>Cancelar</button><button className={`button ${modal.acao === 'excluir' ? 'danger' : 'primary'}`} disabled={Boolean(processando)} onClick={() => executar(modal.produto.id_produto, modal.acao)}>{processando ? 'Processando…' : 'Confirmar'}</button></div></div></Modal>}
    </div>
  )
}
