import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export const useAuth = () => {
  const [usuario, setUsuario] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUsuario({ token })
    }
  }, [])

  const registrar = async (nome, email, senha) => {
    try {
      const { data } = await api.post('/auth/registrar', { nome, email, senha, confirmaSenha: senha })
      localStorage.setItem('token', data.dados.token)
      setUsuario(data.dados)
      navigate('/dashboard')
    } catch (error) {
      throw error
    }
  }

  const login = async (email, senha) => {
    try {
      const { data } = await api.post('/auth/login', { email, senha })
      localStorage.setItem('token', data.dados.token)
      setUsuario(data.dados)
      navigate('/dashboard')
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUsuario(null)
    navigate('/login')
  }

  return { usuario, registrar, login, logout }
}
