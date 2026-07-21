import { Eye, EyeOff, Leaf } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { mensagemErro } from '../services/api'

export default function Login() {
  const { login, autenticado } = useAuth()
  const navigate = useNavigate()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado) return <Navigate to="/dashboard" replace />

  const enviar = async (event) => {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await login(form.email, form.senha)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErro(mensagemErro(error, 'Não foi possível entrar.'))
    } finally { setEnviando(false) }
  }

  return (
    <div className="auth-page">
      <section className="auth-showcase">
        <div className="auth-brand"><div className="brand-mark large">C</div><strong>Cheiraí</strong></div>
        <div className="showcase-copy"><span className="pill light"><Leaf size={15} /> Menos desperdício</span><h1>Saiba o que vence antes que seja tarde.</h1><p>Organize alimentos abertos, receba alertas e acompanhe tudo em um só lugar.</p></div>
        <div className="showcase-card"><span>Próximo vencimento</span><strong>Leite integral</strong><small>Faltam 2 dias</small></div>
      </section>

      <main className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand"><div className="brand-mark">C</div><strong>Cheiraí</strong></div>
          <span className="eyebrow">Bem-vindo de volta</span><h2>Entre na sua conta</h2><p className="muted">Continue acompanhando seus produtos.</p>
          {erro && <div className="alert error">{erro}</div>}
          <form className="auth-form" onSubmit={enviar}>
            <label className="field"><span>E-mail</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required autoFocus /></label>
            <label className="field"><span>Senha</span><div className="password-input"><input type={mostrarSenha ? 'text' : 'password'} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Sua senha" required /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label="Mostrar ou ocultar senha">{mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
            <button className="button primary wide" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
          </form>
          <p className="auth-switch">Ainda não tem conta? <Link to="/registrar">Criar conta</Link></p>
        </div>
      </main>
    </div>
  )
}
