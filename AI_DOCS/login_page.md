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
- **Client-side validation** of both fields before submitting (email format + required;
  password required).
- A **Forgot password?** link that navigates to the existing forgot-password page.
- On **account lock**, show the proper lock message **with the time, taken from the backend**
  (never computed on the client).
- On **success**, redirect to `/home` (which fetches `/me`).
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

### Client-side validation (before the request)

- **Email:** required + valid email format → else inline "Email is required" / "Invalid email address".
- **Password:** required (non-empty) → else inline "Password is required".

> Decision: login does **not** re-enforce the full signup password policy (length/upper/
> special/etc.). Login only needs the field present; complexity is a signup concern, and
> enforcing it here could reject otherwise-valid credentials. (See Open Items.)

### Backend responses to handle (actual)

| Status | Message / shape (from backend) | Source | UI behavior |
|--------|--------------------------------|--------|-------------|
| `200` | `"login sucessfull"` | login controller | Cookies set → redirect to `/home` |
| `401` | `"invalid credential"` / `"Invalid credentials"` | controller (no user / wrong password) | Show message (generic auth error) |
| `401` | `"Account is locked. Try again after <N> seconds."` **or** `"Account is locked pls try again after<N>"` | controller (account lock) | **Show the backend message verbatim** — it already contains the remaining time |
| `401` | `"pls verify email"` | controller (unverified) | Show message |
| `429` | `"Too many login attempts."`, `errors: { retryAfter: <seconds> }` | loginMiddleware (IP rate limit) | Show message + the `retryAfter` seconds from the backend |
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
- [ ] Empty/invalid fields are caught client-side before any request.
- [ ] `200` → redirect to `/home`, which loads `/me`.
- [ ] Wrong credentials → backend message shown.
- [ ] Account locked → backend lock message **with its time** shown (not computed client-side).
- [ ] IP rate limit (`429`) → message + `retryAfter` seconds from the backend shown.
- [ ] Unverified email (`pls verify email`) → message shown.
- [ ] Signup page "Sign in" link points to `/login`.
- [ ] Visual style matches the existing pages.

### Open Items / Decisions

1. **Password validation extent:** required-only (recommended) vs. full signup policy. Plan
   assumes required-only.
2. **Forgot route:** using existing `/forgotPassword` (you wrote `/forget`). Confirm or rename.
3. **Unverified email:** just show the message now; optionally add a "resend verification"
   action later.
4. **Error UI:** banner vs. toast for auth/lock errors — plan leans banner for the lock case
   so the time is clearly visible.
