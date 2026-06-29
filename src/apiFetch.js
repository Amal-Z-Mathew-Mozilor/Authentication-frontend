// fetch wrapper ("interceptor") for JWT-protected requests.
//
// On a "Token has expired" 401, it transparently calls POST /rotateToken once and retries the
// original request (the browser auto-sends the refreshed httpOnly cookie). If rotation fails, it
// returns the original 401 response so the caller's existing 401/403 handling can redirect.
//
// All requests are sent with credentials so the auth cookies ride along.

const ROTATE_URL = '/pulse/users/rotateToken'

// Single-flight: concurrent expired requests share ONE rotateToken call (rotateToken deletes the
// old refresh entry and issues a new one, so parallel rotations would clobber each other).
let refreshPromise = null

function rotateOnce() {
  if (!refreshPromise) {
    refreshPromise = fetch(ROTATE_URL, { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// Peek at the response WITHOUT consuming its body (so the caller can still read it).
async function isExpired(res) {
  try {
    const data = await res.clone().json()
    return /expired/i.test(data?.message || '')
  } catch {
    return false
  }
}

export async function apiFetch(url, options = {}) {
  const opts = { credentials: 'include', ...options }

  let res = await fetch(url, opts)

  if (res.status === 401 && (await isExpired(res))) {
    const refreshed = await rotateOnce()
    if (refreshed) {
      res = await fetch(url, opts)   // retry once with the refreshed cookie
    }
    // if not refreshed, fall through and return the original 401 — caller handles it
  }

  return res
}
