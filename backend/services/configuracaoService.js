import pool from '../config/database.js'
import { erroHttp } from '../utils/http.js'

export async function obterConfiguracoes(idUsuario) {
  const [usuarios] = await pool.query(
    `SELECT id_usuario, id_familia, nome, email, idioma, tema
     FROM usuario WHERE id_usuario = ?`,
    [idUsuario]
  )
  if (!usuarios.length) throw erroHttp(404, 'Usuário não encontrado.')

  const [notificacoes] = await pool.query(
    `SELECT id_notificacao, tipo, dias_alerta, horario_envio, ativo
     FROM notificacao WHERE id_usuario = ? AND id_produto IS NULL
     ORDER BY tipo`,
    [idUsuario]
  )

  return { sucesso: true, dados: { usuario: usuarios[0], notificacoes } }
}

export async function atualizarPreferencias(idUsuario, dados) {
  const idiomas = ['pt', 'en', 'es']
  const temas = ['claro', 'escuro', 'automatico']
  if (!idiomas.includes(dados.idioma)) throw erroHttp(400, 'Idioma inválido.')
  if (!temas.includes(dados.tema)) throw erroHttp(400, 'Tema inválido.')

  await pool.query('UPDATE usuario SET idioma = ?, tema = ? WHERE id_usuario = ?', [dados.idioma, dados.tema, idUsuario])
  return { sucesso: true, mensagem: 'Preferências salvas.' }
}

export async function salvarNotificacao(idUsuario, dados) {
  const tipos = ['antes_vencimento', 'dia_vencimento', 'produto_vencido']
  if (!tipos.includes(dados.tipo)) throw erroHttp(400, 'Tipo de notificação inválido.')
  const dias = dados.tipo === 'antes_vencimento' ? Number(dados.dias_alerta) : 0
  if (dias < 0 || dias > 30) throw erroHttp(400, 'O alerta deve estar entre 0 e 30 dias.')
  const horario = /^([01]\d|2[0-3]):[0-5]\d$/.test(dados.horario_envio || '') ? `${dados.horario_envio}:00` : '08:00:00'
  const ativo = dados.ativo ? 1 : 0

  const [existentes] = await pool.query(
    'SELECT id_notificacao FROM notificacao WHERE id_usuario = ? AND id_produto IS NULL AND tipo = ? LIMIT 1',
    [idUsuario, dados.tipo]
  )

  if (existentes.length) {
    await pool.query(
      'UPDATE notificacao SET dias_alerta = ?, horario_envio = ?, ativo = ? WHERE id_notificacao = ?',
      [dias, horario, ativo, existentes[0].id_notificacao]
    )
  } else {
    await pool.query(
      `INSERT INTO notificacao (id_usuario, id_produto, tipo, dias_alerta, horario_envio, ativo)
       VALUES (?, NULL, ?, ?, ?, ?)`,
      [idUsuario, dados.tipo, dias, horario, ativo]
    )
  }

  return { sucesso: true, mensagem: 'Notificação salva.' }
}
