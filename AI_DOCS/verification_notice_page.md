# Verification Notification Page Feature Plan

> Plan written **before** implementation. No code is written until this document is approved.

## 1. Plan

### Objective

Add the "Verification Notification page" from the login flowchart: when a user logs in with
**correct credentials but an unverified email**, the backend returns `401 "pls verify email"`,
and the frontend sends them to this page. It tells the user their email isn't verified yet and
offers a **Back to login** button.

### Goals

- Frontend route `/verification-required` showing a "please verify your email" notice.
- A **Back to login** button that navigates to `/login`.
- `LoginPage` detects the unverified response and redirects here (instead of a banner).
- Visual style consistent with the other status pages (shared `Header`, `signup.css`).

### Scope

In scope:
- The notice page + its route.
- Wiring `LoginPage`'s `401 "pls verify email"` case to redirect here.

Out of scope:
- A **Resend verification** action on this page (the user only asked for a Back-to-login
  button). Could be added later, reusing the resend feature. *(See Open Items.)*
- Any backend changes (the `401 "pls verify email"` response already exists).

---

## 2. Specification

### Route

```
/verification-required   → VerificationRequiredPage (frontend, react-router)
```

### How it's reached

`LoginPage` submits to `POST /pulse/users/login`. On `401` whose message indicates the email
isn't verified (`"pls verify email"`, detected via `/verify/i.test(data.message)`), it calls
`navigate('/verification-required')`.

> This is the flowchart branch: **Equal? = Yes → Check email Verified = No → Go to Verification
> Notification page.**

### Behavior

| Element | Behavior |
|---------|----------|
| Message | "Verify your email" + explanation ("Your email isn't verified yet. Please check your inbox for the verification link.") |
| **Back to login** button | Navigates to `/login` (no API call) |
| API calls | None — this is a static notice page |

---

## 3. Design Notes

### Consistency

- Reuse the shared `Header.jsx` (plain, no Account menu — pre-auth page).
- Reuse `signup.css` — `.card`/`.success` card, `.title`/`.subtitle`, and a button styled like
  `.submit` for **Back to login** (or an `.alt-link`). Light theme, minimal motion.
- Use a neutral/info icon (e.g. the amber `warn` variant, or an ℹ glyph) — not the green
  success check, since this is a "needs action" notice.

### Layout sketch

```
┌─────────────────────────────┐
│            ✉ / ℹ            │
│      Verify your email      │
│  Your email isn't verified  │
│  yet. Check your inbox for  │
│  the verification link.     │
│      [ Back to login ]      │
└─────────────────────────────┘
```

### Login wiring (small change to existing `LoginPage`)

Replace the current "show banner for `pls verify email`" behavior with a redirect:
```js
if (res.status === 401 && /verify/i.test(data.message || '')) {
  navigate('/verification-required')
  return
}
// other 401s still show the banner
```

---

## 4. AI Prompts

### Prompt 1 — Feature request (verbatim)

> i think you show the verifcation page with a go back to login button also edit login.md file
> where you specifcity about this verification and also give .md file for this

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Change |
|------|--------|
| `frontend/src/VerificationRequiredPage.jsx` *(new)* | Notice page + Back to login button |
| `frontend/src/App.jsx` | Add `/verification-required` route |
| `frontend/src/LoginPage.jsx` | On `401 "pls verify email"` → redirect here instead of banner |

### Acceptance Criteria

- [ ] `/verification-required` renders the "verify your email" notice.
- [ ] A **Back to login** button navigates to `/login`.
- [ ] Logging in with correct credentials but unverified email redirects here (no banner).
- [ ] Other `401`s (invalid credentials, locked) still show the login banner as before.
- [ ] Visual style matches the existing pages.

### Open Items / Decisions

1. **Route name:** `/verification-required` (chosen, fits the `verification-*` naming). Rename
   if you prefer (e.g. `/verify-email`, `/verification-notice`).
2. **Resend on this page:** not included (only Back-to-login per request). Could be added later
   using the resend feature — but resend needs a token/email, which this page wouldn't have.
3. **Show the email:** optionally pass the entered email via router state to display it; default
   is a static notice without the email.
