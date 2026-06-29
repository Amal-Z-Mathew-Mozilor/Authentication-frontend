# Reset Password Page Feature Plan

> Plan written **before** implementation. No code is written until this document is approved.

## 1. Plan

### Objective

Add the page a user lands on from the password-reset email link. It has three fields —
**email, new password, confirm password** (in that order) — submits to the backend
`POST /pulse/users/resetPassword/:token`, and **shows the backend's result/errors correctly**
(passwords-don't-match, same-as-old-password, email mismatch, token problems, validation, and
success).

### Goals

- Frontend route `/resetPassword/:token` (token read from the URL).
- Fields in order: **email → new password → confirm password**.
- Submit `{ email, newPassword, confirmPassword }` to `POST /pulse/users/resetPassword/:token`.
- **No client-side validation** — the page submits as-is; the backend is the source of truth
  for **all** errors (empty fields, password policy, match, same-as-old, email), and the page
  just displays them.
- Show "password cannot be same as old password", email-mismatch, token, and validation errors
  exactly as returned by the backend.
- On success, show a confirmation and a way back to login.

### Scope

In scope:
- The reset page, its route, submit logic, and faithful display of backend responses.

Out of scope:
- Any backend changes (the endpoint already exists).
- Setting `FORGOT_PASSWORD_REDIRECT_URL` (env/backend — see Open Items).

---

## 2. Specification

### Route & endpoint

```
Frontend route : /resetPassword/:token
Endpoint       : POST /pulse/users/resetPassword/:token
Body           : { email, newPassword, confirmPassword }
Fetch          : credentials: 'include'
Pipeline       : resetPasswordValidator() → validation → tokenValidation → resetPassword
```

The reset link comes from the forgot-password email:
`${FORGOT_PASSWORD_REDIRECT_URL}/<token>`. For it to land here, that env var must point at the
frontend reset path (see Open Items).

### Fields (order)

1. **Email** (`email`)
2. **New password** (`newPassword`)
3. **Confirm password** (`confirmPassword`)

### Validation — backend only (no client-side validation)

The page does **not** validate anything client-side. It submits the fields as-is and
**displays whatever the backend returns**:

- `resetPasswordValidator` now validates **all three** fields:
  - `email` → `"Email is required"` / `"Invalid email address"` (plus `normalizeEmail`).
  - `newPassword` / `confirmPassword` → empty or password-policy violations.
  These come back as `422` errors per field (`path` = `email` / `newPassword` / `confirmPassword`),
  shown inline under each field.
- Passwords-don't-match, same-as-old-password, and the email-vs-account check happen in the
  controller → `400` messages, shown as returned.

### Backend responses to handle (actual)

| Status | Message / shape | Source | UI behavior |
|--------|-----------------|--------|-------------|
| `200` | `"password updated sucessfully"` | controller | Success card + link to `/login` |
| `422` | `errors: [ { path: "email" \| "newPassword" \| "confirmPassword", msg } ]` | resetPasswordValidator | Inline error(s) under the matching field |
| `400` | `"Passwords doesn't match"` | controller (newPassword ≠ confirmPassword) | Show message (banner) |
| `400` | `"password cannot be same as old password"` | controller | Show message (banner) |
| `400` | `"invalid credential"` | controller (email ≠ account email) | Show message (banner) |
| `400` | `"user doesn't exist"` | controller | Show message (banner) |
| `403` | `"Invalid Token"` | tokenValidation | Banner — link is invalid |
| `401` | `"Token expired"` | tokenValidation | Banner — link expired |
| `401` | `"token already is used"` | tokenValidation | Banner — link already used |
| (network) | — | — | Banner / toast |

> The page renders the backend `message` verbatim for the general (400/401/403) cases, so the
> result always reflects exactly what the backend decided.

---

## 3. Design Notes

### Error display strategy

- **Field validation (`422`)** → inline beneath the matching field (`email` / `newPassword` /
  `confirmPassword`), grouped by `path`, like the signup page.
- **General errors (`400`/`401`/`403`)** → a **banner** above the form showing the backend
  `message` (covers passwords-don't-match, same-as-old, email mismatch, and token problems).
  *(Optional enhancement: map specific 400 messages to specific fields — e.g. match → confirm,
  same-as-old → new password, email mismatch → email. Default is a single banner. See Open Items.)*

### Consistency

- Reuse the shared `Header.jsx` and `signup.css` (`.field`, `.input-row`, `.errlist`,
  `.banner`, `.submit`, `.success`, `.alt-link`). Light theme, minimal motion.
- Optional: a show/hide toggle on the password fields (like signup). Decision below.

### Success

- On `200`, show a success card ("Password updated") with a **Back to login** link to `/login`.

---

## 4. AI Prompts

### Prompt 1 — Feature request (verbatim)

> now i want to create a reset password page where it has two fields new password and confirm
> password and if the both password doesnt match it show error from the backend ,if the password
> is same as old password it show that error also it has a email field (order of fields email new
> confirm ) the result from backend should correctly show in the frontend create a .md file

### Prompt 2 — Validation correction (verbatim)

> this is wrong we are validating email-validator for email and passwords so it will give any
> error if empty and all you just have to take the error from the backend and show error based
> on it

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Change |
|------|--------|
| `frontend/src/ResetPasswordPage.jsx` *(new)* | Email + new + confirm fields, submit, backend-error display |
| `frontend/src/App.jsx` | Add `/resetPassword/:token` route |

### Acceptance Criteria

- [ ] `/resetPassword/:token` renders email, new password, confirm password (in that order).
- [ ] Submits `{ email, newPassword, confirmPassword }` to `/pulse/users/resetPassword/:token`.
- [ ] Passwords don't match → shows the backend's "Passwords doesn't match" message.
- [ ] New password same as old → shows "password cannot be same as old password".
- [ ] Email not matching the account → shows "invalid credential".
- [ ] Validation (`422`) errors shown inline under the right field.
- [ ] Invalid/expired/used token → shows the backend message.
- [ ] Success → confirmation + Back to login.

### Open Items / Decisions

1. **`FORGOT_PASSWORD_REDIRECT_URL` (env/backend):** currently **not set**, so the reset email
   link won't reach this page. It must be set to the frontend reset path, e.g.
   `http://localhost:5173/resetPassword` (the controller appends `/<token>`). This is a backend
   `.env` change — needs your go-ahead.
2. **Error placement:** single banner for general 400s (default) vs. mapping each message to its
   field. Default assumed.
3. **Client validation:** none — all errors (empty, policy, match, same-as-old, email) come
   from the backend and are displayed. Email is now validated by `resetPasswordValidator`
   (`422` "Email is required" / "Invalid email address"); a *wrong but valid* email still
   surfaces as the controller's `400 "invalid credential"`.
4. **Show/hide password toggle:** include like signup? (Assumed yes, minor.)
5. **Route name:** `/resetPassword/:token` (matches the backend endpoint path).
