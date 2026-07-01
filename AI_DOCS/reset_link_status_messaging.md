# Reset-Link Status Messaging (expired vs already-used) — Frontend

> Small frontend fix. **Status: implemented.** Related: `resend_password_reset.md`.

## 1. Problem

When a **used** password-reset token was submitted, `ResetPasswordPage` routed to the resend
page (`/reset-expired/:token`) — correct action (resend still works) — but that page always
showed **"Reset link expired"**, which is wrong wording for an *already-used* token.

Root cause: `ResetPasswordPage` sent both `401 "Token expired"` and `401 "token already is used"`
to the same page, and `ResetExpiredPage` had a hardcoded "expired" heading.

## 2. Fix

Keep the **single** resend page (resend is useful for both cases), but show the **correct
wording** by passing the reason through navigation.

### `ResetPasswordPage.jsx`
On a `401` token error, detect the reason and pass it via router state:
```js
if (res.status === 401 && /(expired|used)/i.test(data.message || '')) {
  const reason = /used/i.test(data.message) ? 'used' : 'expired'
  navigate(`/reset-expired/${token}`, { state: { reason } })
  return
}
```

### `ResetExpiredPage.jsx`
Read the reason and branch the copy (Resend button unchanged for both):
```js
const { state } = useLocation()
const used = state?.reason === 'used'
// heading:  used ? 'Reset link already used' : 'Reset link expired'
// subtitle: used ? '…has already been used. Request a new one below.'
//                : '…has expired. Request a new one below.'
```

### Backend mapping (unchanged)
`tokenValidation` (passwordReset middleware) returns: `401 "Token expired"`,
`401 "token already is used"`, `403 "Invalid Token"`. The `403` still shows the banner on the
reset form; only the two `401`s route to the resend page.

## 3. Design notes
- One page, two messages — avoids duplicating a near-identical "already used" page. Resend is
  offered in both cases (a used/expired link both warrant requesting a new one).
- Reason is passed via **router state** (not the URL). If the state is missing (e.g. a hard
  refresh of `/reset-expired/:token`), it falls back to the "expired" wording — a safe default.

## 4. AI Prompts (verbatim)
> i found a bug not bug when reset password token is already used it goes to expired page not
> already used page from resetpassword page
> ... apply the proposed fix
> ... also create a ai docs

## 5. Files Modified
| File | Change |
|------|--------|
| `frontend/src/ResetPasswordPage.jsx` | Pass `{ state: { reason } }` (`used`/`expired`) when routing to the resend page |
| `frontend/src/ResetExpiredPage.jsx` | Read `state.reason`; show "already used" vs "expired" heading/subtitle |

## 6. Acceptance Criteria
- [x] Used reset token → `/reset-expired/:token` shows **"Reset link already used"** + Resend.
- [x] Expired reset token → shows **"Reset link expired"** + Resend.
- [x] Missing reason (direct/refresh) → defaults to "expired" wording.
- [x] `403 "Invalid Token"` still shows on the reset form (banner), not the resend page.
