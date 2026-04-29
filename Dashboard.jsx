import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcularVencimiento, getEstado, ETAPAS, ESTADO_LABELS, ESTADO_ORDER } from '../lib/expedientes'
import { fmtFecha, diasHabilesRestantes } from '../lib/fechas'

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center'
    }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchExpedientes() }, [])

  async function fetchExpedientes() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('expedientes')
      .select('*')
      .eq('archivado', false)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setExpedientes(data || [])
    setLoading(false)
  }

  const sorted = [...expedientes].sort((a, b) =>
    (ESTADO_ORDER[getEstado(a)] || 9) - (ESTADO_ORDER[getEstado(b)] || 9)
  )

  const cnt = k => expedientes.filter(e => getEstado(e) === k).length
  const criticos = expedientes.filter(e => ['vencido', 'vence_hoy', 'rojo'].includes(getEstado(e)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10 }}>
        <StatCard label="Total" value={expedientes.length} />
        <StatCard label="Vencidos" value={cnt('vencido')} color={cnt('vencido') > 0 ? 'var(--red-text)' : undefined} />
        <StatCard label="Urgentes" value={cnt('rojo')} color={cnt('rojo') > 0 ? 'var(--red-text)' : undefined} />
        <StatCard label="Próximos" value={cnt('ambar')} color={cnt('ambar') > 0 ? 'var(--amber-text)' : undefined} />
        <StatCard label="Al día" value={cnt('ok')} color="var(--green-text)" />
        <StatCard label="Sin plazo" value={cnt('sin_plazo')} />
      </div>

      {criticos.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', background: 'var(--red-bg)',
          border: '0.5px solid var(--red-border)', borderRadius: 'var(--radius)',
          fontSize: 13, color: 'var(--red-text)'
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red-text)', flexShrink: 0, display: 'inline-block' }} />
          {criticos.length} expediente{criticos.length > 1 ? 's' : ''} requiere{criticos.length > 1 ? 'n' : ''} atención inmediata.
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2rem', justifyContent: 'center', color: 'var(--text2)' }}>
          <span className="spinner" /> Cargando expedientes...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--red-text)', padding: '1rem' }}>Error: {error}</div>
      ) : expedientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text2)' }}>
          <p style={{ marginBottom: 12 }}>No hay juicios cargados todavía.</p>
          <button className="btn btn-primary" onClick={() => navigate('/nuevo')}>+ Cargar primer juicio</button>
        </div>
      ) : (
        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {['Expediente', 'Carátula', 'Juzgado', 'Etapa', 'Vencimiento', 'Estado', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(e => {
                  const est = getEstado(e)
                  const v = calcularVencimiento(e)
                  const d = v ? diasHabilesRestantes(v) : null
                  const dsStr = d !== null ? (d < 0 ? `${Math.abs(d)}d vencido` : `${d}d háb.`) : '—'
                  return (
                    <tr key={e.id} style={{ borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => navigate(`/juicio/${e.id}`)}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{e.nro}</td>
                      <td style={{ padding: '10px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.caratula}>{e.caratula}</td>
                      <td style={{ padding: '10px 14px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.juzgado || '—'}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{ETAPAS[e.etapa_idx]?.nombre || '—'}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div>{fmtFecha(v)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{dsStr}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={`badge badge-${est}`}>{ESTADO_LABELS[est]}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={ev => { ev.stopPropagation(); navigate(`/juicio/${e.id}`) }}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
