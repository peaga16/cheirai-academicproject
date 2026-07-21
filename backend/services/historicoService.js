import pool from '../config/database.js'

export const registrarHistorico = async (usuarioId, idProduto, tipo) => {
  const conn = await pool.getConnection()
  try {
    const [prods] = await conn.query('SELECT status FROM produto WHERE id = ? AND id_usuario = ?', [idProduto, usuarioId])
    if (!prods.length) throw new Error('Produto não encontrado')
    const estaVencido = prods[0].status === 'vencido'
    if (estaVencido && tipo === 'consumido') throw new Error('Produtos vencidos só podem ser descartados')
    await conn.query('INSERT INTO historico (id_produto, id_usuario, tipo, estava_vencido) VALUES (?, ?, ?, ?)', [idProduto, usuarioId, tipo, estaVencido ? 1 : 0])
    await conn.query('DELETE FROM produto WHERE id = ?', [idProduto])
    return { sucesso: true, mensagem: `Produto marcado como ${tipo}` }
  } finally { conn.release() }
}

export const obterHistorico = async (usuarioId, filtros = {}) => {
  const conn = await pool.getConnection()
  try {
    let query = 'SELECT h.*, p.nome as produto FROM historico h LEFT JOIN produto p ON h.id_produto = p.id WHERE h.id_usuario = ?'
    let params = [usuarioId]
    if (filtros.tipo) { query += ' AND h.tipo = ?'; params.push(filtros.tipo) }
    if (filtros.mes) { query += ' AND MONTH(h.data_acao) = ? AND YEAR(h.data_acao) = YEAR(CURDATE())'; params.push(filtros.mes) }
    query += ' ORDER BY h.data_acao DESC LIMIT 100'
    const [historico] = await conn.query(query, params)
    return { sucesso: true, dados: historico }
  } finally { conn.release() }
}

export const obterEstatisticasDesperdicio = async (usuarioId) => {
  const conn = await pool.getConnection()
  try {
    const [stats] = await conn.query('SELECT COUNT(*) as total_acoes, SUM(CASE WHEN tipo = "consumido" THEN 1 ELSE 0 END) as consumido, SUM(CASE WHEN tipo = "descartado" THEN 1 ELSE 0 END) as descartado, SUM(CASE WHEN tipo = "descartado" AND estava_vencido = 1 THEN 1 ELSE 0 END) as desperdicio FROM historico WHERE id_usuario = ?', [usuarioId])
    return { sucesso: true, dados: stats[0] }
  } finally { conn.release() }
}
