import { formatLong, todayISO } from './dateUtils.js'

// Shared rendered-policy body — the cookie policy as it would appear on a real
// page (assignment §2.4). Used by both the PolicyPreview modal and the
// PolicyPreviewPage so the two renderings never drift.
// `sections` = ordered [{ sectionKey, heading, description }]; description is the
// editor's own Tiptap HTML, so injecting it keeps the same trust boundary.
const hasText = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0

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
