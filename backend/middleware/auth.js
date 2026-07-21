import jwt from 'jsonwebtoken'

export function verificarToken(req, res, next) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null

  if (!token) {
    return res.status(401).json({ sucesso: false, mensagem: 'Faça login para continuar.' })
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'chave-local-cheirai')
    return next()
  } catch {
    return res.status(401).json({ sucesso: false, mensagem: 'Sessão inválida ou expirada.' })
  }
}
