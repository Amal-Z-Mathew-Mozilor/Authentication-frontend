// fetch wrapper ("interceptor") for JWT-protected requests.
//
// On a "Token has expired" 401, it transparently calls POST /rotateToken once and retries the
// original request (the browser auto-sends the refreshed httpOnly cookie). If rotation fails, it
// returns the original 401 response so the caller's existing 401/403 handling can redirect.
//
// All requests are sent with credentials so the auth cookies ride along.

const ROTATE_URL = '/pulse/users/rotateToken'
const LOGIN_PATH = '/login'

// Single-flight: concurrent expired requests share ONE rotateToken call (rotateToken deletes the
// old refresh entry and issues a new one, so parallel rotations would clobber each other).
let refreshPromise = null

/**
 * Refresh the access token via POST /rotateToken, single-flight across concurrent callers.
 * Concurrent expired requests share one in-flight rotation (rotateToken invalidates the old
 * refresh entry, so parallel rotations would clobber each other).
 * @returns {Promise<boolean>} True if the token was refreshed, false on any failure.
 */
function rotateOnce() {
  if (!refreshPromise) {
    refreshPromise = fetch(ROTATE_URL, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// Peek at the response WITHOUT consuming its body (so the caller can still read it).
/**
 * Detect an "expired token" 401 by peeking at the response body via a clone.
 * @param {Response} res - The fetch response (its body is left unconsumed).
 * @returns {Promise<boolean>} True if the message matches /expired/i.
 */
async function isExpired(res) {
  try {
    const data = await res.clone().json()
    return /expired/i.test(data?.message || '')
  } catch {
    return false
  }
}

// Server signalled a hard session invalidation (e.g. the password was changed on another device).
// The server has already cleared the auth cookies; we just send the user to /login.
/**
 * Detect a hard session-invalidation 401 by peeking at the response body via a clone.
 * @param {Response} res - The fetch response (its body is left unconsumed).
 * @returns {Promise<boolean>} True if the message matches /invalidated/i.
 */
async function isInvalidated(res) {
  try {
    const data = await res.clone().json()
    return /invalidated/i.test(data?.message || '')
  } catch {
    return false
  }
}

/**
 * Fetch wrapper for JWT-protected requests that transparently rotates an expired token.
 * Always sends credentials. On a "Token has expired" 401 it calls rotateOnce() and retries the
 * request once with the refreshed cookie; if rotation fails, or the session was invalidated, it
 * redirects to /login and returns the original 401 response.
 * @param {string} url - Request URL (relative to the Vite /pulse proxy).
 * @param {RequestInit} [options] - fetch options, merged over { credentials: 'include' }.
 * @returns {Promise<Response>} The (possibly retried) fetch response.
 */
export async function apiFetch(url, options = {}) {
  const opts = { credentials: 'include', ...options }

  let res = await fetch(url, opts)

  if (res.status === 401 && (await isExpired(res))) {
    const refreshed = await rotateOnce()
    if (refreshed) {
      res = await fetch(url, opts) // retry once with the refreshed cookie
    } else {
      // rotation failed (session dead — e.g. refresh rejected by the cutoff) → client logout
      window.location.href = LOGIN_PATH
      return res
    }
  }

  // hard session invalidation (access token still valid but issued before the cutoff) → logout
  if (res.status === 401 && (await isInvalidated(res))) {
    window.location.href = LOGIN_PATH
    return res
  }

  return res
}
