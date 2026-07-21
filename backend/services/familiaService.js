import pool from '../config/database.js'
import { erroHttp } from '../utils/http.js'

export async function obterFamilia(idUsuario) {
  const [usuarios] = await pool.query('SELECT id_familia FROM usuario WHERE id_usuario = ?', [idUsuario])
  if (!usuarios.length) throw erroHttp(404, 'Usuário não encontrado.')
  if (!usuarios[0].id_familia) return { sucesso: true, dados: null }

  const idFamilia = usuarios[0].id_familia
  const [familias] = await pool.query('SELECT id_familia, nome_familia, criado_em FROM familia WHERE id_familia = ?', [idFamilia])
  const [membros] = await pool.query(
    'SELECT id_usuario, nome, email FROM usuario WHERE id_familia = ? ORDER BY nome',
    [idFamilia]
  )
  return { sucesso: true, dados: { ...familias[0], membros } }
}

export async function criarFamilia(idUsuario, nomeFamilia) {
  const nome = nomeFamilia?.trim()
  if (!nome) throw erroHttp(400, 'Informe o nome da família.')

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [usuarios] = await connection.query('SELECT id_familia FROM usuario WHERE id_usuario = ? FOR UPDATE', [idUsuario])
    if (usuarios[0]?.id_familia) throw erroHttp(409, 'Você já pertence a uma família.')

    const [resultado] = await connection.query('INSERT INTO familia (nome_familia) VALUES (?)', [nome])
    await connection.query('UPDATE usuario SET id_familia = ? WHERE id_usuario = ?', [resultado.insertId, idUsuario])
    await connection.commit()
    return { sucesso: true, mensagem: 'Família criada.', id_familia: resultado.insertId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
}

export async function entrarFamilia(idUsuario, idFamilia) {
  const id = Number(idFamilia)
  if (!Number.isInteger(id) || id < 1) throw erroHttp(400, 'Informe um ID de família válido.')

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [familias] = await connection.query('SELECT id_familia FROM familia WHERE id_familia = ? FOR UPDATE', [id])
    if (!familias.length) throw erroHttp(404, 'Família não encontrada.')
    const [contagem] = await connection.query('SELECT COUNT(*) AS total FROM usuario WHERE id_familia = ?', [id])
    if (Number(contagem[0].total) >= 6) throw erroHttp(409, 'A família já possui 6 membros.')
    await connection.query('UPDATE usuario SET id_familia = ? WHERE id_usuario = ?', [id, idUsuario])
    await connection.commit()
    return { sucesso: true, mensagem: 'Você entrou na família.' }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
}

export async function sairFamilia(idUsuario) {
  await pool.query('UPDATE usuario SET id_familia = NULL WHERE id_usuario = ?', [idUsuario])
  return { sucesso: true, mensagem: 'Você saiu da família.' }
}
