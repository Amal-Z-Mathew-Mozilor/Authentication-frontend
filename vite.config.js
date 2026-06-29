import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend target for the dev proxy. Defaults to localhost (local dev); in Docker it is set to
// http://host.docker.internal:8000 so the container can reach the backend running on the host.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind 0.0.0.0 so the dev server is reachable from outside the container (port mapping).
    host: true,
    // Pin the dev port so window.location.origin always matches the backend's
    // ALLOWED_VERIFY_BASES / ALLOWED_RESET_BASES allowlists (exact-match). strictPort
    // makes Vite fail loudly instead of silently drifting to 5174 and breaking signup/reset.
    port: 5173,
    strictPort: true,
    // Proxy API calls to the Express backend so the browser stays same-origin
    // (avoids CORS) and httpOnly auth cookies flow correctly in dev.
    proxy: {
      '/pulse': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
