# Generate cookie policy (final step → Policy Preview page)

Satisfies assignment §2.4 (final generation + rendered-page preview) and §2.3
(100% completion end state). Full plan:
`../backend/cookiegenerator-plan/generate-cookie-policy.md`.

## What it is

On the **Cookie preferences** (last) wizard step, the primary button reads
**Generate cookie policy** instead of **Next** (earlier steps keep "Next").
Clicking it auto-saves the current section (+ the policy-level effective date,
same as "Next" would) and, on a clean save, navigates to a dedicated
**Policy Preview page** at `/cookie-policy/:websiteId/preview`.

The preview page renders the **saved** policy (re-fetched from the backend):

- **Sidebar:** "Cookie Policy" title; "Generating cookie policy for `<url>`"; an
  amber **Disclaimer** box; an **Edit cookie policy** button that navigates back
  to `/cookie-policy/:websiteId` (the wizard opens on **About cookies**, the
  first step); a static **100% complete** progress bar.
- **Main:** "Policy preview" heading; a **disabled** green **Add policy to site**
  button and a **disabled** 3-dots kebab beside it (future work — site embed);
  and the composed policy (title, effective/last-updated dates, each non-empty
  section's heading + rich-text HTML, footer).
- A green success **toast** appears on arrival and auto-dismisses (~4s).
- A **Back to Dashboard** button (top bar) → `/home`.

## Files

- `src/PolicyDocument.jsx` — **new** shared presentational component that renders
  the policy body (`.cp-preview-body`): title, `Effective date`/`Last updated`
  lines, each non-empty section's heading + description HTML (via
  `dangerouslySetInnerHTML` — user's own Tiptap output), footer. Props
  `{ url, sections, effectiveDate }`. Extracted so the preview **modal** and the
  preview **page** share one rendering.
- `src/PolicyPreview.jsx` — the existing modal, now delegating its body to
  `<PolicyDocument>` (no behaviour change).
- `src/PolicyPreviewPage.jsx` — **new** route component. Loads site `url` +
  policy `content` (parallel `GET /pulse/websites` + `GET …/cookie-policy`;
  401/403 → `/login`, 404 → banner), then renders the sidebar (disclaimer, edit,
  100% bar), main header (disabled Add-policy + kebab), language chips,
  `<PolicyDocument>`, and the success toast.
- `src/CookiePolicyPage.jsx` — last step renders `.cp-generate` ("Generate
  cookie policy") in place of `.cp-next`; `handleGenerate()` = `saveCurrent()`
  then `navigate('/cookie-policy/:websiteId/preview')`.
- `src/App.jsx` — route `/cookie-policy/:websiteId/preview` (before the wizard
  route).
- `src/signup.css` — `.cp-disclaimer`, `.cp-edit-btn`, `.cp-main-head`(+actions),
  `.cp-add-policy`, `.cp-kebab`, `.cp-preview-card`, `.cp-generate`. Reuses
  `.cp-side`/`.cp-progress*`/`.toast .toast-success`.

## Notes

- **Frontend-only** — no new endpoint, no backend/OpenAPI/smoke change. The page
  reads the same `content` jsonb via the existing GET.
- **100% is static** on this page — not derived from `completedSections` and no
  persisted `generated` flag; the wizard's own position-based bar (0/40/80) is
  unchanged.
- **Add policy to site / kebab are intentionally disabled/inert** — anchors for
  future work (site embed toward R2/R7; policy actions menu).
- Reached after a save via Generate, but tolerates a direct URL visit (loads from
  the backend; unfilled sections are simply skipped by `PolicyDocument`).
