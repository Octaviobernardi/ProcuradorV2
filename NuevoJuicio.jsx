import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ETAPAS, MATERIAS } from '../lib/expedientes'
import { sumarDiasHabiles, fmtFecha } from '../lib/fechas'

export default function NuevoJuicio() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nro: '', caratula: '', juzgado: '', responsable: '',
    materia: '', presentacion: '', etapa_idx: 0,
    fecha_etapa: '', obs: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const plazo = ETAPAS[form.etapa_idx]?.plazo || 0
  const vencCalc = (plazo && form.fecha_etapa)
    ? sumarDiasHabiles(form.fecha_etapa, plazo)
    : null

  async function guardar() {
    if (!form.nro.trim() || !form.caratula.trim() || !form.juzgado.trim()) {
      setError('Completá expediente, carátula y juzgado.')
      return
    }
    setError('')
    setSaving(true)
    const hoy = new Date().toISOString().split('T')[0]
    const fecha_etapa = form.fecha_etapa || hoy
    const payload = {
      nro: form.nro.trim(),
      caratula: form.caratula.trim(),
      juzgado: form.juzgado.trim(),
      etapa_idx: parseInt(form.etapa_idx),
      fecha_etapa,
      responsable: form.responsable.trim() || null,
      materia: form.materia || null,
      presentacion: form.presentacion || null,
      obs: form.obs.trim() || null,
      plazo_dias_habiles: plazo,
      plazo_base: fecha_etapa,
      archivado: false,
      notificar_email: true,
      notificar_whatsapp: true,
      historial: [{ etapa: parseInt(form.etapa_idx), fecha: fecha_etapa, nota: 'Carga inicial' }],
    }
    const { error: err } = await supabase.from('expedientes').insert(payload)
    setSaving(false)
    if (err) setError(err.message)
    else navigate('/')
  }

  const inp = (label, key, props = {}) => (
    <div className="form-group">
      <label>{label}</label>
      <input value={form[key]} onChange={e => set(key, e.target.value)} {...props} />
    </div>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => navigate('/')}>← Volver</button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Nuevo juicio</h1>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>{inp('Número de expediente *', 'nro', { placeholder: 'Ej: 123456/2024' })}</div>
          <div style={{ gridColumn: '1 / -1' }}>{inp('Carátula *', 'caratula', { placeholder: 'Ej: García Juan c/ López Pedro s/ Cobro de Pesos' })}</div>
          {inp('Juzgado *', 'juzgado', { placeholder: 'Ej: Juzgado Civil 5° Tucumán' })}
          {inp('Responsable', 'responsable', { placeholder: 'Ej: Lourdes' })}
          <div className="form-group">
            <label>Materia</label>
            <select value={form.materia} onChange={e => set('materia', e.target.value)}>
              <option value="">Seleccionar...</option>
              {MATERIAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {inp('Fecha de presentación', 'presentacion', { type: 'date' })}
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }} className="form-group">
            <label>Etapa actual</label>
            <select value={form.etapa_idx} onChange={e => set('etapa_idx', parseInt(e.target.value))}>
              {ETAPAS.map((et, i) => (
                <option key={i} value={i}>{i} — {et.nombre}{et.plazo ? ` (${et.plazo} días hábiles)` : ''}</option>
              ))}
            </select>
            <div className="form-hint">{ETAPAS[form.etapa_idx]?.info}</div>
          </div>

          {inp('Fecha inicio de etapa', 'fecha_etapa', { type: 'date' })}

          <div className="form-group">
            <label>Vencimiento calculado</label>
            <input
              readOnly
              value={vencCalc ? `${fmtFecha(vencCalc)} (${plazo} días hábiles)` : 'Sin plazo automático'}
              style={{ background: 'var(--bg2)', color: 'var(--text2)' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Notas del expediente..." />
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: 'var(--red-text)' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn" onClick={() => navigate('/')}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>
            {saving && <span className="spinner" style={{ borderTopColor: 'var(--bg)' }} />}
            {saving ? 'Guardando...' : 'Guardar juicio'}
          </button>
        </div>
      </div>
    </div>
  )
}
