# Policy preview (Preview cookie policy)

Satisfies assignment §2.4 — "at any point … the user can preview how the policy
will look, rendered as it would appear on a real page — not just a form dump."
Full plan: `../backend/cookiegenerator-plan/preview-cookie-policy.md`.

## What it is

A **Preview cookie policy** button pinned to the bottom of the Cookie Policy
sidebar (`/cookie-policy/:websiteId`). Clicking it opens a **Policy preview**
modal that renders the composed policy from the **live editor state** (unsaved
edits included):

1. `Cookie Policy` title
2. `Effective date: <long date>` (falls back to today if unset)
3. `Last updated: <today, long>` (view date, matching CookieYes)
4. Each section (About cookies → Use of cookies → Cookie preferences): heading +
   rich-text description HTML (bold/lists/links/images render as on a page).
   Sections with no heading AND no text content are skipped.
5. Muted footer: `Cookie Policy generated for <site url>`

Close via ✕ button, backdrop click, or Esc. Body scroll is locked while open.

## Files

- `src/PolicyPreview.jsx` — the modal. Props `{ url, sections, effectiveDate,
  onClose }`; `sections` is an ordered `[{ sectionKey, heading, description }]`.
  Renders description HTML via `dangerouslySetInnerHTML` — the only use in the
  codebase; safe here because it's the user's own Tiptap output, the same HTML
  the editor itself renders. Uses `formatLong`/`todayISO` from `dateUtils.js`.
- `src/CookiePolicyPage.jsx` — `showPreview` state; `.cp-preview-btn` after the
  sidebar `<nav>`; renders `<PolicyPreview>` (inline at page root, like the
  toast — no portal). Sections come from the `SECTIONS` array + `data` state.
- `src/signup.css` — `.cp-preview-btn`, `.cp-modal-overlay`, `.cp-modal`,
  `.cp-modal-head`, `.cp-modal-close`, `.cp-preview-body` / `.cp-preview-content`
  (typography mirrors `.rte-content .ProseMirror` so the preview matches the
  editor's rendering).

## Notes

- Frontend-only: all data is already in component state; **no new endpoint, no
  backend change**. Uploaded images (`/pulse/images/<uuid>`) render via the
  existing public GET route.
- The "Consent Preferences" button + browser help links appear in the preview
  because they are part of the seeded `cookiePreferences` section HTML
  (`backend/src/utils/defaultCookiePolicy.js`), not separate components.
