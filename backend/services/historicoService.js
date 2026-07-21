import pool from '../config/database.js'
import { erroHttp } from '../utils/http.js'

export async function registrarAcao(idUsuario, idProduto, tipo) {
  if (!['consumido', 'descartado'].includes(tipo)) throw erroHttp(400, 'Ação inválida.')

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [produtos] = await connection.query(
      `SELECT id_produto, data_vencimento,
        CASE WHEN data_vencimento < CURDATE() THEN 1 ELSE 0 END AS estava_vencido
       FROM produto p
       WHERE p.id_produto = ?
         AND (p.id_usuario = ? OR EXISTS (
           SELECT 1 FROM usuario usuario_atual
           INNER JOIN usuario usuario_dono ON usuario_dono.id_usuario = p.id_usuario
           WHERE usuario_atual.id_usuario = ?
             AND usuario_atual.id_familia IS NOT NULL
             AND usuario_dono.id_familia = usuario_atual.id_familia
         ))
         AND NOT EXISTS (SELECT 1 FROM historico h WHERE h.id_produto = p.id_produto)
       FOR UPDATE`,
      [idProduto, idUsuario, idUsuario]
    )

    if (!produtos.length) throw erroHttp(404, 'Produto ativo não encontrado.')
    const produto = produtos[0]
    if (produto.estava_vencido && tipo === 'consumido') {
      throw erroHttp(400, 'Produtos vencidos só podem ser descartados.')
    }

    await connection.query(
      `INSERT INTO historico (id_produto, id_usuario, tipo, estava_vencido)
       VALUES (?, ?, ?, ?)`,
      [idProduto, idUsuario, tipo, produto.estava_vencido ? 1 : 0]
    )
    await connection.commit()
    return { sucesso: true, mensagem: `Produto marcado como ${tipo}.` }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function listarHistorico(idUsuario, filtros = {}) {
  let sql = `
    SELECT h.id_historico, h.id_produto, h.tipo, h.estava_vencido, h.data_acao,
           p.nome_produto, c.nome_categoria, l.nome_local
    FROM historico h
    INNER JOIN produto p ON p.id_produto = h.id_produto
    LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
    LEFT JOIN local_armazenamento l ON l.id_local = p.id_local
    INNER JOIN usuario ator ON ator.id_usuario = h.id_usuario
    INNER JOIN usuario atual ON atual.id_usuario = ?
    WHERE (h.id_usuario = ? OR (atual.id_familia IS NOT NULL AND ator.id_familia = atual.id_familia))`
  const params = [idUsuario, idUsuario]

  if (filtros.tipo) {
    sql += ' AND h.tipo = ?'
    params.push(filtros.tipo)
  }
  if (filtros.mes) {
    sql += " AND DATE_FORMAT(h.data_acao, '%Y-%m') = ?"
    params.push(filtros.mes)
  }
  sql += ' ORDER BY h.data_acao DESC LIMIT 500'

  const [dados] = await pool.query(sql, params)
  return { sucesso: true, dados }
}

export async function obterEstatisticas(idUsuario) {
  const [linhas] = await pool.query(
    `SELECT
       COUNT(*) AS total_acoes,
       SUM(tipo = 'consumido') AS consumidos,
       SUM(tipo = 'descartado') AS descartados,
       SUM(tipo = 'descartado' AND estava_vencido = 1) AS desperdicios
     FROM historico h
     INNER JOIN usuario ator ON ator.id_usuario = h.id_usuario
     INNER JOIN usuario atual ON atual.id_usuario = ?
     WHERE h.id_usuario = ? OR (atual.id_familia IS NOT NULL AND ator.id_familia = atual.id_familia)`,
    [idUsuario, idUsuario]
  )
  const s = linhas[0]
  const total = Number(s.total_acoes || 0)
  const desperdicios = Number(s.desperdicios || 0)
  return {
    sucesso: true,
    dados: {
      total_acoes: total,
      consumidos: Number(s.consumidos || 0),
      descartados: Number(s.descartados || 0),
      desperdicios,
      taxa_desperdicio: total ? Number(((desperdicios / total) * 100).toFixed(1)) : 0
    }
  }
}

function csvEscape(value) {
  const texto = String(value ?? '')
  return `"${texto.replaceAll('"', '""')}"`
}

export async function exportarCsv(idUsuario) {
  const { dados } = await listarHistorico(idUsuario)
  const linhas = [
    ['Produto', 'Categoria', 'Local', 'Ação', 'Estava vencido', 'Data'].map(csvEscape).join(';'),
    ...dados.map((item) => [
      item.nome_produto,
      item.nome_categoria,
      item.nome_local,
      item.tipo,
      item.estava_vencido ? 'Sim' : 'Não',
      item.data_acao
    ].map(csvEscape).join(';'))
  ]
  return '\ufeff' + linhas.join('\n')
}
