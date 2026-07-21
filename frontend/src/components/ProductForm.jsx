import { useEffect, useMemo, useState } from 'react'
import api, { mensagemErro } from '../services/api'

const hoje = new Date().toISOString().slice(0, 10)

export default function ProductForm({ categorias, locais, produto, onCancel, onSaved }) {
  const [form, setForm] = useState({
    nome_produto: produto?.nome_produto || '',
    id_categoria: produto?.id_categoria || '',
    id_local: produto?.id_local || '',
    data_abertura: produto?.data_abertura || hoje,
    prazo_validade: produto?.prazo_validade || '',
    codigo_barras: produto?.codigo_barras || '',
    observacao: produto?.observacao || ''
  })
  const [sugestoes, setSugestoes] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const editando = Boolean(produto)
  const podeSugerir = useMemo(() => form.nome_produto.trim().length >= 2 && !editando, [form.nome_produto, editando])

  useEffect(() => {
    if (!podeSugerir) { setSugestoes([]); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/produtos/sugestoes', { params: { busca: form.nome_produto } })
        setSugestoes(data.dados || [])
      } catch { setSugestoes([]) }
    }, 350)
    return () => clearTimeout(timer)
  }, [form.nome_produto, podeSugerir])

  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  const aplicarSugestao = (sugestao) => {
    setForm((atual) => ({
      ...atual,
      nome_produto: sugestao.nome_alimento,
      prazo_validade: sugestao.prazo_dias,
      id_categoria: sugestao.id_categoria || atual.id_categoria
    }))
    setSugestoes([])
  }

  const enviar = async (event) => {
    event.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const payload = { ...form, prazo_validade: Number(form.prazo_validade) }
      if (editando) await api.put(`/produtos/${produto.id_produto}`, payload)
      else await api.post('/produtos', payload)
      onSaved()
    } catch (error) {
      setErro(mensagemErro(error))
    } finally { setSalvando(false) }
  }

  return (
    <form className="form-grid" onSubmit={enviar}>
      {erro && <div className="alert error full">{erro}</div>}
      <label className="field full">
        <span>Nome do produto</span>
        <input value={form.nome_produto} onChange={(e) => alterar('nome_produto', e.target.value)} placeholder="Ex.: Leite integral" autoFocus required maxLength={150} />
        {sugestoes.length > 0 && (
          <div className="suggestions">
            {sugestoes.map((item) => <button type="button" key={item.id_sugestao} onClick={() => aplicarSugestao(item)}><strong>{item.nome_alimento}</strong><span>{item.prazo_dias} dias</span></button>)}
          </div>
        )}
      </label>
      <label className="field"><span>Categoria</span><select value={form.id_categoria} onChange={(e) => alterar('id_categoria', e.target.value)} required><option value="">Selecione</option>{categorias.map((item) => <option key={item.id_categoria} value={item.id_categoria}>{item.icone} {item.nome_categoria}</option>)}</select></label>
      <label className="field"><span>Local</span><select value={form.id_local} onChange={(e) => alterar('id_local', e.target.value)} required><option value="">Selecione</option>{locais.map((item) => <option key={item.id_local} value={item.id_local}>{item.icone} {item.nome_local}</option>)}</select></label>
      <label className="field"><span>Data de abertura</span><input type="date" max={hoje} value={form.data_abertura} onChange={(e) => alterar('data_abertura', e.target.value)} required /></label>
      <label className="field"><span>Prazo após abertura</span><div className="input-suffix"><input type="number" min="1" max="365" value={form.prazo_validade} onChange={(e) => alterar('prazo_validade', e.target.value)} required /><span>dias</span></div></label>
      <label className="field full"><span>Código de barras <small>(opcional)</small></span><input value={form.codigo_barras} onChange={(e) => alterar('codigo_barras', e.target.value)} inputMode="numeric" maxLength={50} /></label>
      <label className="field full"><span>Observações <small>(opcional)</small></span><textarea rows="3" value={form.observacao} onChange={(e) => alterar('observacao', e.target.value)} maxLength={1000} /></label>
      <div className="form-actions full"><button type="button" className="button secondary" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={salvando}>{salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar produto'}</button></div>
    </form>
  )
}
