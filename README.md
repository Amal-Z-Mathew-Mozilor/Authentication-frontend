# Pulse — Frontend

React client for the Pulse app: **React 19** + **Vite 8**, plain JSX (no TypeScript), routed with
`react-router-dom`. Alongside the auth flows (signup, login, email verification, password reset) it
provides the **cookie-consent** UI: a **Web Manager** to add/edit websites and a **cookie-policy
wizard** — a section-based editor with a Tiptap rich-text Description field, image uploads, live
preview, and a final "Generate" step that exports the policy as HTML or emails it to a teammate. It
talks to the Pulse backend (`../backend`, a separate repo) through a dev proxy and cookie-based auth.

> Contributor notes (design system, routes, API integration) are in [`CLAUDE.md`](./CLAUDE.md).

## Prerequisites

- The **backend must be running on `http://localhost:8000`** (see the backend repo's README).
  The dev server proxies `/pulse` → the backend, and auth relies on its httpOnly cookies.
- **Docker** + **Docker Compose** (recommended), **or** **Node.js 22+** to run on the host.

## Run with Docker (recommended)

```bash
docker compose up
```

This uses [`docker-compose.yml`](./docker-compose.yml): it installs dependencies **inside** the
container (your host stays clean) and serves the Vite dev server at **http://localhost:5173** with
hot reload. Because the backend runs on the host, the container reaches it via
`host.docker.internal:8000` (already configured as `VITE_PROXY_TARGET`).

Stop with `Ctrl-C`; add `-d` to run detached.

## Run on the host (without Docker)

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
```

To point at a backend somewhere other than `localhost:8000`:

```bash
VITE_PROXY_TARGET=http://your-backend:8000 npm run dev
```

## Scripts

```bash
npm run dev        # start the dev server (pinned to :5173, strictPort)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint
```

## Notes

- **The dev port is pinned to `5173`.** The backend allowlists email-link bases against this exact
  origin (`http://localhost:5173/...`), so verification and password-reset links only work on 5173.
- No `.env` is required for local dev — the only knob is `VITE_PROXY_TARGET` (defaults to
  `http://localhost:8000`).
- All API calls are relative to `/pulse` and send `credentials: 'include'` for cookie auth.
