# Plan: Forgot Password Page

> Status: Plan (pre-implementation)

## Problem / Goal

Let a user who can't sign in request a password-reset link by email. Validate the email
against the policy on the client, then submit it to the backend so the reset email is sent.

## Scope

In scope:
- A page at `/forgotPassword`, reachable from the signup page's "Forgot your password?" link.
- Client-side email policy check (required + valid format) before sending.
- Submit the email to `POST /pulse/users/forgotPassword`.
- Neutral "check your inbox" confirmation on success.

Out of scope:
- The reset-password page (token in URL) — a later, separate step.
- Any backend changes.

## Proposed Behavior

| Trigger | Expected result |
|---------|-----------------|
| Empty email | Inline "Email is required" (no request sent) |
| Malformed email | Inline "Invalid email address" (no request sent) |
| Valid email submitted | `200` → "check your inbox" card (neutral message) |
| Validation error from server | `422` → inline email error(s) |
| Server/other error | Toast with message |
| Backend unreachable | Network error toast |

## Endpoint

```
POST /pulse/users/forgotPassword
Body: { "email": "..." }
credentials: include
```

## Security Note

The backend returns the same message whether or not the email is registered
("If the email exists, a reset link has been sent"), so the UI must show an identical
confirmation either way and never reveal account existence.

## Design

- Consistent with the signup page: shared Pulse header, `signup.css` classes, light theme.
- Minimal motion (button spinner, toast slide-in).

## Acceptance Criteria

- [ ] "Forgot your password?" link on the signup page navigates here.
- [ ] Email policy is enforced client-side before any request.
- [ ] Valid submit posts to `/pulse/users/forgotPassword` and shows the confirmation card.
- [ ] Success message is neutral (no account-existence leak).
- [ ] Network failure is handled gracefully.

## Implementation Steps (intended)

1. Build `ForgotPasswordPage.jsx` with email state + client-side `validateEmail`.
2. Wire `fetch` to `/pulse/users/forgotPassword` with error handling per the table.
3. Add the success ("check your inbox") state.
4. Add the `/forgotPassword` route in `App.jsx`.
5. Reuse `Header` + `signup.css`; manually verify each behavior row.
