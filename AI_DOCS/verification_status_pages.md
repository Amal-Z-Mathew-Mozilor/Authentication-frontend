# Email Verification Status Pages Feature Plan

> Plan written **before** implementation. No code is written until this document is approved.

## 1. Plan

### Objective

Build the frontend pages that the backend `verifyMail` controller redirects the browser to
when an email-verification link cannot complete successfully:

1. **Already verified** — the link's token was already used → show "Email already verified".
2. **Verification expired** — the token has expired → show "Verification link expired" with a
   **Resend** button that triggers a (later-implemented) `resend` action.
3. **Verification invalid** — no matching token → show "Invalid verification link".

Design must stay consistent with the existing Signup / Forgot Password / Home pages.

### Goals

- Frontend route `/already-verified` → a clear "Email already verified" status page.
- Frontend route `/verification-expired` → a "Link expired" status page with a **Resend** button.
- Frontend route `/verification-invalid` → an "Invalid verification link" status page.
- The Resend button maps to a `resend` handler (function to be implemented after this step).
- On a successful resend, show a success message: **"A new verification email has been sent."**
- Reuse the shared `Header` and `signup.css` styling.

### Scope

In scope (this step):
- The three status pages and their routes (`/already-verified`, `/verification-expired`,
  `/verification-invalid`).
- The Resend **button UI**, placed as-is, mapped to a placeholder `resend` handler hook.
- The resend **success message** UI ("A new verification email has been sent.") that the
  handler will show once the backend is wired.

Out of scope (later steps):
- The actual **resend** behavior and its backend endpoint (`resend` function / backend the
  user will design next). The button stays a placeholder until then.
- Any backend changes.

---

## 2. Specification

### Backend context (already implemented in `verifyMail`)

```js
if (!user)              → redirect `${FRONTEND_URL}/verification-invalid`
if (expiry < now)       → redirect `${FRONTEND_URL}/verification-expired`
if (isUsed)             → redirect `${FRONTEND_URL}/already-verified`
// success              → redirect `${FRONTEND_URL}/home`
```

> Important: these redirects currently carry **no token or email** in the URL. This affects
> how Resend can identify the user (see Open Questions).

### Routes to add (frontend, react-router)

| Route | Page | Purpose |
|-------|------|---------|
| `/already-verified` | `VerifiedAlreadyPage` | "Email already verified" status |
| `/verification-expired` | `VerificationExpiredPage` | "Link expired" status + Resend button |
| `/verification-invalid` | `VerificationInvalidPage` | "Invalid verification link" status |

### Behavior

**`/already-verified`**

| Element | Behavior |
|---------|----------|
| Message | "Email already verified" + short explanation |
| Action | Link to sign in / home (no API call) |

**`/verification-expired`**

| Element | Behavior |
|---------|----------|
| Message | "Verification link expired" + explanation |
| Resend button | Placed as-is; calls `resend` handler — **placeholder for now**, real behavior implemented in a later step |
| On successful resend | Show success message: **"A new verification email has been sent."** |
| States (once wired) | idle → sending → sent (success message) / error (toast) |

**`/verification-invalid`**

| Element | Behavior |
|---------|----------|
| Message | "Invalid verification link" + explanation (link not recognized) |
| Action | None — status message only (no links, no API call) |

---

## 3. Design Notes

### Consistency

- Reuse `Header.jsx` (plain `<Header />`, no Account menu — these are pre-auth pages).
- Reuse `signup.css` — specifically the `.card` / `.success` / `.title` / `.subtitle` /
  `.submit` / `.alt-link` / `.toast` classes. No new visual language.
- Light theme, single centered card, minimal motion (matches the other status/success cards).

### Layout sketch

```
/already-verified                    /verification-expired
┌───────────────────────┐           ┌───────────────────────┐
│        ✓ (or ℹ)        │           │        ⚠ / ⏱          │
│  Email already verified│           │ Verification link      │
│  You can sign in.      │           │ expired                │
│  [ Back to sign in ]   │           │ [ Resend link ]  ←btn  │
└───────────────────────┘           └───────────────────────┘
   (verification-invalid: status message only, no links)
```

### Resend handler (placeholder this step)

```jsx
function handleResend() {
  // TODO (later step): call the backend resend endpoint, e.g.
  // await fetch('/pulse/users/<resend-endpoint>', { method:'POST', credentials:'include', body: ... })
  // on success → show: "A new verification email has been sent."
}
```

The button is placed as-is and will be clickable, but will not perform a real resend until
the `resend` function/endpoint is implemented. Once wired, a successful resend shows the
success message **"A new verification email has been sent."**

---

## 4. AI Prompts

### Prompt 1 — Feature request (verbatim)

> ok now i want to make other two thing if email already verifred page if email is verified
> show email already verified the backend is providing the correct message for if user is
> verified also if token is expired it should shouw token expired page and resend button
> witch maps to a new function resend which i will implement after this ... give a .md file for it

### Prompt 2 — Refinement (verbatim)

> ok add verification invalid page currently place the resend button as such as it i will
> design backend after on resending it should show a sucess msg email verification resent has
> send to client update the .md file based on this

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Purpose |
|------|---------|
| `frontend/src/VerifiedAlreadyPage.jsx` | "Email already verified" status page |
| `frontend/src/VerificationExpiredPage.jsx` | "Link expired" page + Resend button + success message |
| `frontend/src/VerificationInvalidPage.jsx` | "Invalid verification link" status page |
| `frontend/src/App.jsx` | Add `/already-verified`, `/verification-expired`, `/verification-invalid` routes |
| `frontend/src/signup.css` | Minor additions only if needed |

### Acceptance Criteria

- [ ] `/already-verified` renders an "Email already verified" message + a way back to sign in.
- [ ] `/verification-expired` renders a "Link expired" message + a **Resend** button.
- [ ] `/verification-invalid` renders an "Invalid verification link" message only (no links).
- [ ] Resend button is present (placed as-is) and maps to a `resend` handler (placeholder, no real call yet).
- [ ] A successful resend shows the message "A new verification email has been sent." (once wired).
- [ ] All three pages match the existing visual style (shared header + signup.css).
- [ ] Routes added in `App.jsx`.

### Deferred to a later step

- The real **resend** flow: the backend `resend` endpoint/function and wiring the button to it
  (the user will design the backend after this step). On success it should display
  "A new verification email has been sent."

### Open Questions (to decide when implementing the resend backend)

1. **How does Resend identify the user?** The `/verification-expired` redirect has no token or
   email. Options:
   - (a) The expired page asks the user to type their email, then resend. *(No backend change.)*
   - (b) Backend appends an identifier to the redirect, e.g.
     `…/verification-expired?token=<raw>` or `?email=<email>`, so the page can pass it to
     resend. *(Requires a small backend change.)*

   *(Resolved for this step: `/verification-invalid` page **is** included now.)*
