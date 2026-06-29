# Forgot Password Page Feature Plan

## 1. Plan

### Objective

Add a "Forgot password?" page to the Pulse client that lets a user request a password
reset link by email. The page validates the email against the policy, then submits it to
the backend `POST /pulse/users/forgotPassword` endpoint, which sends the reset email.

### Goals

- Reachable from the **"Forgot your password?"** link on the signup page.
- Email is validated by the **backend** (`forgotPasswordEmail` validator → `422`); the page
  shows those errors inline (no client-side email check).
- Submit the email to `POST /pulse/users/forgotPassword`.
- Show a neutral "check your inbox" confirmation on success.
- Handle validation (`422`), other server errors, and network failures.
- Match the existing light Pulse design (shared header + signup styles).

---

## 2. Specification

### Feature Type

Client-side React page (Vite) served via `react-router-dom` at `/forgotPassword`.

### Endpoint

```
POST /pulse/users/forgotPassword
Content-Type: application/json
credentials: include
Body: { "email": "you@domain.com" }
```

### Request / Response

```json
// 200 (always — whether or not the email is registered)
{ "statuscode": 200, "data": {}, "message": "If the email exists, a reset link has been sent", "sucess": true }
```

### Backend Responses Handled

| Status | UI behavior |
|--------|-------------|
| 200 | Success card: "Check your inbox" + the entered email |
| 422 | Inline email error(s) from the backend validator |
| other | Toast with the message |
| (network) | Toast prompting to check the backend |

### Email validation — backend-driven (no client-side check)

Email is validated by the **backend** `forgotPasswordEmail()` validator
(`notEmpty().bail().isEmail()`). The page does **not** validate client-side; it submits and
shows the backend's `422` errors ("Email is required" / "Invalid email address") inline on the
email field. (Consistent with the login page.)

---

## 3. Design Notes

### Flow

```
Signup page ──"Forgot your password?"──► /forgotPassword
                                              │  enter email
                                              ▼
                              POST /pulse/users/forgotPassword  (via Vite proxy)
                                              │
                                              ▼
                  ┌─ 200 ──────► "Check your inbox" success card
                  ├─ 422 ──────► inline email error(s)
                  ├─ other ────► error toast
                  └─ throws ───► network error toast
```

### Aesthetic

Consistent with the signup page — no new visual language:

- Shared `Header.jsx` (blue header bar, white "Pulse" wordmark + badge).
- Reuses `signup.css` classes (`.page`, `.card`, `.field`, `.toast`, `.errlist`,
  `.alt-link`, `.success`).
- Light theme, single centered card, minimal motion (button spinner + toast slide-in).

### Security note

The backend returns the **same** message regardless of whether the email is registered
("If the email exists, a reset link has been sent"), so the UI shows an identical success
card either way and never reveals whether an account exists.

### Responsibilities Outside This Page

- Generating the reset token and sending the email (backend `forgotPassword` controller).
- The actual reset-password page (token in URL) — **not built yet**, to be done in a
  later step.

---

## 4. AI Prompts

These are the prompts I (the developer) gave to drive this feature, verbatim.

### Prompt 1 — Keep only the option, build it step by step

> ok just remove forgot password_md and remove reset password code and forgot password
> code i will do one by one now just keep the forgot password option in signup page i want
> to do it sequence by sequence now ownwards only do things i say dont do extra things and
> dont edit the backend without my permission

### Prompt 2 — Create the forgot password page

> now create the forgot password where it should check email policy and fetch thhe email to
> /verifyEmail/:token the design should be consistent with the front end

> Clarification: `/verifyEmail/:token` is the email-*verification* route (GET, token in URL).
> A forgot-password email form has to post to `POST /forgotPassword`, so the page was wired
> to that endpoint after confirming.

---

## 5. Supporting Documentation

### Files Created / Modified

| File | Purpose |
|------|---------|
| `frontend/src/ForgotPasswordPage.jsx` | Forgot-password form: email policy check + `POST /forgotPassword` |
| `frontend/src/App.jsx` | Added the `/forgotPassword` route |
| `frontend/src/SignupPage.jsx` | "Forgot your password?" link (added earlier) |
| `frontend/src/Header.jsx` | Shared Pulse header (reused) |
| `frontend/src/signup.css` | Reused styling (incl. `.alt-link`) |

### How to Run

```bash
# backend
cd backend && node src/app.js     # http://localhost:8000

# frontend
cd frontend && npm run dev         # http://localhost:5173 (proxies /pulse → :8000)
```

Then: from `/`, click **"Forgot your password?"** → `/forgotPassword` → enter an email →
**Send reset link**.

### Verification

- Empty email → backend `422` "Email is required" → shown inline.
- Malformed email → backend `422` "Invalid email address" → shown inline.
- Valid email → 200, "Check your inbox" card (neutral; no account-existence leak).
- Backend down → network error toast.

### Expected Benefits

- Familiar account-recovery entry point, consistent with the rest of the UI.
- Email validated by the backend validator; the page shows those errors (consistent with login).
- No leak of whether an email is registered.
