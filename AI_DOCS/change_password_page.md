# Change Password Page Feature Plan (Frontend)

> Plan written **before** implementation. No code is written until approved.
> Frontend-only — the backend `POST /pulse/users/changePassword` already exists.

## 1. Plan

### Objective

Let a **logged-in** user change their password from a Change Password page (reached from the
Home page's Account menu). The page submits to the backend and **shows whatever the backend
returns** — validator (`422`) errors inline, controller (`400`) errors, and the success message.

### Goals

- A Change Password form (old / new / confirm) reachable from Account → **Change password**.
- **No client-side validation** — the backend validator decides; the page just displays results
  (consistent with login/reset).
- Show `422` field errors inline; show `400` messages; show the success message on `200`.
- Requires auth (`accessToken` cookie); not-authenticated → redirect to `/login`.

### Scope

In scope: the page, its route, wiring the Account menu item, and faithful display of backend
responses. Out of scope: any backend change (endpoint already exists).

---

## 2. Specification

### Route & endpoint
```
Frontend route : /change-password   (reached from Home → Account → Change password)
Endpoint       : POST /pulse/users/changePassword
Body           : { oldPassword, newPassword, confirmPassword }
Fetch          : credentials: 'include'   (needs the accessToken cookie)
Pipeline       : changePasswordValidator() → validation → jwtValidation → changePassword
```

### Fields (order)
1. **Old password** (`oldPassword`)
2. **New password** (`newPassword`)
3. **Confirm new password** (`confirmPassword`)

### Validation — backend only (no client-side validation)
All three fields are validated by `changePasswordValidator` (notEmpty + password policy). The
page submits as-is and displays whatever the backend returns.

### Backend responses to handle (actual)

| Status | Message / shape (from backend) | UI behavior |
|--------|--------------------------------|-------------|
| `200` | `"password reseted sucessfully"` | Success card / message (the backend's text; see note) |
| `422` | `errors: [ { path: "oldPassword" \| "newPassword" \| "confirmPassword", msg } ]` | Inline error(s) under the matching field |
| `400` | `"old password doesnt match"` | Show message (banner) |
| `400` | `"new and confirm password are wrong"` (new ≠ confirm) | Show message (banner) |
| `400` | `"new password must not be same as old one"` | Show message (banner) |
| `401`/`403` | `jwtValidation` (no/invalid/revoked token) | Treat as not-authenticated → redirect to `/login` |
| (network) | — | Banner / toast |

> The page renders the backend `message` for the `400`/success cases verbatim, so the result
> reflects exactly what the backend decided. (Note: the backend success text says
> "password **reseted** sucessfully" — we can show that as-is, or display a cleaner
> "Password changed successfully." See Open Items.)

---

## 3. Design Notes

### Consistency
- Reuse the shared `Header` (with the Account menu) and `signup.css` (`.field`, `.input-row`,
  `.errlist`, `.banner`, `.submit`, `.success`, `.alt-link`). Light theme.
- Optional show/hide toggle on the password fields (like signup/reset).

### Error presentation
- **Field validation (`422`)** → inline beneath the matching field (grouped by `path`).
- **Controller errors (`400`)** → a banner above the form (old-password-mismatch, new≠confirm,
  same-as-old).

### Entry point + auth
- Account menu **Change password** (currently a placeholder) navigates to `/change-password`.
- On `401`/`403` from the submit, treat as logged-out → `navigate('/login')` (same posture as
  `/home` → `/me`).

### Success
- On `200`, show a success state ("Password changed") with a link back to `/home`.

---

## 4. AI Prompts (verbatim)

> now create the plan file for chaange password front end which should show response given by the
> backend if the validators fail it should show that result coming from email validator and if the
> response is sucessful show the corresponding sucesful msg

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Change |
|------|--------|
| `frontend/src/ChangePasswordPage.jsx` *(new)* | Old/new/confirm form, submit, backend-result display |
| `frontend/src/App.jsx` | Add `/change-password` route |
| `frontend/src/Header.jsx` | Wire Account → **Change password** to navigate to `/change-password` |

### Acceptance Criteria

- [ ] `/change-password` renders old / new / confirm (in that order).
- [ ] Submits `{ oldPassword, newPassword, confirmPassword }` to `/pulse/users/changePassword`.
- [ ] `422` validator errors shown inline under the right field.
- [ ] Old-password mismatch / new≠confirm / same-as-old (`400`) shown as the backend message.
- [ ] `200` shows the success message.
- [ ] Not-authenticated (`401`/`403`) redirects to `/login`.
- [ ] Reachable from Home → Account → Change password.

### Open Items / Decisions

1. **Route name:** `/change-password` (proposed) vs. `/changePassword`.
2. **Success text:** show the backend's `"password reseted sucessfully"` verbatim, or a cleaner
   "Password changed successfully." (frontend-only cosmetic).
3. **Error placement:** `422` inline + `400` banner (assumed) vs. mapping specific `400`s to fields.
4. **Show/hide password toggle:** include like signup (assumed yes).
