import express from 'express'
import { verificarToken } from '../middleware/auth.js'
import { enviarErro } from '../utils/http.js'
import {
  atualizarProduto,
  buscarSugestoes,
  criarProduto,
  duplicarProduto,
  excluirProduto,
  listarCategorias,
  listarLocais,
  listarProdutos,
  obterResumo
} from '../services/produtoService.js'

const router = express.Router()
router.use(verificarToken)

router.get('/resumo', async (req, res) => {
  try { return res.json(await obterResumo(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})

router.get('/categorias', async (req, res) => {
  try { return res.json(await listarCategorias(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})

router.get('/locais', async (req, res) => {
  try { return res.json(await listarLocais(req.usuario.id_usuario)) }
  catch (error) { return enviarErro(res, error) }
})

router.get('/sugestoes', async (req, res) => {
  try { return res.json(await buscarSugestoes(req.query.busca || '')) }
  catch (error) { return enviarErro(res, error) }
})

router.get('/', async (req, res) => {
  try { return res.json(await listarProdutos(req.usuario.id_usuario, req.query)) }
  catch (error) { return enviarErro(res, error) }
})

router.post('/', async (req, res) => {
  try { return res.status(201).json(await criarProduto(req.usuario.id_usuario, req.body)) }
  catch (error) { return enviarErro(res, error) }
})

router.put('/:id', async (req, res) => {
  try { return res.json(await atualizarProduto(req.usuario.id_usuario, Number(req.params.id), req.body)) }
  catch (error) { return enviarErro(res, error) }
})

router.post('/:id/duplicar', async (req, res) => {
  try { return res.status(201).json(await duplicarProduto(req.usuario.id_usuario, Number(req.params.id))) }
  catch (error) { return enviarErro(res, error) }
})

router.delete('/:id', async (req, res) => {
  try { return res.json(await excluirProduto(req.usuario.id_usuario, Number(req.params.id))) }
  catch (error) { return enviarErro(res, error) }
})

export default router
