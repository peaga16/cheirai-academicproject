import express from 'express'
import { registrarUsuario, loginUsuario } from '../services/authService.js'

const router = express.Router()

router.post('/registrar', async (req, res) => {
  try {
    console.log('Recebido:', req.body)
    const resultado = await registrarUsuario(req.body.nome, req.body.email, req.body.senha)
    res.status(201).json(resultado)
  } catch (error) {
    console.error('Erro ao registrar:', error)
    res.status(400).json({ sucesso: false, mensagem: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    console.log('Recebido:', req.body)
    const resultado = await loginUsuario(req.body.email, req.body.senha)
    res.status(200).json(resultado)
  } catch (error) {
    console.error('Erro ao login:', error)
    res.status(401).json({ sucesso: false, mensagem: error.message })
  }
})

export default router