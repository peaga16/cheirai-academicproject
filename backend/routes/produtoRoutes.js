import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { criarProduto, listarProdutos } from '../services/produtoService.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    const r = await criarProduto(req.usuario.id, req.body);
    res.json(r);
  } catch (e) {
    res.status(400).json({ sucesso: false, msg: e.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await listarProdutos(req.usuario.id);
    res.json(r);
  } catch (e) {
    res.status(500).json({ sucesso: false, msg: e.message });
  }
});

export default router;
