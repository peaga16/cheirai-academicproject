import express from 'express'
import { verificarToken } from '../middleware/auth.js'
import { enviarErro } from '../utils/http.js'
import { atualizarPreferencias, obterConfiguracoes, salvarNotificacao } from '../services/configuracaoService.js'

const router = express.Router()
router.use(verificarToken)

router.get('/', async (req, res) => {
  try { return res.json(await obterConfiguracoes(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})

router.put('/preferencias', async (req, res) => {
  try { return res.json(await atualizarPreferencias(req.usuario.id_usuario, req.body)) }
  catch (error) { return enviarErro(res, error) }
})

router.put('/notificacoes', async (req, res) => {
  try { return res.json(await salvarNotificacao(req.usuario.id_usuario, req.body)) }
  catch (error) { return enviarErro(res, error) }
})

export default router
