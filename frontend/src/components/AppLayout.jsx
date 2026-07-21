import { BarChart3, History, LogOut, Menu, Package, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/configuracoes', label: 'Configurações', icon: Settings }
]

const titulos = {
  '/dashboard': 'Visão geral',
  '/produtos': 'Meus produtos',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações'
}

export default function AppLayout() {
  const { usuario, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuAberto ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div><strong>Cheiraí</strong><span>Validade sob controle</span></div>
          <button className="icon-button sidebar-close" onClick={() => setMenuAberto(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMenuAberto(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{usuario?.nome?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="user-copy"><strong>{usuario?.nome}</strong><span>{usuario?.email}</span></div>
          <button className="icon-button" onClick={logout} title="Sair" aria-label="Sair"><LogOut size={19} /></button>
        </div>
      </aside>

      {menuAberto && <button className="sidebar-backdrop" onClick={() => setMenuAberto(false)} aria-label="Fechar menu" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuAberto(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <div><span className="eyebrow">Cheiraí</span><h1>{titulos[location.pathname] || 'Cheiraí'}</h1></div>
          <div className="topbar-profile"><span>Olá,</span><strong>{usuario?.nome?.split(' ')[0]}</strong></div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
