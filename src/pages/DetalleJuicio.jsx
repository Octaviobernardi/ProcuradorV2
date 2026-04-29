import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcularVencimiento, getEstado, ETAPAS, ESTADO_LABELS, MATERIAS } from '../lib/expedientes'
import { fmtFecha, diasHabilesRestantes } from '../lib/fechas'

export default function DetalleJuicio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exp, setExp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchExp() }, [id])

  async function fetchExp() {
    setLoading(true)
    const { data } = await supabase.from('expedientes').select('*').eq('id', id).single()
    setExp(data)
    setLoading(false)
  }

  function toast(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function avanzarEtapa() {
    if (!exp || exp.etapa_idx >= 5) return
    setSaving('avanzar')
    const nueva = exp.etapa_idx + 1
    const hoy = new Date().toISOString().split('T')[0]
    const hist = [...(exp.historial || []), { etapa: nueva, fecha: hoy, nota: 'Avance de etapa' }]
    const { error } = await supabase.from('expedientes')
      .update({ etapa_idx: nueva, fecha_etapa: hoy, plazo_base: hoy, plazo_dias_habiles: ETAPAS[nueva]?.plazo || 0, historial: hist })
      .eq('id', id)
    if (error) toast(error.message, false)
    else { toast('Etapa actualizada'); fetchExp() }
    setSaving('')
  }

  async function archivar() {
    setSaving('archivar')
    const { error } = await supabase.from('expedientes').update({ archivado: !exp.archivado }).eq('id', id)
    if (error) toast(error.message, false)
    else { toast(exp.archivado ? 'Desarchivado' : 'Archivado'); fetchExp() }
    setSaving('')
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este expediente definitivamente? No se puede deshacer.')) return
    setSaving('eliminar')
    const { error } = await supabase.from('expedientes').delete().eq('id', id)
    if (error) { toast(error.message, false); setSaving('') }
    else navigate('/')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2rem', color: 'var(--text2)' }}>
      <span className="spinner" /> Cargando...
    </div>
  )
  if (!exp) return <div style={{ color: 'var(--red-text)', padding: '1rem' }}>Expediente no encontrado.</div>

  const est = getEstado(exp)
  const venc = calcularVencimiento(exp)
  const diasRest = venc ? diasHabilesRestantes(venc) : null
  const matLabel = MATERIAS.find(m => m.value === exp.materia)?.label

  return (
    <div style={{ maxWidth: 760 }}>
      {msg && (
        <div style={{
          marginBottom: '1rem', padding: '10px 14px', borderRadius: 'var(--radius)',
          background: msg.ok ? 'var(--green-bg)' : 'var(--red-bg)',
          color: msg.ok ? 'var(--green-text)' : 'var(--red-text)',
          border: `0.5px solid ${msg.ok ? 'var(--green-border)' : 'var(--red-border)'}`,
          fontSize: 13
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => navigate('/')}>← Volver</button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>{exp.nro}</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{exp.caratula}</p>
        </div>
        <span className={`badge badge-${est}`} style={{ marginLeft: 'auto' }}>{ESTADO_LABELS[est]}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progreso del juicio</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ETAPAS.map((et, i) => {
              const cls = i < exp.etapa_idx ? 'done' : i === exp.etapa_idx ? 'active' : 'pending'
              const styles = {
                done: { background: 'var(--green-bg)', color: 'var(--green-text)', border: '0.5px solid var(--green-border)' },
                active: { background: 'var(--text)', color: 'var(--bg)', border: '0.5px solid var(--text)' },
                pending: { background: 'var(--bg2)', color: 'var(--text2)', border: '0.5px solid var(--border)' },
              }[cls]
              return (
                <span key={i} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, ...styles }}>
                  {i}. {et.nombre}
                </span>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del expediente</div>
            {[
              ['Juzgado', exp.juzgado],
              ['Responsable', exp.responsable],
              ['Materia', matLabel],
              ['Presentación', fmtFecha(exp.presentacion)],
              ['Inicio de etapa', fmtFecha(exp.fecha_etapa)],
            ].map(([label, val]) => val ? (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ) : null)}
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencimiento</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: ['vencido','rojo','vence_hoy'].includes(est) ? 'var(--red-text)' : est === 'ambar' ? 'var(--amber-text)' : 'var(--green-text)', marginBottom: 4 }}>
              {fmtFecha(venc)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              {diasRest === null ? 'Sin plazo automático en esta etapa.' :
               diasRest < 0 ? `Vencido hace ${Math.abs(diasRest)} días hábiles.` :
               diasRest === 0 ? 'Vence hoy.' :
               `${diasRest} días hábiles restantes.`}
            </div>
            {exp.etapa_idx < 5 && (
              <button className="btn btn-primary" onClick={avanzarEtapa} disabled={!!saving} style={{ width: '100%', justifyContent: 'center' }}>
                {saving === 'avanzar' && <span className="spinner" style={{ borderTopColor: 'var(--bg)' }} />}
                Avanzar a etapa {exp.etapa_idx + 1} →
              </button>
            )}
            {exp.etapa_idx === 5 && (
              <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', padding: '8px 0' }}>
                Etapa final — pedido de sentencia
              </div>
            )}
          </div>
        </div>

        {exp.obs && (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observaciones</div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{exp.obs}</p>
          </div>
        )}

        {exp.historial?.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historial</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...exp.historial].reverse().map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtFecha(h.fecha)}</span>
                  <span style={{ color: 'var(--text2)' }}>Etapa {h.etapa}</span>
                  <span style={{ fontWeight: 500 }}>{ETAPAS[h.etapa]?.nombre}</span>
                  {h.nota && <span style={{ color: 'var(--text2)' }}>— {h.nota}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={archivar} disabled={!!saving}>
            {saving === 'archivar' && <span className="spinner" />}
            {exp.archivado ? 'Desarchivar' : 'Archivar expediente'}
          </button>
          <button className="btn btn-danger" onClick={eliminar} disabled={!!saving}>
            {saving === 'eliminar' && <span className="spinner" />}
            Eliminar expediente
          </button>
        </div>
      </div>
    </div>
  )
}
