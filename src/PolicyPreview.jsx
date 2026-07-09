import { useEffect } from 'react'
import { formatLong, todayISO } from './dateUtils.js'
import './signup.css'

// "Policy preview" modal — renders the cookie policy as it would appear on a real
// page (assignment §2.4), from the LIVE editor state (unsaved edits included).
// `sections` = ordered [{ sectionKey, heading, description }]; description is the
// editor's own Tiptap HTML, so injecting it keeps the same trust boundary.
export default function PolicyPreview({ url, sections, effectiveDate, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock the page behind the overlay while the modal is open.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const hasText = (html) =>
    (html || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim().length > 0

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <div
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Policy preview"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cp-modal-head">
          <h2>Policy preview</h2>
          <button
            type="button"
            className="cp-modal-close"
            aria-label="Close preview"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="cp-preview-body">
          <h1>Cookie Policy</h1>
          <p className="cp-preview-date">
            Effective date: {formatLong(effectiveDate || todayISO())}
          </p>
          <p className="cp-preview-date">
            Last updated: {formatLong(todayISO())}
          </p>
          {sections.map((s) =>
            !s.heading.trim() && !hasText(s.description) ? null : (
              <section key={s.sectionKey}>
                {s.heading.trim() && <h2>{s.heading}</h2>}
                <div
                  className="cp-preview-content"
                  dangerouslySetInnerHTML={{ __html: s.description }}
                />
              </section>
            ),
          )}
          <p className="cp-preview-footer">
            Cookie Policy generated for <span>{url || 'this website'}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
