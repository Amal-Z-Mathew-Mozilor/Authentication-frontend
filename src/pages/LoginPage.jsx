import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import '../styles/signup.css'

const LOGIN_URL = '/pulse/users/login'

// Backend returns wait times in seconds; show them in minutes.
/**
 * Format a lockout/rate-limit wait time (seconds) as a human phrase in minutes.
 * @param {number|string} seconds - Wait time in seconds from the backend.
 * @returns {string} A phrase like "a moment", "less than a minute", or "3 minutes".
 */
function formatMinutes(seconds) {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0) return 'a moment'
  if (s < 60) return 'less than a minute'
  const m = Math.ceil(s / 60)
  return `${m} minute${m === 1 ? '' : 's'}`
}

/**
 * /login page — POSTs { email, password } to /pulse/users/login and navigates to /home on success.
 * Guards against an empty password client-side, shows 422 email errors inline, and surfaces
 * 429 lockout/rate-limit waits and 401 messages in a banner; routes unverified accounts (403)
 * to /verification-required.
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: [], password: [] })
  const [banner, setBanner] = useState(null) // auth/lock/rate-limit message from backend
  const [status, setStatus] = useState('idle') // idle | loading
  const [showPw, setShowPw] = useState(false)

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]?.length) setErrors((p) => ({ ...p, [key]: [] }))
    if (banner) setBanner(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBanner(null)

    // Email is validated by the backend (loginMiddleware → loginEmailValidator → 422).
    // Keep only a password-required guard: the login route has no password validator, so an
    // empty password would otherwise reach the controller and count as a failed attempt.
    const pwErr = form.password ? null : 'Password is required'
    if (pwErr) {
      setErrors({ email: [], password: [pwErr] })
      return
    }
    setErrors({ email: [], password: [] })
    setStatus('loading')

    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        /* keep {} */
      }

      if (res.ok) {
        navigate('/home')
        return
      }

      // 422 — email validation from loginMiddleware
      if (res.status === 422 && Array.isArray(data.errors)) {
        setErrors({
          email: data.errors
            .filter((er) => er.path === 'email')
            .map((er) => er.msg),
          password: [],
        })
        setStatus('idle')
        return
      }

      // 429 — throttled: account lock OR per-IP limit. Both send errors.retryAfter (seconds).
      // Pick the wording from the backend message so a locked account reads as "Account is locked".
      if (res.status === 429) {
        const secs = data.errors?.retryAfter
        const lead = /lock/i.test(data.message || '')
          ? 'Account is locked.'
          : 'Too many login attempts.'
        setBanner(
          secs != null
            ? `${lead} Try again in ${formatMinutes(secs)}.`
            : data.message || lead,
        )
        setStatus('idle')
        return
      }

      // 403 unverified email — go to the verification notification page
      if (res.status === 403 && /verify/i.test(data.message || '')) {
        navigate('/verification-required')
        return
      }

      // 401 etc — invalid credentials or other backend message
      setBanner(data.message || 'Login failed.')
      setStatus('idle')
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
      setStatus('idle')
    }
  }

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card">
          <h1 className="title">Sign in</h1>
          <p className="subtitle">
            New here? <Link to="/signup">Create an account</Link>
          </p>

          {banner && (
            <div className="banner" role="alert">
              {banner}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@domain.com"
              autoComplete="email"
              errors={errors.email}
            />

            <div className={`field ${errors.password.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="password">
                <span>Password</span>
                <button
                  type="button"
                  className="peek"
                  onClick={() => setShowPw((s) => !s)}
                  tabIndex={-1}
                >
                  {showPw ? 'hide' : 'show'}
                </button>
              </label>
              <div className="input-row">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {errors.password.length > 0 && (
                <ul className="errlist">
                  {errors.password.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              className={`submit ${status === 'loading' ? 'loading' : ''}`}
              disabled={status === 'loading'}
            >
              Sign in
            </button>
          </form>

          <p className="alt-link">
            <Link to="/forgotPassword">Forgot your password?</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

/**
 * Labeled input field with an inline error list.
 * @param {object} props
 * @param {string} props.id - Input id, also the label's htmlFor target.
 * @param {string} props.label - Field label text.
 * @param {string[]} [props.errors] - Error messages to render below the input (default []).
 * @returns {JSX.Element}
 */
function Field({ id, label, errors = [], ...props }) {
  return (
    <div className={`field ${errors.length ? 'invalid' : ''}`}>
      <label className="label" htmlFor={id}>
        <span>{label}</span>
      </label>
      <div className="input-row">
        <input id={id} {...props} />
      </div>
      {errors.length > 0 && (
        <ul className="errlist">
          {errors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
