# Frontend — CLAUDE.md

Guidance for working in the `frontend/` folder. This is the React client for the Pulse
authentication backend (`../backend`, a separate repo).

## Stack

- **React 19** (function components + hooks only)
- **Vite 8** (dev server / bundler), **react-router-dom** for routing
- **Plain JavaScript / JSX** — no TypeScript
- **ESLint** (flat config in `eslint.config.js`), ES modules (`"type": "module"`)
- **Tiptap** (v3) for the rich-text Description editor (`RichTextDescription.jsx`); otherwise
- No component/UI library and no icon package — UI is built with plain elements + `signup.css`
  classes and inline SVGs.

## Commands

Run from `frontend/`:

```bash
npm run dev      # Vite dev server — pinned to http://localhost:5173 (strictPort)
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # ESLint
docker compose up   # run the dev server in a container (installs deps inside; serves :5173)
```

## Structure

```
frontend/src/
├── main.jsx                    # bootstrap (createRoot + <StrictMode>)
├── App.jsx                     # <BrowserRouter> + all <Route>s
├── apiFetch.js                 # fetch wrapper: token-rotation interceptor (see below)
├── Header.jsx                  # shared top bar (Pulse logo); optional "Web Manager" link + Account menu via <Header account />
├── WebManagerPage.jsx          # /web-manager — list/add/edit/delete websites (calls /pulse/websites); per-row "Cookie policy" button fetches the policy and routes to the preview page if content.generatedAt is set, else the wizard's first step (falls back to the wizard on error)
├── CookiePolicyPage.jsx        # /cookie-policy/:websiteId — section-aware editor (About cookies + Use of cookies + Cookie preferences; heading + rich-text description; effective-date picker on the preferences tab); Previous/Next wizard nav that auto-saves the current section then shows a green "Draft saved successfully!" toast; on the LAST step the primary button is "Generate cookie policy" (auto-saves with `generated: true` so the server stamps `content.generatedAt`, then navigates to the Policy Preview page) instead of Next; top "Back to Dashboard" button silently saves the current section (saveCurrent({silent})) then navigates to /home (blocks on invalid); "Preview cookie policy" button pinned to the sidebar bottom opens the PolicyPreview modal; below it a position-based progress bar ("N% complete": About 0% → Use 40% → Preferences 80%); viewport-capped layout (.cp-page) with a scrollable body (.cp-main-scroll) and pinned full-width action footer
├── PolicyPreviewPage.jsx       # /cookie-policy/:websiteId/preview — read-only Policy Preview page (final "Generate" step): loads SAVED content; sidebar = title + "Generating cookie policy for <url>" + amber Disclaimer + "Edit cookie policy" (→ /cookie-policy/:websiteId, About step) + static 100% progress; main = "Policy preview" header with an "Add policy to site" button (opens the "Add cookie policy to your site" method-picker modal — a single ACTIVE "HTML format" card that opens a two-step code view: fetches the self-contained snippet from `GET …/cookie-policy/html`, shows "Step 1: Copy this HTML code" + a read-only code box + a working "Copy code" button + a DISABLED "Send code to a teammate" button + "Step 2: Paste…"; Back returns to the picker, no language selector; ✕/backdrop/Esc close AND reset to the picker, locks body scroll) + an ACTIVE 3-dots kebab menu → "Edit policy" (→ wizard About step) / "Delete policy" (→ confirm modal → DELETE cookie-policy [reset] → "Your cookie policy is deleted" modal w/ Back to Dashboard [/home] + Create new cookie policy [→ wizard]); the composed policy (via PolicyDocument); a top-center green success toast shown ONLY when arriving from the wizard's "Generate cookie policy" button (via `location.state.justGenerated`, cleared on mount so refresh/back won't replay it) — NOT on a returning user's Web-Manager visit
├── PolicyDocument.jsx          # shared rendered-policy body (title, effective/last-updated dates, each non-empty section's heading + rich-text HTML, site-url footer) — used by BOTH PolicyPreview (modal) and PolicyPreviewPage; renders description HTML via dangerouslySetInnerHTML (user's own Tiptap output)
├── PolicyPreview.jsx           # "Policy preview" modal — wraps PolicyDocument to render the composed policy from LIVE editor state incl. unsaved edits; closes on ✕/backdrop/Esc, locks body scroll; frontend-only (no endpoint)
├── RichTextDescription.jsx     # reusable Tiptap rich-text editor (toolbar, links, png/jpg image upload) for Description fields
├── DatePicker.jsx              # custom calendar date-picker (no UI library) for the effective-date field; ISO in/out
├── dateUtils.js                # local-date helpers (toISO/todayISO/parseISO/formatLong) shared by DatePicker + CookiePolicyPage
├── LandingNav.jsx / Footer.jsx # landing-page chrome
├── LandingPage.jsx             # marketing landing ("/")
├── SignupPage.jsx  LoginPage.jsx  ForgotPasswordPage.jsx  ResetPasswordPage.jsx
├── ChangePasswordPage.jsx  HomePage.jsx  VerifyEmailPage.jsx
├── VerificationExpiredPage.jsx  VerificationInvalidPage.jsx  VerifiedAlreadyPage.jsx
│   VerificationRequiredPage.jsx  ResetExpiredPage.jsx
├── signup.css                  # THE design system (tokens + all shared classes)
└── landing.css                 # landing-page layout (uses signup.css tokens)
```

## Routes (`App.jsx`)

| Path | Page |
|------|------|
| `/` | LandingPage |
| `/signup` | SignupPage |
| `/login` | LoginPage |
| `/forgotPassword` | ForgotPasswordPage |
| `/resetPassword/:token` | ResetPasswordPage |
| `/reset-expired/:token` | ResetExpiredPage (resend reset link) |
| `/home` | HomePage (auth'd; Account menu) |
| `/verify/:token` | VerifyEmailPage (POSTs to backend, then routes by result) |
| `/change-password` | ChangePasswordPage |
| `/web-manager` | WebManagerPage (auth'd; list/add/edit/delete websites) |
| `/cookie-policy/:websiteId` | CookiePolicyPage (auth'd; section-aware editor — About cookies + Use of cookies + Cookie preferences w/ effective date) |
| `/cookie-policy/:websiteId/preview` | PolicyPreviewPage (auth'd; read-only Policy Preview — final "Generate cookie policy" step) |
| `/verification-expired/:token` · `/verification-invalid` · `/already-verified` · `/verification-required` | status pages |

## Conventions

- Function components + hooks only; files in `PascalCase.jsx`.
- **Validation is backend-driven.** Pages generally submit as-is and render the backend's
  errors (`422` field errors inline, other messages in a banner/toast) rather than replicating
  rules client-side. Exceptions: a client-side **password-required** guard on login (an empty
  password would burn a lockout attempt), and the signup password **policy checklist** (a live
  UX hint mirroring `PASSWORD_RULES`).
- Reuse `signup.css` classes (`.page`, `.card`, `.field`, `.input-row`, `.submit`, `.errlist`,
  `.banner`, `.toast`, `.success`, `.alt-link`, `.policy`) and the shared `<Header>` — don't
  invent parallel styles.

## Backend API integration

- **Base URL:** `/pulse/users` (relative — the Vite proxy forwards `/pulse` → the backend).
- **Auth = httpOnly cookies** (`accessToken`, `refreshToken`) set by the server — not
  localStorage, not a bearer header. **Every** request must send `credentials: 'include'`.
- **Email links point at the frontend.** Signup/resend/forgot send a **base URL** the backend
  uses to build the emailed link, and the backend validates it against an allowlist:
  - signup / `resend/:token` → `verifyBase: \`${window.location.origin}/verify\``
  - forgot / `resetResend/:token` → `resetBase: \`${window.location.origin}/resetPassword\``
  - (This is why the dev port is pinned to 5173 — it must match the backend allowlist.)

### Endpoints (see `../backend/openapi.yaml` for the full spec)

| Method | Path | Body |
|--------|------|------|
| POST | `/signup` | `{ email, password, verifyBase }` |
| POST | `/verifyEmail/:token` | — (called by `/verify` page; returns JSON, sets cookies) |
| POST | `/resend/:token` | `{ verifyBase }` |
| POST | `/login` | `{ email, password }` |
| POST | `/logout` | — (needs `accessToken`) |
| POST | `/rotateToken` | — (needs `refreshToken`) |
| POST | `/forgotPassword` | `{ email, resetBase }` |
| POST | `/resetPassword/:token/check` | — (read-only token pre-check; `200`=valid, `401`/`403` otherwise) |
| POST | `/resetPassword/:token` | `{ email, newPassword, confirmPassword }` |
| POST | `/resetResend/:token` | `{ resetBase }` |
| POST | `/changePassword` | `{ oldPassword, newPassword, confirmPassword }` (needs `accessToken`) |
| POST | `/me` | — (needs `accessToken`; `data` is the email string) |

**Websites** — base `/pulse/websites` (REST verbs; all need `accessToken`; `data` is user-scoped):

| Method | Path | Body |
|--------|------|------|
| GET | `/pulse/websites` | — (`data` = array of `{ id, name, url, createdAt }`) |
| POST | `/pulse/websites` | `{ name, url }` (`201` on success) |
| PUT | `/pulse/websites/:id` | `{ name, url }` (`404` if not owned) |
| DELETE | `/pulse/websites/:id` | — (`404` if not owned) |
| GET | `/pulse/websites/:id/cookie-policy` | — (`data.content` = `{ aboutCookies: {…}, useOfCookies: {…}, cookiePreferences: { heading, description }, effectiveDate, generatedAt? }`; `generatedAt` present once generated — WebManager reads it to route preview vs wizard) |
| GET | `/pulse/websites/:id/cookie-policy/html` | — (`data.html` = self-contained HTML snippet of the saved policy, images inlined as base64; the "HTML format" add-to-site export) |
| PUT | `/pulse/websites/:id/cookie-policy/:section` | `{ heading, description, usedImageIds? }` (`:section` = `aboutCookies`\|`useOfCookies`\|`cookiePreferences`; description = HTML; upserts, preserves siblings; `usedImageIds` = image ids live across all editors → orphan cleanup) |
| PUT | `/pulse/websites/:id/cookie-policy` | `{ effectiveDate, usedImageIds?, generated? }` (base path; ISO `YYYY-MM-DD`; upserts policy meta, preserves sections; `generated: true` = the "Generate cookie policy" action → server stamps `content.generatedAt`) |
| DELETE | `/pulse/websites/:id/cookie-policy` | — (base path; "delete" = **resets** content to the default seed + sweeps the policy's images; not a row removal) |
| POST | `/pulse/websites/:id/images` | multipart `file` (png/jpg) → `{ data: { url } }` |
| GET | `/pulse/images/:id` | — (public; returns the image binary) |

### Response shapes
- **Error:** `{ success: false, message, errors }`. `errors` is an array of `{ path, msg }` for
  `422`; for `429` it's `{ retryAfter: <seconds> }`.
- **Success:** `{ statuscode, data, message, sucess }` — note the flag is misspelled **`sucess`**.
  Read HTTP status + `message`, not that flag.

### Auth-flow patterns
- **Verify email:** the emailed link opens the frontend `/verify/:token`; that page `POST`s to
  `/verifyEmail/:token` and routes by result — `200`→`/home`, `401 expired`→`/verification-expired/:token`,
  `401 used`→`/already-verified`, `403`→`/verification-invalid`. (Backend returns JSON, never redirects.)
- **Reset password:** `ResetPasswordPage` validates the token **on mount** via
  `POST /resetPassword/:token/check` before rendering the form — `200`→show form, `401 expired/used`
  →`/reset-expired/:token` (with `state.reason`), `403`→inline "invalid link" state, network error
  →inline "couldn't verify" state. The submit still re-checks the token (defense-in-depth): on
  `401 expired/used` it navigates to `/reset-expired/:token` (Resend button → `/resetResend/:token`).
- **Login lockout:** account lock and IP limit come back as `401`/`429` with the wait time; the
  UI shows the backend's time (converted to minutes). `401 "pls verify email"` → `/verification-required`.

### Token rotation — `apiFetch.js`
Authenticated calls (`/me`, `/changePassword`, `/logout`) go through **`apiFetch`**, a `fetch`
wrapper that: on `401 "Token has expired"`, calls `POST /rotateToken` once (single-flight) and
retries the original request; if rotation fails it returns the `401` so the page redirects to
`/login`. Route new authenticated requests through `apiFetch`, not raw `fetch`.

### Password rules (backend `registerValidator`)
Min 12 chars, ≥1 uppercase, ≥1 lowercase, ≥1 number, ≥1 special char, no spaces. (There is **no**
username field — it was removed.)

## Dev proxy / Docker
`vite.config.js` pins `port: 5173, strictPort: true` and proxies `/pulse` → the backend
(`VITE_PROXY_TARGET`, default `http://localhost:8000`; set to `http://host.docker.internal:8000`
in `docker-compose.yml`). `credentials: 'include'` is still required for cookie auth.

## Design system (light theme — keep it consistent)

The app uses a **clean, light** theme defined by CSS variables in `signup.css` — reuse it; do
**not** introduce a different design system or dark theme for new pages.

- **Tokens** (`:root` in `signup.css`): `--bg #f4f6f8`, `--card #fff`, `--text #1f2733`,
  `--muted`, `--border`, `--accent #3b6ef0`, `--accent-soft`, `--error`, `--ok`.
- **Type:** system font stack. **Shape:** ~9–14px radii, soft shadows.
- **Motion:** subtle only (button spinners, small slide/lift). No animation overload.
- **No glassmorphism** (not part of this design).
- Reuse the shared `Header`, the `.card`/`.field`/`.submit`/`.toast`/`.banner` classes, and inline
  SVGs for icons. New pages should look like the existing ones.

## AI-assisted docs
Feature plans/specs live in `frontend/AI_DOCS/*.md` (one file per feature). When adding/changing
a feature, keep its doc in sync.
