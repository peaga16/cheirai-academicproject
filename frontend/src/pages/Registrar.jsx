import { Check, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { mensagemErro } from '../services/api'

export default function Registrar() {
  const { registrar, autenticado } = useAuth()
  const navigate = useNavigate()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado) return <Navigate to="/dashboard" replace />

  const enviar = async (event) => {
    event.preventDefault()
    setErro('')
    if (form.senha !== form.confirmar) return setErro('As senhas não são iguais.')
    if (form.senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    setEnviando(true)
    try {
      await registrar(form.nome, form.email, form.senha)
      navigate('/dashboard', { replace: true })
    } catch (error) { setErro(mensagemErro(error)) }
    finally { setEnviando(false) }
  }

  return (
    <div className="auth-page">
      <section className="auth-showcase register">
        <div className="auth-brand"><div className="brand-mark large">C</div><strong>Cheiraí</strong></div>
        <div className="showcase-copy"><span className="pill light">Comece em poucos minutos</span><h1>Cuide melhor do que já está na sua casa.</h1><ul className="benefits"><li><Check size={18} /> Controle por categoria e local</li><li><Check size={18} /> Alertas de vencimento</li><li><Check size={18} /> Histórico de consumo e descarte</li></ul></div>
      </section>
      <main className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand"><div className="brand-mark">C</div><strong>Cheiraí</strong></div>
          <span className="eyebrow">Nova conta</span><h2>Crie seu acesso</h2><p className="muted">Preencha os dados para começar.</p>
          {erro && <div className="alert error">{erro}</div>}
          <form className="auth-form" onSubmit={enviar}>
            <label className="field"><span>Nome completo</span><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required autoFocus /></label>
            <label className="field"><span>E-mail</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label className="field"><span>Senha</span><div className="password-input"><input type={mostrarSenha ? 'text' : 'password'} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} minLength="6" required /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label="Mostrar ou ocultar senha">{mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
            <label className="field"><span>Confirmar senha</span><input type={mostrarSenha ? 'text' : 'password'} value={form.confirmar} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} minLength="6" required /></label>
            <button className="button primary wide" disabled={enviando}>{enviando ? 'Criando conta…' : 'Criar conta'}</button>
          </form>
          <p className="auth-switch">Já possui conta? <Link to="/login">Entrar</Link></p>
        </div>
      </main>
    </div>
  )
}
