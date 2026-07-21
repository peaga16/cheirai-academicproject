import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import '../styles/Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    
    if (!email || !senha) {
      setErro('Email e senha são obrigatórios')
      return
    }

    setCarregando(true)
    try {
      await login(email, senha)
    } catch (error) {
      const msg = error.response?.data?.mensagem || error.message || 'Erro ao fazer login'
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>🧂 Cheiraí</h1>
        {erro && <div style={{ color: 'red', marginBottom: '10px', padding: '10px', background: '#ffe0e0', borderRadius: '5px' }}>{erro}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={carregando}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={carregando}
            required
          />
          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p>
          Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/registrar') }}>Criar uma agora</a>
        </p>
      </div>
    </div>
  )
}