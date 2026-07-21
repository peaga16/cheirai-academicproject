export function enviarErro(res, error, statusPadrao = 500) {
  const status = error.status || statusPadrao
  const mensagem = error.message || 'Ocorreu um erro inesperado.'
  if (status >= 500) console.error(error)
  return res.status(status).json({ sucesso: false, mensagem })
}

export function erroHttp(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
