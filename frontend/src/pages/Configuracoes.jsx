import { Bell, Check, Globe2, LogOut, Moon, Save, Sun, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import api, { mensagemErro } from '../services/api'

const padraoNotificacoes = {
  antes_vencimento: { tipo: 'antes_vencimento', dias_alerta: 3, horario_envio: '08:00', ativo: true },
  dia_vencimento: { tipo: 'dia_vencimento', dias_alerta: 0, horario_envio: '08:00', ativo: true },
  produto_vencido: { tipo: 'produto_vencido', dias_alerta: 0, horario_envio: '08:00', ativo: true }
}

export default function Configuracoes() {
  const { usuario, atualizarUsuario, logout } = useAuth()
  const [preferencias, setPreferencias] = useState({ idioma: usuario?.idioma || 'pt', tema: usuario?.tema || 'automatico' })
  const [notificacoes, setNotificacoes] = useState(padraoNotificacoes)
  const [familia, setFamilia] = useState(null)
  const [formFamilia, setFormFamilia] = useState({ nome_familia: '', id_familia: '' })
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const [configRes, familiaRes] = await Promise.all([api.get('/configuracoes'), api.get('/familia')])
      const dados = configRes.data.dados
      setPreferencias({ idioma: dados.usuario.idioma, tema: dados.usuario.tema })
      const mapa = { ...padraoNotificacoes }
      for (const item of dados.notificacoes || []) mapa[item.tipo] = { ...item, horario_envio: String(item.horario_envio).slice(0, 5), ativo: Boolean(item.ativo) }
      setNotificacoes(mapa)
      setFamilia(familiaRes.data.dados)
    } catch (error) { setErro(mensagemErro(error)) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const mostrarSucesso = (texto) => {
    setMensagem(texto)
    setErro('')
    setTimeout(() => setMensagem(''), 3500)
  }

  const salvarPreferencias = async () => {
    setSalvando(true)
    try {
      await api.put('/configuracoes/preferencias', preferencias)
      atualizarUsuario(preferencias)
      mostrarSucesso('Preferências salvas com sucesso.')
    } catch (error) { setErro(mensagemErro(error)) }
    finally { setSalvando(false) }
  }

  const salvarNotificacao = async (tipo) => {
    try {
      await api.put('/configuracoes/notificacoes', notificacoes[tipo])
      mostrarSucesso('Configuração de alerta salva.')
    } catch (error) { setErro(mensagemErro(error)) }
  }

  const acaoFamilia = async (acao) => {
    setErro('')
    try {
      if (acao === 'criar') await api.post('/familia', { nome_familia: formFamilia.nome_familia })
      if (acao === 'entrar') await api.post('/familia/entrar', { id_familia: formFamilia.id_familia })
      if (acao === 'sair') await api.delete('/familia/sair')
      setFormFamilia({ nome_familia: '', id_familia: '' })
      await carregar()
      mostrarSucesso(acao === 'criar' ? 'Família criada.' : acao === 'entrar' ? 'Você entrou na família.' : 'Você saiu da família.')
    } catch (error) { setErro(mensagemErro(error)) }
  }

  const nomeTema = useMemo(() => preferencias.tema === 'claro' ? 'Claro' : preferencias.tema === 'escuro' ? 'Escuro' : 'Automático', [preferencias.tema])

  return (
    <div className="page-stack settings-page">
      <div className="page-heading"><div><span className="eyebrow">Conta e preferências</span><h2>Configurações</h2><p>Personalize alertas, tema, idioma e compartilhamento familiar.</p></div></div>
      {erro && <div className="alert error">{erro}</div>}
      {mensagem && <div className="alert success"><Check size={18} /> {mensagem}</div>}

      <section className="settings-grid">
        <article className="panel settings-card account-card">
          <div className="panel-heading"><div><span className="eyebrow">Perfil</span><h2>Sua conta</h2></div><div className="avatar large-avatar">{usuario?.nome?.charAt(0).toUpperCase()}</div></div>
          <div className="account-data"><div><span>Nome</span><strong>{usuario?.nome}</strong></div><div><span>E-mail</span><strong>{usuario?.email}</strong></div></div>
          <button className="button secondary" onClick={logout}><LogOut size={18} /> Sair da conta</button>
        </article>

        <article className="panel settings-card">
          <div className="panel-heading"><div><span className="eyebrow">Aparência</span><h2>Tema e idioma</h2></div>{preferencias.tema === 'escuro' ? <Moon /> : <Sun />}</div>
          <label className="field"><span>Tema atual: {nomeTema}</span><select value={preferencias.tema} onChange={(e) => setPreferencias({ ...preferencias, tema: e.target.value })}><option value="claro">Claro</option><option value="escuro">Escuro</option><option value="automatico">Automático</option></select></label>
          <label className="field"><span><Globe2 size={15} /> Idioma</span><select value={preferencias.idioma} onChange={(e) => setPreferencias({ ...preferencias, idioma: e.target.value })}><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></label>
          <button className="button primary" onClick={salvarPreferencias} disabled={salvando}><Save size={18} /> {salvando ? 'Salvando…' : 'Salvar preferências'}</button>
        </article>
      </section>

      <section className="panel settings-card">
        <div className="panel-heading"><div><span className="eyebrow">Lembretes</span><h2>Notificações</h2></div><Bell /></div>
        <div className="notification-grid">
          {[
            ['antes_vencimento', 'Antes do vencimento', 'Receba um alerta com antecedência.'],
            ['dia_vencimento', 'No dia do vencimento', 'Lembrete no último dia de uso.'],
            ['produto_vencido', 'Produto vencido', 'Aviso para descarte seguro.']
          ].map(([tipo, titulo, descricao]) => {
            const item = notificacoes[tipo]
            return <div className="notification-card" key={tipo}><div className="notification-title"><div><strong>{titulo}</strong><span>{descricao}</span></div><label className="switch"><input type="checkbox" checked={item.ativo} onChange={(e) => setNotificacoes({ ...notificacoes, [tipo]: { ...item, ativo: e.target.checked } })} /><span /></label></div><div className="notification-fields">{tipo === 'antes_vencimento' && <label className="field compact-field"><span>Dias antes</span><input type="number" min="0" max="30" value={item.dias_alerta} onChange={(e) => setNotificacoes({ ...notificacoes, [tipo]: { ...item, dias_alerta: Number(e.target.value) } })} /></label>}<label className="field compact-field"><span>Horário</span><input type="time" value={item.horario_envio} onChange={(e) => setNotificacoes({ ...notificacoes, [tipo]: { ...item, horario_envio: e.target.value } })} /></label><button className="button secondary compact" onClick={() => salvarNotificacao(tipo)}>Salvar</button></div></div>
          })}
        </div>
      </section>

      <section className="panel settings-card">
        <div className="panel-heading"><div><span className="eyebrow">Compartilhamento</span><h2>Família</h2></div><Users /></div>
        {familia ? (
          <div className="family-box"><div className="family-code"><span>ID para convite</span><strong>#{familia.id_familia}</strong><small>Compartilhe este número com até 5 pessoas.</small></div><div className="family-members"><h3>{familia.nome_familia}</h3>{familia.membros.map((membro) => <div className="member-row" key={membro.id_usuario}><div className="avatar small-avatar">{membro.nome.charAt(0).toUpperCase()}</div><div><strong>{membro.nome}</strong><span>{membro.email}</span></div></div>)}</div><button className="button danger" onClick={() => acaoFamilia('sair')}>Sair da família</button></div>
        ) : (
          <div className="family-onboarding"><div><h3>Criar uma família</h3><p>Compartilhe os produtos com pessoas da mesma casa.</p><div className="inline-form"><input value={formFamilia.nome_familia} onChange={(e) => setFormFamilia({ ...formFamilia, nome_familia: e.target.value })} placeholder="Nome da família" /><button className="button primary" onClick={() => acaoFamilia('criar')}>Criar</button></div></div><div className="divider-word">ou</div><div><h3>Entrar em uma família</h3><p>Use o ID enviado por outro membro.</p><div className="inline-form"><input type="number" min="1" value={formFamilia.id_familia} onChange={(e) => setFormFamilia({ ...formFamilia, id_familia: e.target.value })} placeholder="ID da família" /><button className="button secondary" onClick={() => acaoFamilia('entrar')}>Entrar</button></div></div></div>
        )}
      </section>
    </div>
  )
}
