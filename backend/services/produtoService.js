import pool from '../config/database.js'
import { erroHttp } from '../utils/http.js'

const ESCOPO_FAMILIA = `
  (p.id_usuario = ? OR EXISTS (
    SELECT 1
    FROM usuario usuario_atual
    INNER JOIN usuario usuario_dono ON usuario_dono.id_usuario = p.id_usuario
    WHERE usuario_atual.id_usuario = ?
      AND usuario_atual.id_familia IS NOT NULL
      AND usuario_dono.id_familia = usuario_atual.id_familia
  ))
`

const SELECT_BASE = `
  SELECT
    p.id_produto,
    p.id_usuario,
    p.id_categoria,
    p.id_local,
    p.id_produto_origem,
    p.nome_produto,
    p.codigo_barras,
    p.data_abertura,
    p.prazo_validade,
    p.data_vencimento,
    CASE
      WHEN p.data_vencimento < CURDATE() THEN 'vencido'
      WHEN p.data_vencimento = CURDATE() THEN 'vence_hoje'
      WHEN DATEDIFF(p.data_vencimento, CURDATE()) <= 3 THEN 'atencao'
      ELSE 'ok'
    END AS status,
    DATEDIFF(p.data_vencimento, CURDATE()) AS dias_restantes,
    p.observacao,
    c.nome_categoria,
    c.icone AS categoria_icone,
    l.nome_local,
    l.icone AS local_icone
  FROM produto p
  LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
  LEFT JOIN local_armazenamento l ON l.id_local = p.id_local
`

function validarProduto(dados) {
  const nome = dados.nome_produto?.trim()
  const prazo = Number(dados.prazo_validade)
  const hoje = new Date().toISOString().slice(0, 10)

  if (!nome) throw erroHttp(400, 'Informe o nome do produto.')
  if (!dados.data_abertura) throw erroHttp(400, 'Informe a data de abertura.')
  if (dados.data_abertura > hoje) throw erroHttp(400, 'A data de abertura não pode ser futura.')
  if (!Number.isInteger(prazo) || prazo < 1 || prazo > 365) {
    throw erroHttp(400, 'O prazo pós-abertura deve estar entre 1 e 365 dias.')
  }
  if (!dados.id_categoria) throw erroHttp(400, 'Selecione uma categoria.')
  if (!dados.id_local) throw erroHttp(400, 'Selecione um local de armazenamento.')

  return {
    nome_produto: nome,
    id_categoria: Number(dados.id_categoria),
    id_local: Number(dados.id_local),
    data_abertura: dados.data_abertura,
    prazo_validade: prazo,
    codigo_barras: dados.codigo_barras?.trim() || null,
    observacao: dados.observacao?.trim() || null
  }
}

async function obterProdutoAtivo(idUsuario, idProduto, connection = pool) {
  const [produtos] = await connection.query(
    `${SELECT_BASE}
     WHERE p.id_produto = ? AND ${ESCOPO_FAMILIA}
       AND NOT EXISTS (SELECT 1 FROM historico h WHERE h.id_produto = p.id_produto)
     LIMIT 1`,
    [idProduto, idUsuario, idUsuario]
  )
  if (!produtos.length) throw erroHttp(404, 'Produto ativo não encontrado.')
  return produtos[0]
}

export async function listarProdutos(idUsuario, filtros = {}) {
  let sql = `${SELECT_BASE}
    WHERE ${ESCOPO_FAMILIA}
      AND NOT EXISTS (SELECT 1 FROM historico h WHERE h.id_produto = p.id_produto)`
  const params = [idUsuario, idUsuario]

  if (filtros.status) {
    sql += ` AND (CASE
      WHEN p.data_vencimento < CURDATE() THEN 'vencido'
      WHEN p.data_vencimento = CURDATE() THEN 'vence_hoje'
      WHEN DATEDIFF(p.data_vencimento, CURDATE()) <= 3 THEN 'atencao'
      ELSE 'ok' END) = ?`
    params.push(filtros.status)
  }
  if (filtros.id_categoria) {
    sql += ' AND p.id_categoria = ?'
    params.push(Number(filtros.id_categoria))
  }
  if (filtros.id_local) {
    sql += ' AND p.id_local = ?'
    params.push(Number(filtros.id_local))
  }
  if (filtros.busca) {
    sql += ' AND p.nome_produto LIKE ?'
    params.push(`%${filtros.busca.trim()}%`)
  }

  sql += ' ORDER BY p.data_vencimento ASC, p.nome_produto ASC'
  const [produtos] = await pool.query(sql, params)
  return { sucesso: true, dados: produtos }
}

export async function obterResumo(idUsuario) {
  const [linhas] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN data_vencimento > DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 1 ELSE 0 END) AS validos,
       SUM(CASE WHEN data_vencimento BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 1 ELSE 0 END) AS atencao,
       SUM(CASE WHEN data_vencimento = CURDATE() THEN 1 ELSE 0 END) AS vence_hoje,
       SUM(CASE WHEN data_vencimento < CURDATE() THEN 1 ELSE 0 END) AS vencidos
     FROM produto p
     WHERE ${ESCOPO_FAMILIA}
       AND NOT EXISTS (SELECT 1 FROM historico h WHERE h.id_produto = p.id_produto)`,
    [idUsuario, idUsuario]
  )

  const [proximos] = await pool.query(
    `${SELECT_BASE}
     WHERE ${ESCOPO_FAMILIA}
       AND NOT EXISTS (SELECT 1 FROM historico h WHERE h.id_produto = p.id_produto)
     ORDER BY p.data_vencimento ASC LIMIT 1`,
    [idUsuario, idUsuario]
  )

  const resumo = linhas[0]
  return {
    sucesso: true,
    dados: {
      total: Number(resumo.total || 0),
      validos: Number(resumo.validos || 0),
      atencao: Number(resumo.atencao || 0),
      vence_hoje: Number(resumo.vence_hoje || 0),
      vencidos: Number(resumo.vencidos || 0),
      proximo: proximos[0] || null
    }
  }
}

export async function criarProduto(idUsuario, dados) {
  const produto = validarProduto(dados)
  const [resultado] = await pool.query(
    `INSERT INTO produto
      (id_usuario, id_categoria, id_local, nome_produto, codigo_barras, data_abertura,
       prazo_validade, data_vencimento, status, observacao, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), 'ok', ?, 1)`,
    [
      idUsuario,
      produto.id_categoria,
      produto.id_local,
      produto.nome_produto,
      produto.codigo_barras,
      produto.data_abertura,
      produto.prazo_validade,
      produto.data_abertura,
      produto.prazo_validade,
      produto.observacao
    ]
  )

  return { sucesso: true, mensagem: 'Produto cadastrado com sucesso.', id_produto: resultado.insertId }
}

export async function atualizarProduto(idUsuario, idProduto, dados) {
  await obterProdutoAtivo(idUsuario, idProduto)
  const produto = validarProduto(dados)

  await pool.query(
    `UPDATE produto SET
       id_categoria = ?, id_local = ?, nome_produto = ?, codigo_barras = ?,
       data_abertura = ?, prazo_validade = ?, observacao = ?, sincronizado = 1
     WHERE id_produto = ?`,
    [
      produto.id_categoria,
      produto.id_local,
      produto.nome_produto,
      produto.codigo_barras,
      produto.data_abertura,
      produto.prazo_validade,
      produto.observacao,
      idProduto
    ]
  )

  return { sucesso: true, mensagem: 'Produto atualizado com sucesso.' }
}

export async function duplicarProduto(idUsuario, idProduto) {
  const original = await obterProdutoAtivo(idUsuario, idProduto)
  const hoje = new Date().toISOString().slice(0, 10)

  const [resultado] = await pool.query(
    `INSERT INTO produto
      (id_usuario, id_categoria, id_local, id_produto_origem, nome_produto, codigo_barras,
       data_abertura, prazo_validade, data_vencimento, status, observacao, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), 'ok', ?, 1)`,
    [
      idUsuario,
      original.id_categoria,
      original.id_local,
      original.id_produto,
      original.nome_produto,
      original.codigo_barras,
      hoje,
      original.prazo_validade,
      hoje,
      original.prazo_validade,
      original.observacao
    ]
  )

  return { sucesso: true, mensagem: 'Nova abertura criada.', id_produto: resultado.insertId }
}

export async function excluirProduto(idUsuario, idProduto) {
  await obterProdutoAtivo(idUsuario, idProduto)
  await pool.query('DELETE FROM produto WHERE id_produto = ?', [idProduto])
  return { sucesso: true, mensagem: 'Produto excluído.' }
}

export async function listarCategorias(idUsuario) {
  const [dados] = await pool.query(
    `SELECT id_categoria, nome_categoria, icone
     FROM categoria WHERE id_usuario IS NULL OR id_usuario = ?
     ORDER BY id_usuario IS NOT NULL, nome_categoria`,
    [idUsuario]
  )
  return { sucesso: true, dados }
}

export async function listarLocais(idUsuario) {
  const [dados] = await pool.query(
    `SELECT id_local, nome_local, icone
     FROM local_armazenamento WHERE id_usuario IS NULL OR id_usuario = ?
     ORDER BY id_usuario IS NOT NULL, nome_local`,
    [idUsuario]
  )
  return { sucesso: true, dados }
}

export async function buscarSugestoes(busca = '') {
  const termo = busca.trim()
  const [dados] = await pool.query(
    `SELECT s.id_sugestao, s.nome_alimento, s.prazo_dias, s.id_categoria, c.nome_categoria
     FROM sugestao_prazo s
     LEFT JOIN categoria c ON c.id_categoria = s.id_categoria
     WHERE s.nome_alimento LIKE ?
     ORDER BY CASE WHEN s.nome_alimento LIKE ? THEN 0 ELSE 1 END, s.nome_alimento
     LIMIT 10`,
    [`%${termo}%`, `${termo}%`]
  )
  return { sucesso: true, dados }
}
