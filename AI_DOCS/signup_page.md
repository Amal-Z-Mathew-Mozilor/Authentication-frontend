# Signup Page Feature Plan

## 1. Plan

### Objective

Build a signup page for the Pulse client that connects to the backend
`POST /pulse/users/signup` endpoint and surfaces server-side validation errors
(email policy, password policy) as well as the "email already exists" conflict, so the
user always knows exactly why a signup attempt failed.

### Goals

- Collect `email` and `password` and submit them to the backend.
  *(The `username` field was later removed — see Prompt 5.)*
- Display **all** email policy errors returned by the validation middleware.
- Display **all** password policy errors returned by the validation middleware.
- Show the "email already exist" conflict as a **toast** notification (not inline).
- Show a clear success state once the account is created.
- Handle network / unexpected failures gracefully.
- Use a clean, **light** theme — simple single-column form, no heavy animation.

---

## 2. Specification

### Feature Type

Client-side React page (Vite) wired to the Express authentication backend, served under
a `react-router-dom` route at `/`.

### Endpoint

```
POST /pulse/users/signup
Content-Type: application/json
credentials: include          (auth uses httpOnly cookies)
```

### Request Body

```json
{ "email": "you@domain.com", "password": "Abcdefgh1!xx" }
```

> `username` was removed from the request body, the backend validator, the controller
> insert, and the DB schema (see Prompt 5). The form now collects only email + password.

### Backend Responses Handled

| Status | Meaning | UI behavior |
|--------|---------|-------------|
| 201 | Account created | Success card + "verify your email" message |
| 422 | Validation failed | Group `errors[]` by `path`, list every `msg` under its field |
| 400 | `email already exist` | **Toast** notification at top of screen |
| 500 / other | Server error | Toast with the message |
| (network) | Backend unreachable | Toast prompting to check the backend |

### Validation Error Shape (from middleware)

```json
{
  "success": false,
  "message": "Invalid credential",
  "errors": [
    { "type": "field", "msg": "Invalid email address", "path": "email", "location": "body" },
    { "type": "field", "msg": "Password must contain at least one number", "path": "password", "location": "body" }
  ]
}
```

The page groups `errors` by `path` (`email`, `password`) and renders each `msg` inline
beneath the matching input.

### Password Policy (mirrored client-side as a live checklist)

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No spaces

### Backend Validation Note — `.bail()`

The email/password validation chains use express-validator's `.bail()` immediately after
each `.notEmpty()` check. This stops the chain on the first failure, so an **empty** field
shows only `"… is required"` instead of also showing the format errors (e.g. an empty
email used to show both *"Email is required"* and *"Invalid email address"*).

---

## 3. Design Notes

### Data / Error Flow

```
User fills form (email + password)
      │
      ▼
POST /pulse/users/signup  (fetch, credentials: include, via Vite proxy)
      │
      ▼
Response
 ├─ 201 ───────────► success card ("you're all set / check your inbox")
 ├─ 422 ───────────► group errors[] by path → inline messages per field
 ├─ 400 (email) ───► "email already exist" toast (form stays intact)
 ├─ other ─────────► error toast (message)
 └─ fetch throws ──► network error toast
```

### Aesthetic (current — light & minimal)

The page was redesigned from the original dark "ember pulse" theme into a clean, light
layout:

- **Layout:** single centered card (`max-width: 400px`), with a top **header bar**.
- **Header:** blue background (`--accent`), white **"Pulse"** wordmark, and a white
  rounded badge containing a blue pulse/heartbeat SVG. The header is a shared component
  (`Header.jsx`) reused across all auth pages.
- **Color:** soft grey page background, white card, dark text, blue accent, green for
  the success/met states, red for errors — all via CSS variables.
- **Motion:** intentionally minimal. Removed the EKG/heartbeat animation, staggered
  page-load reveals, focus glows, and error shake. Only a button loading spinner and a
  gentle toast slide-in remain. Respects `prefers-reduced-motion`.

> The original distinctive dark theme was dropped per Prompt 3 ("light colours, drop the
> pulse animation, simpler page").

### The "email already exists" bug that was fixed

Previously a `400 email already exist` response was written into the email field's error
state, which (combined with the conditional render) made the email field appear to vanish
and only the other fields show. It now triggers a **toast** instead and leaves all fields
intact.

### Connectivity

A Vite dev-server proxy forwards `/pulse/*` to `http://localhost:8000`, keeping the
browser same-origin (no CORS) and letting the httpOnly auth cookies flow in dev.

### Responsibilities Outside This Page

- Field validation rules (owned by the backend `registerValidator` middleware).
- Account creation, hashing, token generation, email sending (backend).
- The page only collects input, calls the API, and renders the returned result/errors.

---

## 4. AI Prompts

These are the prompts I (the developer) gave to drive the implementation, in order.

### Prompt 1 — Feature request

> ok can you create a signup page for pulse/users/signup connect it to the backend and
> the front end shouls show all the email policy errors and password policy errors given
> by validation middleware also if email exist it should also show that error too

### Prompt 2 — Design direction (added to the frontend CLAUDE.md)

> You tend to converge toward generic, "on distribution" outputs. In frontend design,
> this creates what users call the "AI slop" aesthetic. Avoid this: make creative,
> distinctive frontends that surprise and delight. [...full aesthetics brief in CLAUDE.md]

### Prompt 3 — Simplify + light theme + toast (redesign)

> i seen the front end page i dont want this to be this much complicated big page it
> should be in light colours dont add that pulse animation and all also when there is
> already existing email it should show a pop message saying email already exist but now
> it works like bug whenevr email is there it removes the email field and show other 2

### Prompt 4 — Header + logo

> create a header section with logo pulse also
>
> (followed by) no make header section as blue a the label pulse as white

### Prompt 5 — Remove username

> i had changed my backend i removed username check my backend will be break somewhere
> also remove username field from signup front page

### Prompt 6 — Validation behavior (`.bail()`)

> first only show email is required [when the field is empty] ... yes add bail to password
> and username too

---

## 5. Supporting Documentation

### Files Created / Modified

| File | Purpose |
|------|---------|
| `frontend/src/SignupPage.jsx` | Signup form (email + password), submit/error logic, toast |
| `frontend/src/signup.css` | Light theme, header, toast, shared auth-page styling |
| `frontend/src/Header.jsx` | Shared Pulse header (blue bar, white wordmark + badge) |
| `frontend/src/App.jsx` | Router: `/` → SignupPage (plus forgot/reset routes) |
| `frontend/vite.config.js` | `/pulse` dev proxy to backend `:8000` |
| `backend/src/validators/user.validator.js` | Removed username block; added `.bail()` |
| `backend/src/controllers/auth.controller.js` | Removed `userName` from insert; `"there"` greeting |
| `backend/src/models/userschema.js` | No `userName` column |

### Success Response Shape

```json
{ "statuscode": 201, "data": {}, "message": "Account created successfully. Please verify your email.", "sucess": true }
```

> Note: the backend spells the success flag `sucess`. The client reads the `message`
> field and treats any 2xx as success, so this typo does not affect the page.

### How to Run

```bash
# backend
cd backend && node src/app.js     # http://localhost:8000

# frontend
cd frontend && npm run dev         # http://localhost:5173 (proxies /pulse → :8000)
```

### Verification

- Empty fields → **422**, only "… is required" per field (thanks to `.bail()`).
- Invalid body → **422**, email + password policy messages shown per field.
- Existing email → **400**, "email already exist" toast; form stays intact.
- Valid input → **201**, success card; verification email sent.
- Backend down → network error toast.

### Expected Benefits

- Users see precise feedback on why signup failed, without confusing duplicate messages.
- Validation logic stays centralized in the backend; the UI only renders it.
- Clean, light, low-distraction design that's quick to scan.
