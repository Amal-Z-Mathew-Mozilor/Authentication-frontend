import { formatLong, todayISO } from '../lib/dateUtils.js'

// Shared rendered-policy body — the cookie policy as it would appear on a real
// page (assignment §2.4). Used by both the PolicyPreview modal and the
// PolicyPreviewPage so the two renderings never drift.
// `sections` = ordered [{ sectionKey, heading, description }]; description is the
// editor's own Tiptap HTML, so injecting it keeps the same trust boundary.
/**
 * Report whether an HTML string has any visible text once tags and &nbsp; are stripped.
 * @param {string} html - Rich-text HTML (e.g. a section's Tiptap description).
 * @returns {boolean} True if non-whitespace text remains.
 */
const hasText = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0

/**
 * Shared rendered cookie-policy body (title, dates, each non-empty section, site-url footer).
 * Injects each section's description HTML via dangerouslySetInnerHTML (the editor's own Tiptap output).
 * @param {object} props
 * @param {string} [props.url] - Site URL shown in the footer (falls back to "this website").
 * @param {Array<{ sectionKey: string, heading: string, description: string }>} props.sections - Ordered policy sections.
 * @param {string} [props.effectiveDate] - Effective date as ISO "YYYY-MM-DD" (defaults to today).
 * @param {string} [props.lastUpdated] - Last-edit timestamp (cookie_policy.updatedAt); sliced to a date, defaults to today.
 * @returns {JSX.Element}
 */
export default function PolicyDocument({
  url,
  sections,
  effectiveDate,
  lastUpdated,
}) {
  return (
    <div className="cp-preview-body">
      <h1>Cookie Policy</h1>
      <p className="cp-preview-date">
        Effective date: {formatLong(effectiveDate || todayISO())}
      </p>
      {/* Last updated = when the policy was last edited/generated (cookie_policy.updatedAt),
          not render time. Slice a full ISO timestamp to YYYY-MM-DD (formatLong needs a
          bare date). Fallback to today only if the timestamp is missing. */}
      <p className="cp-preview-date">
        Last updated:{' '}
        {formatLong((lastUpdated || '').slice(0, 10) || todayISO())}
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
  )
}
