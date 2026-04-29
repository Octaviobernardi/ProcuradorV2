import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ children, session }) {
  const navigate = useNavigate()
  const location = useLocation()

  async function logout() {
    await supabase.auth.signOut()
  }

  const navLink = (path, label) => (
    <button
      onClick={() => navigate(path)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 500, padding: '6px 12px',
        borderRadius: 'var(--radius)',
        color: location.pathname === path ? 'var(--text)' : 'var(--text2)',
        background: location.pathname === path ? 'var(--bg2)' : 'transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
      <header style={{
        background: 'var(--bg)', borderBottom: '0.5px solid var(--border)',
        padding: '0 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 52, position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 15, marginRight: 12 }}>Procurador</span>
          {navLink('/', 'Tablero')}
          {navLink('/nuevo', '+ Nuevo juicio')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{session?.user?.email}</span>
          <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {children}
      </main>
    </div>
  )
}
