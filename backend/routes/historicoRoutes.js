import express from 'express'
import { verificarToken } from '../middleware/auth.js'
import { enviarErro } from '../utils/http.js'
import { exportarCsv, listarHistorico, obterEstatisticas, registrarAcao } from '../services/historicoService.js'

const router = express.Router()
router.use(verificarToken)

router.get('/estatisticas', async (req, res) => {
  try { return res.json(await obterEstatisticas(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})

router.get('/exportar.csv', async (req, res) => {
  try {
    const csv = await exportarCsv(req.usuario.id_usuario)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="historico-cheirai.csv"')
    return res.send(csv)
  } catch (error) { return enviarErro(res, error) }
})

router.get('/', async (req, res) => {
  try { return res.json(await listarHistorico(req.usuario.id_usuario, req.query)) }
  catch (error) { return enviarErro(res, error) }
})

router.post('/', async (req, res) => {
  try { return res.status(201).json(await registrarAcao(req.usuario.id_usuario, Number(req.body.id_produto), req.body.tipo)) }
  catch (error) { return enviarErro(res, error) }
})

export default router
