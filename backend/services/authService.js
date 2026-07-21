import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { erroHttp } from '../utils/http.js'

function gerarToken(usuario) {
  return jwt.sign(
    { id_usuario: usuario.id_usuario, email: usuario.email },
    process.env.JWT_SECRET || 'chave-local-cheirai',
    { expiresIn: '7d' }
  )
}

function usuarioPublico(usuario) {
  return {
    id_usuario: usuario.id_usuario,
    id_familia: usuario.id_familia,
    nome: usuario.nome,
    email: usuario.email,
    idioma: usuario.idioma,
    tema: usuario.tema
  }
}

export async function registrar({ nome, email, senha }) {
  const nomeLimpo = nome?.trim()
  const emailLimpo = email?.trim().toLowerCase()

  if (!nomeLimpo || !emailLimpo || !senha) throw erroHttp(400, 'Preencha nome, e-mail e senha.')
  if (senha.length < 6) throw erroHttp(400, 'A senha deve ter pelo menos 6 caracteres.')

  const [existentes] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ?', [emailLimpo])
  if (existentes.length) throw erroHttp(409, 'Este e-mail já está cadastrado.')

  const senhaHash = await bcrypt.hash(senha, 10)
  const [resultado] = await pool.query(
    `INSERT INTO usuario (nome, email, senha, idioma, tema)
     VALUES (?, ?, ?, 'pt', 'automatico')`,
    [nomeLimpo, emailLimpo, senhaHash]
  )

  const usuario = {
    id_usuario: resultado.insertId,
    id_familia: null,
    nome: nomeLimpo,
    email: emailLimpo,
    idioma: 'pt',
    tema: 'automatico'
  }

  return { sucesso: true, token: gerarToken(usuario), usuario }
}

export async function login({ email, senha }) {
  const emailLimpo = email?.trim().toLowerCase()
  if (!emailLimpo || !senha) throw erroHttp(400, 'Informe e-mail e senha.')

  const [usuarios] = await pool.query(
    `SELECT id_usuario, id_familia, nome, email, senha, idioma, tema
     FROM usuario WHERE email = ? LIMIT 1`,
    [emailLimpo]
  )

  const usuario = usuarios[0]
  if (!usuario || !usuario.senha || !(await bcrypt.compare(senha, usuario.senha))) {
    throw erroHttp(401, 'E-mail ou senha incorretos.')
  }

  return {
    sucesso: true,
    token: gerarToken(usuario),
    usuario: usuarioPublico(usuario)
  }
}

export async function obterPerfil(idUsuario) {
  const [usuarios] = await pool.query(
    `SELECT id_usuario, id_familia, nome, email, idioma, tema
     FROM usuario WHERE id_usuario = ? LIMIT 1`,
    [idUsuario]
  )
  if (!usuarios.length) throw erroHttp(404, 'Usuário não encontrado.')
  return { sucesso: true, usuario: usuarios[0] }
}
