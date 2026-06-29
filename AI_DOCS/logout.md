# Logout Feature (Frontend)

> Frontend-only — the backend `GET /pulse/users/logout` already exists. **Status: implemented.**

## 1. Plan

### Objective

Wire the Account menu's **Logout** item (previously a placeholder) to actually log the user out:
call the backend logout endpoint, then redirect to the landing page (`/`).

### Scope

In scope: the `handleLogout` logic in the shared `Header`'s Account menu. Out of scope: backend
changes (the `/logout` endpoint already clears cookies + blacklists the token).

---

## 2. Specification

### Backend context (already implemented)
```
GET /pulse/users/logout   (jwtValidation)
- needs the accessToken cookie
- deletes the Redis refresh entry, blacklists the access token (jti), clears both cookies
- 200 on success; 401 if the accessToken cookie is missing/invalid
```

### Frontend — `Header.jsx` (Account → Logout)
```js
async function handleLogout() {
  setOpen(false)
  try {
    await fetch('/pulse/users/logout', { credentials: 'include' })  // sends the auth cookie
  } catch { /* ignore */ }
  navigate('/')   // redirect to the landing page regardless
}
```

### Behavior

| Situation | Result |
|-----------|--------|
| Click **Account → Logout** | `GET /pulse/users/logout` (credentials included) → backend clears cookies + blacklists token |
| Success (`200`) | Redirect to landing page `/` |
| Failure / not authenticated (`401`) / network | Still redirect to `/` (user is logged out of the UI regardless) |

> The redirect happens unconditionally so the user always lands logged-out; the cookie/token
> cleanup is the backend's responsibility on the `200` path.

---

## 3. Design Notes

- Lives in the shared `Header` Account menu (only rendered on authenticated pages via
  `<Header account />`, e.g. `/home`, `/change-password`).
- Uses `useNavigate` (already imported for the Change password item).
- No new UI — reuses the existing menu item.

---

## 4. AI Prompts (verbatim)

### Prompt 1 — Feature request
> now i want to implement logout front end logic for /logout and it shoud redirect to landing page

### Prompt 2 — This doc
> create a .md file for it

---

## 5. Supporting Documentation

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/Header.jsx` | Account → Logout now calls `GET /logout` (credentials include) then `navigate('/')` |

### Acceptance Criteria

- [x] Account → Logout calls `GET /pulse/users/logout` with credentials.
- [x] Redirects to the landing page (`/`) after the call.
- [x] Redirects even if the request fails (always ends logged-out in the UI).
- [x] No backend changes (endpoint already existed).

### Related

- `home_page.md` — the Account menu (Change password + Logout) lives on the Home page; updated
  there to mark Logout as implemented.
