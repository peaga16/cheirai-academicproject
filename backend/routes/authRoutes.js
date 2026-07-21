import express from 'express'
import { login, obterPerfil, registrar } from '../services/authService.js'
import { verificarToken } from '../middleware/auth.js'
import { enviarErro } from '../utils/http.js'

const router = express.Router()

router.post('/registrar', async (req, res) => {
  try {
    return res.status(201).json(await registrar(req.body))
  } catch (error) {
    return enviarErro(res, error)
  }
})

router.post('/login', async (req, res) => {
  try {
    return res.json(await login(req.body))
  } catch (error) {
    return enviarErro(res, error)
  }
})

router.get('/perfil', verificarToken, async (req, res) => {
  try {
    return res.json(await obterPerfil(req.usuario.id_usuario))
  } catch (error) {
    return enviarErro(res, error)
  }
})

export default router
