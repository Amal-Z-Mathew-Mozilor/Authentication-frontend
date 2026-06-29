# Home Page Feature Plan


---

## 1. Plan

### Objective

Provide an authenticated landing page at the frontend route `/home` that greets the
signed-in user by email and exposes an **Account** menu (placed top-right, as is common on
most websites) containing **Change password** and **Logout** options. This is the page the
user lands on **after successful email verification and after login**.

### Goals

- Render at frontend route `/home`.
- Fetch the current user from `GET /pulse/users/me` and show `Welcome, <email>`.
- Show an **Account** control in the top-right of the header (typical website placement).
- Account opens a small menu containing **Change password** and **Logout** options.
- Keep the visual design consistent with the existing Signup and Forgot Password pages.

### Scope

In scope (this step):
- The `/home` page, the welcome message, and the Account menu **UI**.
- Wiring the `/me` fetch to display the email.
- Handling the not-authenticated case.

Out of scope (later steps):
- **Change password functionality** — the menu option exists, but clicking it does not yet
  perform a password change. Its behavior is a placeholder for a later implementation.
- **Logout functionality** — the menu option exists, but it does not yet log the user out
  (would call `GET /pulse/users/logout`). Placeholder for a later implementation.
- Any backend changes.

---

## 2. Specification

### Route

```
/home    → HomePage (frontend, react-router)
```

> Note: `/home` is a **frontend** route. The backend redirects to `${FRONTEND_URL}/home`
> after email verification, and the user is also sent here after a successful login.

### Data source

```
GET /pulse/users/me        (protected by jwtValidation; sends auth cookie)
credentials: include
→ 200 { statuscode, data: <email>, message, sucess }   // data is the user's email
→ 401 when not authenticated
```

> The current `me` controller returns the email as `data` (a string). The page will read
> `data` for the email. If `/me` later returns an object, the page will read `data.email`.

### Behavior

| Situation | UI behavior |
|-----------|-------------|
| Page loads | Fetch `/me`; show a brief loading state |
| `200` | Show `Welcome, <email>` + Account menu |
| `401` / not authenticated | Redirect to `/` (signup) — or show a "please sign in" message |
| Network / other error | Toast (consistent with other pages) |
| Click **Account** | Toggle a dropdown menu in the top-right |
| Click **Change password** (in menu) | Placeholder for now — no password change yet (e.g. a disabled/"coming soon" affordance). Final behavior defined in a later plan. |
| Click **Logout** (in menu) | Placeholder for now — does not log out yet (would later call `GET /pulse/users/logout`). Final behavior defined in a later plan. |

### Account menu

- Trigger placed at the **top-right of the header** (standard location).
- Opens a dropdown containing **Change password** and **Logout**.
- Closes on outside click / selection.

---

## 3. Design Notes

### Consistency with existing pages

- Reuse the shared `Header.jsx` (blue bar, white "Pulse" wordmark + badge).
- Reuse `signup.css` tokens/classes (`.page`, `.main`, `.card`, `.toast`, etc.); add only
  the small styles needed for the Account dropdown.
- Same light theme, same minimal motion.

### Header change (and its blast radius)

The Account control should appear **only on authenticated pages** like `/home`, not on
Signup / Forgot Password. Options:

1. Add an optional prop to `Header` (e.g. `<Header account />`) that renders the Account
   menu on the right when set. **(Preferred — single shared header, opt-in.)**
2. A separate header variant for authenticated pages.

Plan: go with **option 1** so Signup/Forgot remain unchanged and `/home` opts in.

### Layout sketch

```
┌──────────────────────────────────────────────┐
│  ● Pulse                            Account ▾  │   ← shared header (account opt-in)
├──────────────────────────────────────────────┤
│                                                │
│              Welcome,                          │
│              you@domain.com                    │
│                                                │
└──────────────────────────────────────────────┘
        Account ▾ open:
            ┌───────────────────┐
            │ Change password   │   ← placeholder action (functionality later)
            │ Logout            │   ← placeholder action (functionality later)
            └───────────────────┘
```

### Auth / redirect

If `/me` returns `401`, the page treats the user as not logged in and redirects to `/`.
(See the dev cookie-domain caveat noted during the verify-email discussion — worth
confirming `/me` actually receives the auth cookie through the Vite proxy.)

---

## 4. AI Prompts

### Prompt 1 — Feature request (verbatim)

> now i want to create a frontend /home page showing welcome -email the design should be
> consistent with already existing signup and forgot password page it should have an option
> called account it should be placed somewhere that we usualy see in many websites and inside
> account there should be a change password option its working will be implemented in later
> implementation before creating it create a .md file ... and after approve this file only
> you start creation

### Prompt 2 — Clarification (verbatim)

> This is the page the backend redirects to after successful email verification. not only
> after sucessful verification but also after login we go to this page also add a logout
> option which will be implemented later update the .md file based on this

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Purpose |
|------|---------|
| `frontend/src/HomePage.jsx` | New `/home` page: welcome message + Account menu |
| `frontend/src/App.jsx` | Add the `/home` route |
| `frontend/src/Header.jsx` | Add opt-in Account menu (top-right) |
| `frontend/src/signup.css` | Small additions for the Account dropdown |

### Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/pulse/users/me` | Fetch the authenticated user's email |

### Acceptance Criteria

- [ ] `/home` renders and fetches `/me`.
- [ ] Shows `Welcome, <email>` on success.
- [ ] Account control appears top-right of the header (only on `/home`).
- [ ] Account menu contains **Change password** and **Logout** options (placeholders, no action yet).
- [ ] Reached after both email verification and login.
- [ ] Not-authenticated (`401`) redirects to `/`.
- [ ] Visual style matches Signup / Forgot Password.

### Deferred to a later plan

- Implementing the actual **Change password** flow (form + `POST /pulse/users/changePassword`).
- Implementing the actual **Logout** action (`GET /pulse/users/logout`, then redirect to `/`).
