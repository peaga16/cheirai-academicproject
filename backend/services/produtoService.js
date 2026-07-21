import pool from '../config/database.js'

export const criarProduto = async (usuarioId, dados) => {
  const conn = await pool.getConnection()
  try {
    const { nome_produto, id_categoria, id_local, data_abertura, prazo_validade } = dados
    
    if (!nome_produto || !data_abertura || !prazo_validade) {
      throw new Error('Campos obrigatórios faltando')
    }
    
    const [res] = await conn.query(
      'INSERT INTO produto (id_usuario, id_categoria, id_local, nome, data_abertura, prazo_validade) VALUES (?, ?, ?, ?, ?, ?)',
      [usuarioId, id_categoria || null, id_local || null, nome_produto, data_abertura, prazo_validade]
    )
    
    return { sucesso: true, mensagem: 'Produto criado', dados: { id: res.insertId } }
  } finally { 
    conn.release() 
  }
}

export const listarProdutos = async (usuarioId) => {
  const conn = await pool.getConnection()
  try {
    const [prods] = await conn.query(
      'SELECT p.*, c.nome as categoria, l.nome as local FROM produto p LEFT JOIN categoria c ON p.id_categoria = c.id LEFT JOIN local_armazenamento l ON p.id_local = l.id WHERE p.id_usuario = ? ORDER BY p.data_vencimento ASC',
      [usuarioId]
    )
    return { sucesso: true, dados: prods }
  } finally { 
    conn.release() 
  }
}

export const obterProduto = async (usuarioId, produtoId) => {
  const conn = await pool.getConnection()
  try {
    const [prods] = await conn.query(
      'SELECT * FROM produto WHERE id = ? AND id_usuario = ?',
      [produtoId, usuarioId]
    )
    if (!prods.length) throw new Error('Produto não encontrado')
    return { sucesso: true, dados: prods[0] }
  } finally { 
    conn.release() 
  }
}

export const atualizarProduto = async (usuarioId, produtoId, dados) => {
  const conn = await pool.getConnection()
  try {
    await conn.query(
      'UPDATE produto SET nome = COALESCE(?, nome), id_categoria = COALESCE(?, id_categoria), id_local = COALESCE(?, id_local), data_abertura = COALESCE(?, data_abertura), prazo_validade = COALESCE(?, prazo_validade) WHERE id = ? AND id_usuario = ?',
      [dados.nome_produto || null, dados.id_categoria || null, dados.id_local || null, dados.data_abertura || null, dados.prazo_validade || null, produtoId, usuarioId]
    )
    return { sucesso: true, mensagem: 'Produto atualizado' }
  } finally { 
    conn.release() 
  }
}

export const deletarProduto = async (usuarioId, produtoId) => {
  const conn = await pool.getConnection()
  try {
    const [res] = await conn.query(
      'DELETE FROM produto WHERE id = ? AND id_usuario = ?',
      [produtoId, usuarioId]
    )
    if (!res.affectedRows) throw new Error('Produto não encontrado')
    return { sucesso: true, mensagem: 'Produto deletado' }
  } finally { 
    conn.release() 
  }
}

export const obterDashboard = async (usuarioId) => {
  const conn = await pool.getConnection()
  try {
    const [stats] = await conn.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = "ok" THEN 1 ELSE 0 END) as validos, SUM(CASE WHEN status = "atencao" THEN 1 ELSE 0 END) as atencao, SUM(CASE WHEN status = "vence_hoje" THEN 1 ELSE 0 END) as vence_hoje, SUM(CASE WHEN status = "vencido" THEN 1 ELSE 0 END) as vencidos FROM produto WHERE id_usuario = ?',
      [usuarioId]
    )
    return { sucesso: true, dados: stats[0] || { total: 0, validos: 0, atencao: 0, vence_hoje: 0, vencidos: 0 } }
  } finally { 
    conn.release() 
  }
}