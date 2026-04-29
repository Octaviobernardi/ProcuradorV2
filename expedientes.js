import { sumarDiasHabiles, diasHabilesRestantes } from './fechas'

export const ETAPAS = [
  { nombre: 'Presentación inicial', plazo: 0, info: 'Sin plazo automático. Se avanza manualmente.' },
  { nombre: 'Primer decreto', plazo: 0, info: 'Sin plazo automático. Se avanza cuando llega el decreto.' },
  { nombre: 'Notificación', plazo: 14, info: '14 días hábiles judiciales desde la fecha de decreto.' },
  { nombre: 'Diligenciamiento', plazo: 0, info: 'Sin plazo automático. Se avanza al completar.' },
  { nombre: 'Presentación de prueba', plazo: 28, info: '28 días hábiles judiciales para presentar prueba.' },
  { nombre: 'Pedido de sentencia', plazo: 0, info: 'Última etapa. El flujo finaliza aquí.' },
]

export function calcularVencimiento(exp) {
  if (exp.fecha_vencimiento_manual) return exp.fecha_vencimiento_manual
  const plazo = ETAPAS[exp.etapa_idx]?.plazo || 0
  const base = exp.plazo_base || exp.ult_mov || exp.fecha_etapa || exp.presentacion
  if (!plazo || !base) return null
  return sumarDiasHabiles(base, plazo)
}

export function getEstado(exp) {
  if (exp.archivado) return 'archivado'
  const v = calcularVencimiento(exp)
  if (!v) return 'sin_plazo'
  const hoy = new Date().toISOString().split('T')[0]
  if (v < hoy) return 'vencido'
  if (v === hoy) return 'vence_hoy'
  const d = diasHabilesRestantes(v)
  if (d <= 5) return 'rojo'
  if (d <= 15) return 'ambar'
  return 'ok'
}

export const ESTADO_LABELS = {
  vencido: 'Vencido',
  vence_hoy: 'Vence hoy',
  rojo: 'Urgente',
  ambar: 'Próximo',
  ok: 'Al día',
  sin_plazo: 'Sin plazo',
  archivado: 'Archivado',
}

export const ESTADO_ORDER = {
  vencido: 1, vence_hoy: 2, rojo: 3, ambar: 4, ok: 5, sin_plazo: 6, archivado: 7,
}

export const MATERIAS = [
  { value: 'civil', label: 'Civil / Comercial' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'penal', label: 'Penal' },
  { value: 'contencioso', label: 'Contencioso-administrativo' },
  { value: 'otro', label: 'Otro' },
]
