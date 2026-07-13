// Local-date helpers for the custom DatePicker. Value format is ISO "YYYY-MM-DD".
// All math is on local Y/M/D to avoid the new Date('YYYY-MM-DD')-is-UTC off-by-one
// that can render the previous day in negative-offset timezones.

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * Left-pad a number to at least two digits with a leading zero.
 * @param {number} n - The value to pad.
 * @returns {string} The 2+ digit string, e.g. 5 -> "05".
 */
const pad = (n) => String(n).padStart(2, '0')

/**
 * Format a (year, 0-indexed month, day) as an ISO YYYY-MM-DD date string.
 * @param {number} y - Full year.
 * @param {number} m - Month, 0-indexed (0 = January).
 * @param {number} d - Day of month.
 * @returns {string} ISO date, e.g. "2026-07-13".
 */
export const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m is 0-indexed

/**
 * Today's local date as an ISO YYYY-MM-DD string.
 * @returns {string}
 */
export function todayISO() {
  const n = new Date()
  return toISO(n.getFullYear(), n.getMonth(), n.getDate())
}

// Parse "YYYY-MM-DD" into { y, m (0-indexed), d } without timezone interpretation.
/**
 * Parse an ISO "YYYY-MM-DD" string into local Y/M/D parts without timezone interpretation.
 * @param {string} iso - Date string; anything not matching YYYY-MM-DD yields null.
 * @returns {{ y: number, m: number, d: number } | null} Parts (m is 0-indexed), or null if malformed.
 */
export function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return null
  return { y: +m[1], m: +m[2] - 1, d: +m[3] }
}

/**
 * Format an ISO "YYYY-MM-DD" string as a long human date, e.g. "July 13, 2026".
 * @param {string} iso - Date string; returns '' if not a valid YYYY-MM-DD.
 * @returns {string} The formatted date, or '' when the input is malformed.
 */
export function formatLong(iso) {
  const p = parseISO(iso)
  if (!p) return ''
  return `${MONTHS[p.m]} ${pad(p.d)}, ${p.y}`
}
