# Frontend — CLAUDE.md

Guidance for working in the `frontend/` folder. This is the React client for the
authentication backend that lives in `../backend`.

## Stack

- **React 19** (function components + hooks only)
- **Vite 8** as dev server / bundler
- **Plain JavaScript / JSX** — no TypeScript (despite `@types/*` being present)
- **ESLint** (flat config in `eslint.config.js`)
- ES modules (`"type": "module"`)

## Commands

Run all commands from the `frontend/` directory:

```bash
npm run dev      # start Vite dev server (default http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint over the project
```

## Structure

```
frontend/
├── index.html        # Vite entry HTML (#root mount point)
├── vite.config.js    # Vite + @vitejs/plugin-react
├── eslint.config.js  # flat ESLint config
└── src/
    ├── main.jsx      # app bootstrap (createRoot + <StrictMode>)
    ├── App.jsx       # root component (currently the Vite starter)
    ├── *.css         # component / global styles
    └── assets/       # images & svgs
```

## Conventions

- Use function components and hooks; no class components.
- Keep JSX files as `.jsx`.
- Component files in `PascalCase` (e.g. `LoginForm.jsx`); hooks as `useXyz.js`.
- Import assets through Vite (`import logo from './assets/x.svg'`), not absolute paths.
- This is currently the default Vite scaffold — `App.jsx` still renders the starter page.

## Backend API integration

The backend is an Express server (see `../backend`):

- **Base URL:** `http://localhost:8000/pulse/users`
- **Auth uses httpOnly cookies** (`accessToken`, `refreshToken`) set by the server —
  **not** localStorage and **not** a bearer header. Because of this, every request that
  needs auth (or that sets cookies) MUST send credentials:

  ```js
  fetch("http://localhost:8000/pulse/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",            // REQUIRED — sends/receives the auth cookies
    body: JSON.stringify({ email, password }),
  })
  ```

### Endpoints

| Method | Path                      | Body / params                                   | Notes |
|--------|---------------------------|-------------------------------------------------|-------|
| POST   | `/signup`                 | `{ username, email, password }`                 | Sends verification email |
| GET    | `/verifyEmail/:token`     | token in URL                                    | Server **redirects** the browser (see below) |
| POST   | `/login`                  | `{ email, password }`                           | Sets auth cookies on success |
| GET    | `/logout`                 | — (needs `accessToken` cookie)                  | Clears + blacklists token |
| POST   | `/forgotPassword`         | `{ email }`                                     | Sends reset email |
| POST   | `/resetPassword/:token`   | `{ newPassword, confirmPassword, email }`       | token in URL |
| POST   | `/rotateToken`            | — (needs `refreshToken` cookie)                 | Issues new token pair |
| POST   | `/changePassword`         | `{ oldPassword, newPassword, confirmPassword }` | Needs `accessToken` cookie |

### Error & success response shape

Errors come back as JSON from the backend's global error handler:

```json
{ "success": false, "message": "Invalid credentials", "errors": [] }
```

`errors` is populated for validation failures (422). Success responses use a similar
shape with `statuscode`, `data`, `message`, and `sucess` (note: the backend misspells
the success flag as `sucess` — match that key when reading responses, or normalize it).

### Password rules (mirror these in client-side validation)

Min 12 chars, at least one uppercase, one lowercase, one number, one special character,
and no spaces. Username must be lowercase, min 3 chars.

## Routes this frontend must provide

The backend redirects the browser to these **frontend** paths after email verification,
using the `FRONTEND_URL` env var on the backend. Build pages/routes for:

- `/home` — landing after successful verification
- `/verification-invalid`
- `/verification-expired`
- `/already-verified`
- plus a reset-password page that posts to `/resetPassword/:token`

> If a verify link lands on `…/verifyEmail/undefined/home`, the backend's `FRONTEND_URL`
> env var is unset — that's a backend `.env` fix, not a frontend bug.

## Dev: avoiding CORS

The backend does not currently enable CORS. Two options for local dev:

1. **Vite proxy (recommended)** — add to `vite.config.js` so same-origin calls just work:
   ```js
   server: {
     proxy: { "/pulse": { target: "http://localhost:8000", changeOrigin: true } },
   }
   ```
   Then call `/pulse/users/login` (relative) instead of the full localhost:8000 URL.
2. Or enable `cors({ origin: "http://localhost:5173", credentials: true })` on the backend.

Either way, `credentials: "include"` is still required for the cookie auth to work.

## Design aesthetics

Avoid generic, "on distribution" output — the so-called "AI slop" aesthetic. Make
creative, distinctive frontends that surprise and delight. Focus on:

- **Typography:** Choose fonts that are beautiful, unique, and interesting. Avoid generic
  fonts like Arial and Inter; opt for distinctive choices that elevate the aesthetic.
- **Color & theme:** Commit to a cohesive aesthetic. Use CSS variables for consistency.
  Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw
  from IDE themes and cultural aesthetics for inspiration.
- **Motion:** Use animation for effects and micro-interactions. Prefer CSS-only solutions
  for plain HTML; use the Motion library for React when available. Prioritize high-impact
  moments — one well-orchestrated page load with staggered reveals (`animation-delay`)
  creates more delight than scattered micro-interactions.
- **Backgrounds:** Create atmosphere and depth rather than defaulting to solid colors.
  Layer CSS gradients, use geometric patterns, or add contextual effects that match the
  overall aesthetic.

Avoid generic AI-generated aesthetics:

- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the
context. Vary between light and dark themes, different fonts, and different aesthetics.
There's a tendency to converge on common choices (e.g. Space Grotesk) across generations —
avoid this. It is critical to think outside the box.
