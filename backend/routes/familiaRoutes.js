import express from 'express'
import { verificarToken } from '../middleware/auth.js'
import { enviarErro } from '../utils/http.js'
import { criarFamilia, entrarFamilia, obterFamilia, sairFamilia } from '../services/familiaService.js'

const router = express.Router()
router.use(verificarToken)

router.get('/', async (req, res) => {
  try { return res.json(await obterFamilia(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})
router.post('/', async (req, res) => {
  try { return res.status(201).json(await criarFamilia(req.usuario.id_usuario, req.body.nome_familia)) }
  catch (error) { return enviarErro(res, error) }
})
router.post('/entrar', async (req, res) => {
  try { return res.json(await entrarFamilia(req.usuario.id_usuario, req.body.id_familia)) }
  catch (error) { return enviarErro(res, error) }
})
router.delete('/sair', async (req, res) => {
  try { return res.json(await sairFamilia(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})

export default router
