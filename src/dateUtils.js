// Local-date helpers for the custom DatePicker. Value format is ISO "YYYY-MM-DD".
// All math is on local Y/M/D to avoid the new Date('YYYY-MM-DD')-is-UTC off-by-one
// that can render the previous day in negative-offset timezones.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad = (n) => String(n).padStart(2, '0')

export const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m is 0-indexed

export function todayISO() {
  const n = new Date()
  return toISO(n.getFullYear(), n.getMonth(), n.getDate())
}

// Parse "YYYY-MM-DD" into { y, m (0-indexed), d } without timezone interpretation.
export function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return null
  return { y: +m[1], m: +m[2] - 1, d: +m[3] }
}

export function formatLong(iso) {
  const p = parseISO(iso)
  if (!p) return ''
  return `${MONTHS[p.m]} ${pad(p.d)}, ${p.y}`
}
