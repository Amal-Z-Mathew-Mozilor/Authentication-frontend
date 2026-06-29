# Login Page Feature Plan

> Plan written **before** implementation. No code is written until this document is approved.

## 1. Plan

### Objective

Build a frontend `/login` page that authenticates a user against `POST /pulse/users/login`,
shows clear feedback for every backend outcome (bad credentials, account locked, IP rate
limit, unverified email, validation), and on success sends the user to `/home` (which loads
the user via `/me`). Also fix the currently-broken "Sign in" link on the signup page.

### Goals

- Frontend route `/login` with an email + password form.
- **Email validated by the backend** (no client-side email check) — show the backend's `422`
  email errors inline. A minimal client-side **password-required** guard remains (the login
  route has no password validator).
- A **Forgot password?** link that navigates to the existing forgot-password page.
- On **account lock**, show the proper lock message **with the time, taken from the backend**
  (never computed on the client).
- On **success**, redirect to `/home` (which fetches `/me`).
- On **unverified email** (`401 "pls verify email"`), **redirect to the Verification
  Notification page** (`/verification-required`) instead of showing a banner — matching the
  login flowchart's "Go to Verification Notification page" branch. See
  `verification_notice_page.md`.
- Replace the broken `<a href="/pulse/users/login">Sign in</a>` in `SignupPage` with a real
  link to `/login`.

### Scope

In scope:
- `LoginPage` UI + submit logic + error handling.
- Route in `App.jsx`; fix the signup "Sign in" link.

Out of scope:
- Any backend changes (the login endpoint, lock logic, and rate limiting already exist).
- A "resend verification" shortcut from the unverified-email error (can be added later).

---

## 2. Specification

### Route & endpoint

```
Frontend route : /login
Endpoint       : POST /pulse/users/login
Body           : { email, password }
Fetch          : credentials: 'include'   (sets accessToken/refreshToken httpOnly cookies)
Pipeline       : loginMiddleware → login controller
```

### Validation

- **Email — backend-driven (no client-side check).** `loginMiddleware` runs
  `loginEmailValidator`, so an empty/invalid email comes back as `422` ("Email is required" /
  "Invalid email address"). The page shows those errors inline on the email field — consistent
  with Signup and Forgot Password.
- **Password — minimal client-side `required` guard only.** The login route has **no password
  validator**, so without this guard an empty password would reach the controller and be counted
  as a failed login attempt (toward the lockout). Full password policy is **not** enforced on
  login. (To make password fully backend-driven, add a `notEmpty` password validator to the
  login route — backend change, not done.)

### Backend responses to handle (actual)

| Status | Message / shape (from backend) | Source | UI behavior |
|--------|--------------------------------|--------|-------------|
| `200` | `"login sucessfull"` | login controller | Cookies set → redirect to `/home` |
| `401` | `"invalid credential"` / `"Invalid credentials"` | controller (no user / wrong password) | Show message (generic auth error) |
| `401` | `"Account is locked. Try again after <N> seconds."` **or** `"Account is locked pls try again after<N>"` | controller (account lock) | **Show the backend message verbatim** — it already contains the remaining time |
| `401` | `"pls verify email"` | controller (unverified) | **Redirect to `/verification-required`** (Verification Notification page) — not a banner |
| `429` | `"Too many login attempts."`, `errors: { retryAfter: <seconds> }` | loginMiddleware (IP rate limit) | Show message + the `retryAfter` time, **converted from the backend's seconds to minutes** |
| `422` | `"Invalid credentials"`, `errors: [ { path:"email", msg } ]` | loginMiddleware (email validator) | Show the email error inline |

### Lock / timing — must come from the backend

There are **two** server-enforced limits, and in both cases the **time is computed on the
server**; the client only displays it:

1. **Account lock (per account, DB):** after 5 failed password attempts the account locks for
   15 minutes. The `401` message string already embeds the remaining seconds — the page shows
   that message as-is.
2. **IP rate limit (per IP, Redis):** after 5 attempts from an IP, `loginMiddleware` returns
   `429` with `errors.retryAfter` = seconds remaining (from the Redis TTL). The page shows the
   message and that `retryAfter` value.

> The client must **not** calculate or hard-code any lock duration — it always reflects what
> the backend returns.
>
> **Display unit:** the backend returns the wait time in **seconds**; the page converts it to
> **minutes** for display (e.g. `891s` → "15 minutes"). This applies to both the `429` retry
> time and the account-lock `401` message. The underlying value still comes only from the
> backend — the frontend only changes the unit shown.

---

## 3. Design Notes

### Consistency

- Reuse the shared `Header.jsx` (plain, no Account menu) and `signup.css`.
- Form styling mirrors `SignupPage` (`.field`, `.input-row`, `.errlist`, `.submit`, `.toast`,
  `.alt-link`). Light theme, minimal motion.

### Error presentation

- **Field validation** (email/password) → inline under the field, like signup.
- **Auth/limit errors** (invalid credentials, account locked, rate limit, verify email) →
  a prominent **banner/toast** showing the backend `message` (and `retryAfter` for `429`), so
  the lock message + time are clearly visible.

### Forgot password link

- Links to **`/forgotPassword`** — the existing forgot-password route.
  > Note: the request said "/forget"; the actual route built earlier is `/forgotPassword`.
  > Using `/forgotPassword` so the link works. (Confirm if you'd rather rename the route.)

### Unverified email → Verification Notification page

When login returns `401` with the unverified message (`"pls verify email"`), the page detects
it (e.g. `/verify/i.test(data.message)`) and `navigate()`s to **`/verification-required`**
instead of showing the banner. That page tells the user to verify their email and offers a
**Back to login** button. (Full spec in `verification_notice_page.md`.)

### Success → `/home`

- On `200`, the backend sets the auth cookies; the page calls `navigate('/home')`.
- `/home` then fetches `/me` (already implemented) to show "Welcome, <email>".

### Fix the signup "Sign in" link

- `SignupPage.jsx` currently has `<a href="/pulse/users/login">Sign in</a>` (points at the
  backend API — broken). Replace with a react-router `<Link to="/login">Sign in</Link>`.

---

## 4. AI Prompts

### Prompt 1 — Feature request (verbatim)

> create login .md file check the password and email validation and give a forgot password
> option which direct to /forget on when the account gets locked give the proper lock message
> with time which should be compulsorily fetched from the backend and should show it and on
> sucessful login it should map to the //home witch will fetch /me from the backend

### Prompt 2 — Verification redirect (verbatim)

> i think you show the verifcation page with a go back to login button also edit login.md file
> where you specifcity about this verification and also give .md file for this

### Prompt 3 — Backend-driven email validation (verbatim)

> i want login page and forgot password page to validate email based on the backend validator
> it should be consistent to login page and forgot i have now also update their .md file also

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Change |
|------|--------|
| `frontend/src/LoginPage.jsx` *(new)* | Login form, validation, submit, error/lock handling, redirect |
| `frontend/src/App.jsx` | Add `/login` route |
| `frontend/src/SignupPage.jsx` | Replace broken "Sign in" link with `<Link to="/login">` |

### Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/pulse/users/login` | Authenticate; sets auth cookies on success |
| (after redirect) GET | `/pulse/users/me` | Loaded by `/home` to show the user |

### Acceptance Criteria

- [ ] `/login` renders an email + password form with a Forgot password link and a link to sign up.
- [ ] Empty/invalid email is reported by the backend (`422`) and shown inline (no client check).
- [ ] Empty password is caught by the client-side required guard (avoids burning a lock attempt).
- [ ] `200` → redirect to `/home`, which loads `/me`.
- [ ] Wrong credentials → backend message shown.
- [ ] Account locked → backend lock message **with its time** shown (not computed client-side).
- [ ] IP rate limit (`429`) → message + `retryAfter` seconds from the backend shown.
- [ ] Unverified email (`pls verify email`) → redirect to `/verification-required` (notice page).
- [ ] Signup page "Sign in" link points to `/login`.
- [ ] Visual style matches the existing pages.

### Open Items / Decisions

1. **Password validation:** decided — email is backend-driven; password keeps a minimal
   client-side `required` guard only (login route has no password validator). Optionally add a
   `notEmpty` password validator to the backend login route to make it fully backend-driven.
2. **Forgot route:** using existing `/forgotPassword` (you wrote `/forget`). Confirm or rename.
3. **Unverified email:** redirect to the Verification Notification page
   (`/verification-required`) with a Back-to-login button (see `verification_notice_page.md`).
4. **Error UI:** banner vs. toast for auth/lock errors — plan leans banner for the lock case
   so the time is clearly visible.
