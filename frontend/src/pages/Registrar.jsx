import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import '../styles/Auth.css'

export default function Registrar() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { registrar } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    
    if (!nome || !email || !senha || !confirmaSenha) {
      setErro('Todos os campos são obrigatórios')
      return
    }
    
    if (senha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres')
      return
    }
    
    if (senha !== confirmaSenha) {
      setErro('Senhas não conferem')
      return
    }

    setCarregando(true)
    try {
      await registrar(nome, email, senha)
    } catch (error) {
      const msg = error.response?.data?.mensagem || error.message || 'Erro ao criar conta'
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
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={carregando}
            required
          />
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
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={carregando}
            required
          />
          <input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmaSenha}
            onChange={(e) => setConfirmaSenha(e.target.value)}
            disabled={carregando}
            required
          />
          <button type="submit" disabled={carregando}>
            {carregando ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>
        <p>
          Já tem conta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Entrar</a>
        </p>
      </div>
    </div>
  )
}