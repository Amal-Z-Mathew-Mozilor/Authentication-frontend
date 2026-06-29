# Plan: Signup Page

> Status: Plan (pre-implementation)

## Problem / Goal

Let a new user create a Pulse account from the client and understand exactly why an
attempt fails. Connect to the backend `POST /pulse/users/signup` endpoint and surface
its validation and conflict errors clearly.

## Scope

In scope:
- A signup form collecting **email** and **password**.
- Client-side password checklist mirroring the backend policy.
- Render server validation errors (`422`) inline per field.
- Show "email already exist" (`400`) as a toast.
- Success state after account creation.

Out of scope:
- Login, email verification, password reset (separate features).
- Any backend changes.

## Proposed Behavior

| Trigger | Expected result |
|---------|-----------------|
| Submit valid email + password | `201` → success card ("verify your email") |
| Submit with policy violations | `422` → inline messages grouped per field |
| Submit an already-registered email | `400` → "email already exist" toast, form intact |
| Server/other error | Toast with message |
| Backend unreachable | Network error toast |

## Endpoint

```
POST /pulse/users/signup
Body: { "email": "...", "password": "..." }
credentials: include   (httpOnly cookie auth)
```

## Password Policy (client checklist)

12+ chars · uppercase · lowercase · number · special char · no spaces.

## Design

- Light theme, single centered card, shared Pulse header.
- Minimal motion (button spinner, toast slide-in).
- CSS via `signup.css`.

## Acceptance Criteria

- [ ] Form submits email + password to the signup endpoint via the Vite proxy.
- [ ] All `422` field errors are shown beneath the correct input.
- [ ] Duplicate email shows a toast and does not break/remove any field.
- [ ] Successful signup shows a confirmation state.
- [ ] Network failure is handled gracefully.

## Implementation Steps (intended)

1. Build `SignupPage.jsx` form + state.
2. Wire `fetch` to `/pulse/users/signup` with error handling per the table above.
3. Add the password checklist.
4. Style with `signup.css`; add shared `Header`.
5. Manually verify each row of the behavior table.
