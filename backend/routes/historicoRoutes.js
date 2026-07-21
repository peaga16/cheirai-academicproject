import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.post('/', verifyToken, async (req, res) => res.json({ sucesso: true }));
export default router;
