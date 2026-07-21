import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import pool from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import configuracaoRoutes from './routes/configuracaoRoutes.js'
import familiaRoutes from './routes/familiaRoutes.js'
import historicoRoutes from './routes/historicoRoutes.js'
import produtoRoutes from './routes/produtoRoutes.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 5000)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((item) => item.trim())

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.json({ status: 'ok', banco: 'conectado', app: 'Cheiraí' })
  } catch (error) {
    return res.status(503).json({ status: 'erro', banco: 'desconectado', mensagem: error.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/produtos', produtoRoutes)
app.use('/api/historico', historicoRoutes)
app.use('/api/configuracoes', configuracaoRoutes)
app.use('/api/familia', familiaRoutes)

app.use((_req, res) => res.status(404).json({ sucesso: false, mensagem: 'Rota não encontrada.' }))
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' })
})

app.listen(port, () => console.log(`Cheiraí API: http://localhost:${port}`))
