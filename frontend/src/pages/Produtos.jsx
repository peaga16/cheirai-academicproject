import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import Modal from '../components/Modal'
import '../styles/Produtos.css'

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [locais, setLocais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busca, setBusca] = useState('')
  const [modalAberta, setModalAberta] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const { logout } = useAuth()

  useEffect(() => {
    carregarDados()
  }, [filtroStatus, filtroCategoria, busca])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [prodRes, catRes, locRes] = await Promise.all([
        api.get('/produtos', { params: { status: filtroStatus || undefined, id_categoria: filtroCategoria || undefined, busca: busca || undefined } }),
        api.get('/produtos/categorias'),
        api.get('/produtos/locais')
      ])
      setProdutos(prodRes.data.dados || [])
      setCategorias(catRes.data.dados || [])
      setLocais(locRes.data.dados || [])
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setCarregando(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/produtos/${id}`)
      setProdutos(produtos.filter(p => p.id !== id))
      setConfirmDeleteId(null)
    } catch (error) {
      alert('Erro: ' + error.response?.data?.mensagem)
    }
  }

  const handleMarcar = async (id, tipo) => {
    try {
      await api.post('/historico', { id_produto: id, tipo })
      setProdutos(produtos.filter(p => p.id !== id))
    } catch (error) {
      alert('Erro: ' + error.response?.data?.mensagem)
    }
  }

  return (
    <div className="produtos-container">
      <header>
        <h1>🧂 Produtos</h1>
        <button onClick={logout}>Sair</button>
      </header>
      <div className="filtros">
        <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Status</option>
          <option value="ok">OK</option>
          <option value="atencao">Atenção</option>
          <option value="vence_hoje">Vence Hoje</option>
          <option value="vencido">Vencido</option>
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Categoria</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <button onClick={() => setModalAberta(true)}>➕ Novo</button>
      </div>
      <div className="produtos-grid">
        {carregando ? <div>Carregando...</div> : produtos.map(p => (
          <div key={p.id} className="card">
            <h3>{p.nome}</h3>
            <p>Categoria: {p.categoria}</p>
            <p>Local: {p.local}</p>
            <p>Vence: {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</p>
            <div className="actions">
              <button onClick={() => handleMarcar(p.id, 'consumido')}>✅</button>
              <button onClick={() => handleMarcar(p.id, 'descartado')}>❌</button>
              <button onClick={() => setConfirmDeleteId(p.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {modalAberta && <Modal onClose={() => setModalAberta(false)}><FormProduto categorias={categorias} locais={locais} onSucesso={() => { setModalAberta(false); carregarDados() }} /></Modal>}
      {confirmDeleteId && <Modal onClose={() => setConfirmDeleteId(null)}><div style={{ padding: '20px', textAlign: 'center' }}><p>Deletar?</p><button onClick={() => handleDelete(confirmDeleteId)}>Sim</button><button onClick={() => setConfirmDeleteId(null)}>Não</button></div></Modal>}
    </div>
  )
}

function FormProduto({ categorias, locais, onSucesso }) {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [local, setLocal] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [prazo, setPrazo] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/produtos', { nome_produto: nome, id_categoria: categoria || null, id_local: local || null, data_abertura: data, prazo_validade: parseInt(prazo) })
      onSucesso()
    } catch (error) {
      alert('Erro: ' + error.response?.data?.mensagem)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)}><option value="">Categoria</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      <select value={local} onChange={(e) => setLocal(e.target.value)}><option value="">Local</option>{locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select>
      <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
      <input type="number" placeholder="Prazo (dias)" min="1" max="365" value={prazo} onChange={(e) => setPrazo(e.target.value)} required />
      <button type="submit">Criar</button>
    </form>
  )
}
