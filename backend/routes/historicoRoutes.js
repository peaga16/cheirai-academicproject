import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { registrarHistorico, obterHistorico, obterEstatisticasDesperdicio } from '../services/historicoService.js'

const router = express.Router()

router.post('/', verifyToken, async (req, res) => {
  try {
    const { id_produto, tipo } = req.body
    if (!id_produto || !tipo) return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios' })
    if (!['consumido', 'descartado'].includes(tipo)) return res.status(400).json({ sucesso: false, mensagem: 'Tipo inválido' })
    const resultado = await registrarHistorico(req.usuario.id, id_produto, tipo)
    res.status(201).json(resultado)
  } catch (e) { res.status(400).json({ sucesso: false, mensagem: e.message }) }
})

router.get('/', verifyToken, async (req, res) => {
  try {
    const filtros = { tipo: req.query.tipo, mes: req.query.mes }
    const resultado = await obterHistorico(req.usuario.id, filtros)
    res.status(200).json(resultado)
  } catch (e) { res.status(500).json({ sucesso: false, mensagem: e.message }) }
})

router.get('/estatisticas/desperdicio', verifyToken, async (req, res) => {
  try {
    const resultado = await obterEstatisticasDesperdicio(req.usuario.id)
    res.status(200).json(resultado)
  } catch (e) { res.status(500).json({ sucesso: false, mensagem: e.message }) }
})

export default router
