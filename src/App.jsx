import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NuevoJuicio from './pages/NuevoJuicio'
import DetalleJuicio from './pages/DetalleJuicio'
import Layout from './components/Layout'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 10 }}>
        <span className="spinner" />
        <span style={{ color: 'var(--text2)' }}>Cargando...</span>
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <BrowserRouter>
      <Layout session={session}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nuevo" element={<NuevoJuicio />} />
          <Route path="/juicio/:id" element={<DetalleJuicio />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
