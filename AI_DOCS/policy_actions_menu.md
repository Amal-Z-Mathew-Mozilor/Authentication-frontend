# Policy actions menu (3-dots → Edit / Delete policy)

Activates the 3-dots (kebab) button on the Policy Preview page
(`/cookie-policy/:websiteId/preview`) — previously a disabled placeholder. Full
plan: `../backend/cookiegenerator-plan/policy-actions-menu.md`.

## What it is

Clicking the kebab opens a small dropdown with two actions:

- **Edit policy** → `navigate('/cookie-policy/:websiteId')` (the 3-step wizard,
  About step) — same target as the sidebar "Edit cookie policy" button.
- **Delete policy** (red) → opens a confirmation modal.

**Delete flow:**
1. Confirm modal — "Are you sure you want to delete this policy?" + "This will
   permanently remove your cookie policy from `<url>`. This action cannot be
   undone. If you're planning to create a new policy later, make sure to replace
   the embed code on your site." Buttons: **Cancel** / red **Delete cookie
   policy**.
2. On confirm → `DELETE /pulse/websites/:websiteId/cookie-policy`.
3. Success modal — "Your cookie policy is deleted" + "The cookie policy for
   `<url>` has been deleted. You can start over and create a new policy at any
   time." Buttons: **Back to Dashboard** (→ `/home`) / **Create new cookie
   policy** (→ `/cookie-policy/:websiteId`, the wizard on the default template).

The menu closes on outside-click / Esc / item select. The success modal is
terminal (no backdrop/Esc dismiss). "Add policy to site" stays disabled.

## Delete = reset (not a data delete)

`DELETE …/cookie-policy` **resets** the policy `content` to the default seed
(`defaultCookieContent(today)` — the same state a freshly created website's
policy has) and sweeps all of this policy's images. It does **not** remove the
row: `cookie_policy` is 1:1 with a website, seeded at website create with no
independent create path, so a reset keeps the invariant and makes "Create new
cookie policy" reopen the wizard on the default template. (Deleting the website
itself still hard-removes the row via the FK cascade.) User-confirmed decision —
see the plan changelog.

## Files

- `src/PolicyPreviewPage.jsx` — `menuOpen` / `dialog` (`'confirm'|'deleted'`) /
  `deleting` state; outside-click + Esc menu-close effect; `handleDelete()`
  (DELETE via `apiFetch`, 401/403 → `/login`, error → banner); enabled kebab +
  `.cp-menu` dropdown; confirm + success dialogs rendered at page root.
- `src/signup.css` — `.cp-kebab-wrap`, `.cp-menu`, `.cp-menu-item`(+`.danger`),
  `.cp-dialog`(+`h2`/`p`/`-actions`), `.cp-btn-danger`; reuses `.cp-modal-overlay`,
  `.cp-btn`, `.submit`.
- `backend/src/controllers/cookiePolicy.controller.js` — `deleteCookiePolicy`
  (reset to default seed + `sweepOrphanImages(policyId, new Set())`).
- `backend/src/routes/website.routes.js` — `DELETE /:websiteId/cookie-policy`.
- `backend/scripts/smoke.js` — asserts DELETE → 200, re-GET shows defaults +
  cleared `completedSections`, images swept, 404 for a non-owned website.
- `backend/openapi.yaml` — documents the DELETE (reset) operation.
