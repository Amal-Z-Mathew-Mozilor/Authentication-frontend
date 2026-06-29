# JWT Token Rotation (Frontend Interceptor)

> Frontend-only — the backend `POST /pulse/users/rotateToken` already exists. **Status: implemented.**
> **Design note (as built):** `apiFetch` does **not** redirect itself. On a failed rotation it
> returns the original `401`, and the caller's existing `401`/`403` handling does the SPA redirect
> (so logout lands on `/`, and `/me` / `/changePassword` land on `/login`). No `window.location`.

## 1. Plan

### Objective

Silently refresh an expired access token. When a protected request fails because the access
token expired, transparently call `rotateToken`, and — if it succeeds — **retry the original
request**. If the refresh itself fails, redirect to `/login`.

### How it works (grounded in the backend)

```
authed request (credentials: include)  ──►  jwtValidation
        │                                        │
        │                          access token expired → 401 "Token has expired"
        ▼
  interceptor sees 401 + /expired/
        │
        ▼
  POST /pulse/users/rotateToken (credentials: include)   ← uses the refreshToken cookie
        ├─ 200  → new accessToken + refreshToken cookies set → RETRY original request (auto-sends new cookie)
        └─ 401/400 (refresh missing/invalid/expired) → redirect to /login
```

### Key nuance — httpOnly cookies (correction to the usual "attach the new token")

Tokens are **httpOnly cookies**, so the frontend never reads or holds them. Therefore:
- We do **not** manually attach a token to the retry — the browser automatically sends the
  refreshed `accessToken` cookie when we re-issue the request.
- The "interceptor" is a small **`fetch` wrapper** (`apiFetch`), since `fetch` has no built-in
  interceptors (no axios in this project).

### What triggers rotation (and what does not)

| Backend response | Action |
|------------------|--------|
| `401 "Token has expired"` | Rotate → retry once |
| `401 "Authorization token missing"` / `"invalid Token"` | No rotation → pass through (page redirects to /login) |
| `403 "token revoked"` | No rotation → pass through (page redirects to /login) |
| rotate returns `401`/`400` | Redirect to `/login` |

Only the **expired** case rotates; missing/invalid/revoked are non-recoverable → login.

### Scope
In scope: an `apiFetch` wrapper + routing authenticated calls through it. Out of scope: backend
changes (`rotateToken` exists); changing the non-expired redirect behavior (pages already do that).

---

## 2. Specification

### `utils/apiFetch.js` (the interceptor)
```js
// pseudo-spec
export async function apiFetch(url, options = {}) {
  const opts = { credentials: 'include', ...options }
  let res = await fetch(url, opts)

  if (res.status === 401 && (await isExpired(res))) {   // peek message via res.clone()
    const ok = await refreshOnce()                      // single-flight rotateToken
    if (ok) res = await fetch(url, opts)                // retry once (new cookie auto-sent)
    // if NOT ok → fall through and return the original 401; the caller redirects
  }
  return res
}
```

Details:
- **Detect expired:** `res.clone().json()` → `message` matches `/expired/i` (clone so the caller can
  still read the body if not retried).
- **Single-flight refresh:** a shared in-flight promise so concurrent 401s trigger **one**
  `rotateToken` call (important — `rotateToken` deletes the old refresh entry and issues a new one,
  so parallel rotations would invalidate each other). Other callers await the same promise.
- **Retry once only:** if the retried request still 401s, do **not** loop — return it (page handles).
- **Redirect:** on rotate failure, `window.location.replace('/login')` (util can't use `useNavigate`).
- **Endpoint:** `POST /pulse/users/rotateToken` with `credentials: 'include'`.

### Wiring authenticated requests through `apiFetch`
Replace direct `fetch` with `apiFetch` for calls that hit `jwtValidation`:
- `HomePage` → `GET /me`
- `ChangePasswordPage` → `POST /changePassword`
- (optional) `Header` logout → `GET /logout` (it already redirects regardless; low value)

Public calls (signup, login, forgot, reset, verify, resend) do **not** need it.

---

## 3. Design Notes

- **No axios** — keep the project's `fetch` style; `apiFetch` is the thin wrapper.
- **Cookies, not headers** — the retry needs no token handling; the refreshed cookie rides along.
- **`rotateToken` needs no access token** (no `jwtValidation` on its route), so it works precisely
  when the access token is expired.
- **Single-flight** avoids the race where two expired requests each rotate and clobber each other.
- **Loop guard** — at most one rotate + one retry per request.

---

## 4. AI Prompts (verbatim)

> ok now i want to plan the rotation of jwt token i beleive it is done using interceptors in front
> end in jwt middleware there is aparticular error that throw APIerror token expired so interceptor
> should track this error and if the request failed due to this error it should call rotatetoken
> function check for the validation if validation fail redirect to login and after sucessfully
> creating new token it should resend the failed request due token expiration with the new token i
> beleive this is how it works out in frontend

---

## 5. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Change |
|------|--------|
| `frontend/src/apiFetch.js` *(new)* | Interceptor wrapper: rotate-on-expired + retry + single-flight |
| `frontend/src/HomePage.jsx` | Uses `apiFetch` for `GET /me` |
| `frontend/src/ChangePasswordPage.jsx` | Uses `apiFetch` for `POST /changePassword` |
| `frontend/src/Header.jsx` | Uses `apiFetch` for `GET /logout` |

### Acceptance Criteria

- [ ] A `GET /me` that fails with `401 "Token has expired"` triggers `rotateToken`, then retries and succeeds.
- [ ] If `rotateToken` fails (`401`/`400`), the user is redirected to `/login`.
- [ ] Non-expired `401`/`403` are not rotated (pass through to the page's existing handling).
- [ ] Concurrent expired requests cause only **one** `rotateToken` call (single-flight).
- [ ] At most one retry per request (no infinite loop).
- [ ] No manual token handling — relies on the refreshed httpOnly cookie.

### Decisions (resolved)

1. **Util location:** `frontend/src/apiFetch.js` (flat, matches existing structure). ✅
2. **Redirect mechanism:** `apiFetch` returns the failed `401`; the **caller** redirects (SPA
   `navigate`). No `window.location`. So `/me` & `/changePassword` → `/login`; logout → `/`. ✅
3. **Wrap logout?** Yes — included (rotation lets an expired-token logout still succeed; on
   refresh-fail it returns 401 and `handleLogout` redirects to `/` regardless). ✅
4. **Expired-message match:** `/expired/i` on the `message`. ✅
