import { useEffect, useRef, useState } from 'react'
import {
  MONTHS,
  WEEKDAYS,
  toISO,
  todayISO,
  parseISO,
  formatLong,
} from '../lib/dateUtils.js'

// Custom calendar date-picker (no UI library). Value in/out is ISO "YYYY-MM-DD".

/**
 * Custom calendar date-picker (no UI library) with month navigation and a 6-week grid.
 * Value in/out is an ISO "YYYY-MM-DD" string; dismisses on outside click / Escape.
 * @param {object} props
 * @param {string} [props.value] - Currently selected date as ISO "YYYY-MM-DD" ('' = none).
 * @param {(iso: string) => void} props.onChange - Called with the picked date as ISO "YYYY-MM-DD".
 * @param {string} [props.placeholder] - Text shown when no date is selected.
 * @returns {JSX.Element}
 */
export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select a date',
}) {
  const [open, setOpen] = useState(false)
  // Which month the grid is showing (independent of the selected value).
  const initial = parseISO(value) || parseISO(todayISO())
  const [view, setView] = useState({ y: initial.y, m: initial.m })
  const rootRef = useRef(null)

  // Opening jumps the grid to the selected month (or today) — done here, not in an
  // effect, so there's no cascading-render setState-in-effect.
  const toggle = () => {
    setOpen((o) => {
      if (!o) {
        const p = parseISO(value) || parseISO(todayISO())
        setView({ y: p.y, m: p.m })
      }
      return !o
    })
  }

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = parseISO(value)
  const today = parseISO(todayISO())

  // Build a 6-week (42-cell) grid starting on the Sunday on/before the 1st.
  const firstDow = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const daysInPrev = new Date(view.y, view.m, 0).getDate()
  const cells = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDow + 1
    if (dayNum < 1) {
      cells.push({
        d: daysInPrev + dayNum,
        y: view.y,
        m: view.m - 1,
        out: true,
      })
    } else if (dayNum > daysInMonth) {
      cells.push({
        d: dayNum - daysInMonth,
        y: view.y,
        m: view.m + 1,
        out: true,
      })
    } else {
      cells.push({ d: dayNum, y: view.y, m: view.m, out: false })
    }
  }

  const shift = (delta) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }
  const pick = (c) => {
    // Normalise the month/year for out-of-month cells via a real Date.
    const d = new Date(c.y, c.m, c.d)
    onChange(toISO(d.getFullYear(), d.getMonth(), d.getDate()))
    setOpen(false)
  }
  const sameDay = (c, p) =>
    p && !c.out && c.y === p.y && c.m === p.m && c.d === p.d

  return (
    <div className="cp-datepicker" ref={rootRef}>
      <button
        type="button"
        className="cp-date-input"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? '' : 'cp-date-placeholder'}>
          {value ? formatLong(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="cp-cal" role="dialog" aria-label="Choose date">
          <div className="cp-cal-head">
            <button
              type="button"
              className="cp-cal-nav"
              onClick={() => shift(-1)}
              aria-label="Previous month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="cp-cal-title">
              {MONTHS[view.m]} {view.y}
            </span>
            <button
              type="button"
              className="cp-cal-nav"
              onClick={() => shift(1)}
              aria-label="Next month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="cp-cal-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="cp-cal-grid">
            {cells.map((c, i) => (
              <button
                key={i}
                type="button"
                className={`cp-cal-day${c.out ? ' out' : ''}${
                  sameDay(c, selected) ? ' selected' : ''
                }${sameDay(c, today) ? ' today' : ''}`}
                onClick={() => pick(c)}
              >
                {c.d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
