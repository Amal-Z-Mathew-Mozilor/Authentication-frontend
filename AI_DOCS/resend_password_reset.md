# Resend Password Reset — Frontend

> Frontend side of the password-reset resend feature. **Status: implemented.**
> Backend side is documented in `backend/AI_DOCS/resend_password_reset.md`.

## 1. Plan

### Objective

When a user opens an **expired** password-reset link and submits the reset form, the backend
returns a token error; the frontend then sends the user to a **"reset link expired"** page with a
**Resend reset link** button. The frontend owns all routing (the backend stays agnostic and just
returns JSON).

### Goals

- Detect the backend's expired/used-token response on the reset submit and **navigate** to a
  dedicated expired page (no backend redirect).
- A `/reset-expired/:token` page with a **Resend reset link** button that calls
  `POST /pulse/users/resetResend/:token`.
- Supply the reset base URL (`resetBase`) from the frontend on both the forgot and resend requests.

---

## 2. Specification

### Routes

| Route | Page |
|-------|------|
| `/resetPassword/:token` | `ResetPasswordPage` (form) |
| `/reset-expired/:token` | `ResetExpiredPage` (expired notice + Resend) |
| `/forgotPassword` | `ForgotPasswordPage` (request a reset link) |

### Behavior

**`ResetPasswordPage`** — after `POST /pulse/users/resetPassword/:token`:
```js
if (res.status === 401 && /(expired|used)/i.test(data.message || '')) {
  navigate(`/reset-expired/${token}`)   // client-side nav, no redirect
  return
}
```
- `401 "Token expired"` / `"token already is used"` → navigate to the expired page.
- `403 "Invalid Token"` and other errors → stay on the form, show banner.
- *(With the backend running `tokenValidation` first, the expired `401` arrives immediately on
  submit — no need to pass field validation first.)*

**`ResetExpiredPage`** (`/reset-expired/:token`):
- Shows "Reset link expired" + a **Resend reset link** button.
- Button → `POST /pulse/users/resetResend/${token}` with
  `body: { resetBase: \`${window.location.origin}/resetPassword\` }`.
- `200` → "A new password reset email has been sent."; errors → toast.

**`ForgotPasswordPage`**:
- Sends `{ email, resetBase: \`${window.location.origin}/resetPassword\` }` so the backend can
  build (and allow-list) the reset link.

### Flow
```
reset email link → /resetPassword/:token (form)
   submit → POST /resetPassword/:token
      ├─ 200            → "Password updated"
      ├─ 401 expired/used → navigate → /reset-expired/:token
      │       └─ Resend → POST /resetResend/:token (+ resetBase) → "A new password reset email has been sent."
      └─ 403 / 400s     → banner on the form
```

---

## 3. Design Notes

- **Backend returns JSON → frontend navigates** (client-side). No HTTP redirect (a `fetch` would
  swallow it anyway), so the backend never references a frontend route.
- Reuses the shared `Header` and `signup.css` (`.card`/`.success`, `.toast`, `.submit`, `.banner`,
  `.errlist`). Mirrors the verification-expired page.
- `resetBase` is derived from `window.location.origin` so the frontend controls its own URL; the
  backend validates it against its allowlist.

---

## 4. AI Prompts (verbatim)

### Prompt 1 — Reset link from frontend
> ok do as option2 get the url from the frontend

### Prompt 2 — Trigger / implement frontend
> now implement the frontend of the resend email for password reset which is triggered when a new
> error for token expiry that comes from passwordreset middleware

### Prompt 3 — Split docs
> ok i have a problem the frontend change and backend change was implemented in same .md ... can you
> split and generate one for backed and one for front end

---

## 5. Supporting Documentation

### Frontend files Created / Modified

| File | Change |
|------|--------|
| `frontend/src/ResetExpiredPage.jsx` *(new)* | Expired notice + Resend button (sends `resetBase`) |
| `frontend/src/App.jsx` | `/reset-expired/:token` route |
| `frontend/src/ResetPasswordPage.jsx` | Navigate to `/reset-expired/:token` on expired/used token |
| `frontend/src/ForgotPasswordPage.jsx` | Send `resetBase` in the request body |

### Acceptance Criteria (frontend)

- [x] Submitting an expired/used token → navigates to `/reset-expired/:token`.
- [x] `403 "Invalid Token"` and other errors stay on the form as a banner.
- [x] `/reset-expired/:token` Resend button calls `POST /resetResend/:token` with `resetBase`.
- [x] Success shows "A new password reset email has been sent."; errors show a toast.
- [x] `ForgotPasswordPage` sends `resetBase` from `window.location.origin`.
