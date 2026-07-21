import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

function aplicarTema(tema) {
  const sistemaEscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const temaFinal = tema === 'automatico' ? (sistemaEscuro ? 'escuro' : 'claro') : (tema || 'claro')
  document.documentElement.dataset.theme = temaFinal
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cheirai_usuario')) }
    catch { return null }
  })
  const [carregando, setCarregando] = useState(true)

  const salvarSessao = useCallback((token, novoUsuario) => {
    localStorage.setItem('cheirai_token', token)
    localStorage.setItem('cheirai_usuario', JSON.stringify(novoUsuario))
    setUsuario(novoUsuario)
    aplicarTema(novoUsuario.tema)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cheirai_token')
    localStorage.removeItem('cheirai_usuario')
    setUsuario(null)
    aplicarTema('claro')
  }, [])

  useEffect(() => {
    const iniciar = async () => {
      const token = localStorage.getItem('cheirai_token')
      if (!token) {
        setCarregando(false)
        aplicarTema('claro')
        return
      }

      try {
        const { data } = await api.get('/auth/perfil')
        localStorage.setItem('cheirai_usuario', JSON.stringify(data.usuario))
        setUsuario(data.usuario)
        aplicarTema(data.usuario.tema)
      } catch {
        logout()
      } finally {
        setCarregando(false)
      }
    }
    iniciar()
  }, [logout])

  const login = useCallback(async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha })
    salvarSessao(data.token, data.usuario)
    return data.usuario
  }, [salvarSessao])

  const registrar = useCallback(async (nome, email, senha) => {
    const { data } = await api.post('/auth/registrar', { nome, email, senha })
    salvarSessao(data.token, data.usuario)
    return data.usuario
  }, [salvarSessao])

  const atualizarUsuario = useCallback((dados) => {
    setUsuario((atual) => {
      const novo = { ...atual, ...dados }
      localStorage.setItem('cheirai_usuario', JSON.stringify(novo))
      aplicarTema(novo.tema)
      return novo
    })
  }, [])

  const valor = useMemo(() => ({
    usuario,
    carregando,
    autenticado: Boolean(usuario),
    login,
    registrar,
    logout,
    atualizarUsuario
  }), [usuario, carregando, login, registrar, logout, atualizarUsuario])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
