import pool from '../config/database.js'
import bcrypt from 'bcryptjs'
import { generateToken } from '../middleware/auth.js'

export const registrarUsuario = async (nome, email, senha) => {
  const conn = await pool.getConnection()
  try {
    const [users] = await conn.query('SELECT id FROM usuario WHERE email = ?', [email])
    if (users.length) throw new Error('Email já existe')
    
    const hash = await bcrypt.hash(senha, 10)
    const [res] = await conn.query('INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash])
    
    const token = generateToken(res.insertId, email)
    return { 
      sucesso: true, 
      dados: { 
        id: res.insertId, 
        nome, 
        email, 
        token 
      } 
    }
  } finally { 
    conn.release() 
  }
}

export const loginUsuario = async (email, senha) => {
  const conn = await pool.getConnection()
  try {
    const [users] = await conn.query('SELECT id, nome, email, senha FROM usuario WHERE email = ?', [email])
    if (!users.length) throw new Error('Credenciais inválidas')
    
    const usuario = users[0]
    const ok = await bcrypt.compare(senha, usuario.senha)
    if (!ok) throw new Error('Credenciais inválidas')
    
    const token = generateToken(usuario.id, usuario.email)
    return { 
      sucesso: true, 
      dados: { 
        id: usuario.id, 
        nome: usuario.nome, 
        email: usuario.email, 
        token 
      } 
    }
  } finally { 
    conn.release() 
  }
}

export const mudarSenha = async (usuarioId, senhaAtual, novaSenha) => {
  const conn = await pool.getConnection()
  try {
    const [users] = await conn.query('SELECT senha FROM usuario WHERE id = ?', [usuarioId])
    if (!users.length) throw new Error('Usuário não encontrado')
    
    const ok = await bcrypt.compare(senhaAtual, users[0].senha)
    if (!ok) throw new Error('Senha atual incorreta')
    
    const novaHash = await bcrypt.hash(novaSenha, 10)
    await conn.query('UPDATE usuario SET senha = ? WHERE id = ?', [novaHash, usuarioId])
    
    return { sucesso: true, mensagem: 'Senha alterada com sucesso' }
  } finally { 
    conn.release() 
  }
}