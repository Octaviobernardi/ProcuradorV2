// Feriados nacionales Argentina 2026
const FERIADOS = [
  '2026-01-01','2026-02-16','2026-02-17','2026-03-24',
  '2026-04-02','2026-04-03','2026-05-01','2026-05-25',
  '2026-06-17','2026-06-20','2026-07-09','2026-08-17',
  '2026-10-12','2026-11-20','2026-12-08','2026-12-25',
]

// Feria judicial Tucumán enero 2026 (Acordada 1212/25)
const FERIAS = [
  { desde: '2026-01-01', hasta: '2026-01-31' },
]

export function esDiaHabil(fecha) {
  const d = new Date(fecha + 'T12:00:00')
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return false
  if (FERIADOS.includes(fecha)) return false
  for (const f of FERIAS) {
    if (fecha >= f.desde && fecha <= f.hasta) return false
  }
  return true
}

export function sumarDiasHabiles(desde, dias) {
  if (!dias || dias <= 0) return null
  let f = new Date(desde + 'T12:00:00')
  let c = 0
  while (c < dias) {
    f.setDate(f.getDate() + 1)
    if (esDiaHabil(f.toISOString().split('T')[0])) c++
  }
  return f.toISOString().split('T')[0]
}

export function diasHabilesRestantes(hasta) {
  if (!hasta) return null
  const hoy = new Date().toISOString().split('T')[0]
  if (hoy === hasta) return 0
  let f = new Date(hoy + 'T12:00:00')
  const dir = hasta > hoy ? 1 : -1
  let c = 0
  while (f.toISOString().split('T')[0] !== hasta) {
    f.setDate(f.getDate() + dir)
    if (esDiaHabil(f.toISOString().split('T')[0])) c += dir
  }
  return c
}

export function fmtFecha(s) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}
