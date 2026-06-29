# Verify Email — Frontend-Agnostic Refactor (Frontend)

> Frontend side of the verify-email agnostic refactor. Backend side is documented in
> `backend/AI_DOCS/verify_email_agnostic.md`.

## 1. Plan

### Objective

The verification email link now points at a **frontend** `/verify/:token` page. That page calls
the backend verify endpoint via `fetch`, then routes based on the JSON result. The frontend owns
all routing; the backend stays agnostic.

### Flow (frontend's part)
```
Email "Verify" link (GET) → /verify/:token  (loads SPA; token in URL)
   → POST /pulse/users/verifyEmail/:token   (fetch, credentials: include)
   → JSON result → route:
        200 verified     → /home
        401 expired      → /verification-expired/:token
        401 used         → /already-verified
        403 invalid      → /verification-invalid
```

---

## 2. Specification

### New page `/verify/:token` (`VerifyEmailPage`)
- On mount, read `token` (`useParams`) and `POST /pulse/users/verifyEmail/${token}`
  with `credentials: 'include'`.
- Show a "Verifying…" state while in flight.
- Route by response:
  - `200` → `navigate('/home')`.
  - `401` + `/expired/i` → `navigate('/verification-expired/' + token)`.
  - `401` + `/used/i` → `navigate('/already-verified')`.
  - `403` (Invalid Token) → `navigate('/verification-invalid')`.
  - network/other → error state (toast / message).

### `SignupPage`
- Send `verifyBase: \`${window.location.origin}/verify\`` in the signup request body so the
  backend can build (and allow-list) the verification link.

### `VerificationExpiredPage` (email-verification expired page)
- Its Resend button (`POST /resend/:token`) must also send
  `verifyBase: \`${window.location.origin}/verify\`` (the backend `resendVerification` now builds
  the frontend link).

### Routes (`App.jsx`)
- Add `/verify/:token` → `VerifyEmailPage`.
- Existing result pages are reused as navigation targets:
  `/home`, `/verification-expired/:token`, `/already-verified`, `/verification-invalid`.

---

## 3. Design Notes

- **Backend returns JSON → frontend navigates.** The email click is a plain GET to the frontend
  (token in the URL, no body); the `/verify` page does the POST.
- **Cookies:** the verify POST uses `credentials: 'include'`, so the auth cookies set by the
  backend on success are stored; `/home` then loads `/me` as usual.
- Reuses the shared `Header` and `signup.css`; consistent with the other status pages.

---

## 4. AI Prompts (verbatim)

> can we put the verify mail as a post and pass the url through body
> ... so i just add verify email(front end ) in the send email?
> ... create the .md file for verify email agnostic refactor
> ... now split the .md file for backend and frontend folder and implement

---

## 5. Supporting Documentation

### Frontend files to be Created / Modified

| File | Change |
|------|--------|
| `frontend/src/VerifyEmailPage.jsx` *(new)* | `/verify/:token` — POST verify, route by status |
| `frontend/src/App.jsx` | Add `/verify/:token` route |
| `frontend/src/SignupPage.jsx` | Send `verifyBase` in the signup body |
| `frontend/src/VerificationExpiredPage.jsx` | Resend sends `verifyBase` |

### Acceptance Criteria (frontend)

- [ ] Clicking the email link loads `/verify/:token` and shows a verifying state.
- [ ] On `200` → navigate to `/home` (logged in via the cookies from the POST).
- [ ] On expired/used/invalid → navigate to the matching existing page.
- [ ] `SignupPage` sends `verifyBase`; `VerificationExpiredPage` resend sends `verifyBase`.
