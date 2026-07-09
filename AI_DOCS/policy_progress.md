# Cookie policy progress bar ("N% complete")

Satisfies assignment §2.3 Progress tracking (completion indicator; the other two
bullets — back/forth without data loss, draft + resume — were already met by the
wizard). Full plan: `../backend/cookiegenerator-plan/cookie-policy-progress-bar.md`.

## What it is

A progress block at the bottom of the Cookie Policy sidebar, below the
"Preview cookie policy" button: `N% complete` text + a rounded progress bar.

**Scale (by saved-section count, NOT content presence):**

| Sections saved | % |
|---|---|
| 0 | 0% |
| 1 | 40% |
| 2 or 3 | 80% |
| Generate (future feature) | 100% |

Content presence can't be used because all 3 sections are seeded with default
content at website creation — it would always read 100%.

## How it works

- **Backend** (`../backend/src/controllers/cookiePolicy.controller.js`
  `putSection`): a successful section PUT auto-adds the section key to
  `content.completedSections` (deduped array, server-derived — never read from
  the request body). Lives in the same `content` jsonb (no migration), so
  `GET …/cookie-policy` returns it and progress survives reload/resume.
- **Frontend** (`src/CookiePolicyPage.jsx`): `completed` state hydrated from
  `content.completedSections` on load and re-synced from each section PUT's
  response (the PUT returns the merged content). `pct` = 0/40/80 per the table;
  rendered as `.cp-progress` (label + `role="progressbar"` track/fill).
- **Styles** (`src/signup.css`): `.cp-progress-label`, `.cp-progress-track`
  (8px, `--border` grey), `.cp-progress-fill` (`--accent`, width transition).
  `.cp-preview-btn` keeps `margin-top:auto` — it heads the bottom-pinned stack
  (button, then progress).
- **Smoke** (`../backend/scripts/smoke.js`): fresh policy → no
  `completedSections`; after the 3 section PUTs + re-GET → all 3 keys present.

## Future hook

The "Generate cookie policy" feature should set a `generated` flag in `content`
and map it to 100%.
