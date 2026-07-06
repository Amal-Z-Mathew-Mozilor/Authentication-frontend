import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

const EMPTY_ERRORS = { email: [], newPassword: [], confirmPassword: [] }

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState(EMPTY_ERRORS) // 422 field errors
  const [banner, setBanner] = useState(null) // 400/401/403 message from backend
  // checking → validating token on load · ok → show form · loading → submitting ·
  // done → password updated · invalid → bad link · checkError → couldn't reach server
  const [status, setStatus] = useState('checking')
  const [show, setShow] = useState({
    newPassword: false,
    confirmPassword: false,
  })
  const checked = useRef(false) // guard StrictMode's double-mount

  // Validate the reset token BEFORE showing the form (read-only check — token not consumed).
  useEffect(() => {
    if (checked.current) return
    checked.current = true
    ;(async () => {
      try {
        const res = await fetch(`/pulse/users/resetPassword/${token}/check`, {
          method: 'POST',
          credentials: 'include',
        })

        if (res.ok) {
          setStatus('ok')
          return
        }

        let data = {}
        try {
          data = await res.json()
        } catch {
          /* keep {} */
        }

        // Expired / already-used → resend page (resend still works); pass the reason for wording.
        if (res.status === 401 && /(expired|used)/i.test(data.message || '')) {
          const reason = /used/i.test(data.message) ? 'used' : 'expired'
          navigate(`/reset-expired/${token}`, {
            state: { reason },
            replace: true,
          })
          return
        }

        // 403 "Invalid Token" (or anything else) → invalid-link state.
        setStatus('invalid')
      } catch {
        setStatus('checkError')
      }
    })()
  }, [token, navigate])

  const toggle = (key) => () => setShow((s) => ({ ...s, [key]: !s[key] }))

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]?.length) setErrors((p) => ({ ...p, [key]: [] }))
    if (banner) setBanner(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // No client-side validation — the backend validator decides; we display its result.
    setErrors(EMPTY_ERRORS)
    setBanner(null)
    setStatus('loading')

    try {
      const res = await fetch(`/pulse/users/resetPassword/${token}`, {
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
        setStatus('done')
        return
      }

      // 422 — resetPasswordValidator: group messages by field
      if (res.status === 422 && Array.isArray(data.errors)) {
        const grouped = { email: [], newPassword: [], confirmPassword: [] }
        for (const er of data.errors) {
          if (grouped[er.path]) grouped[er.path].push(er.msg)
        }
        setErrors(grouped)
        setStatus('ok')
        return
      }

      // Expired / already-used reset token → go to the resend page (resend can still work).
      // (The load check already catches most of these; this covers a token that dies mid-session.)
      // Pass the reason so the page shows the right wording.
      if (res.status === 401 && /(expired|used)/i.test(data.message || '')) {
        const reason = /used/i.test(data.message) ? 'used' : 'expired'
        navigate(`/reset-expired/${token}`, { state: { reason } })
        return
      }

      // 400 (match / same-as-old / invalid credential) and 403 "Invalid Token" — show message
      setBanner(data.message || 'Could not reset your password.')
      setStatus('ok')
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
      setStatus('ok')
    }
  }

  if (status === 'checking') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="card success">
            <h2>Checking your reset link…</h2>
            <p>One moment while we verify this link.</p>
          </div>
        </main>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="card success">
            <div className="check warn">!</div>
            <h2>Invalid reset link</h2>
            <p>
              This password reset link isn’t valid. Please request a new one.
            </p>
            <p className="alt-link">
              <Link to="/forgotPassword">Request a new link</Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (status === 'checkError') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="card success">
            <div className="check warn">!</div>
            <h2>Couldn’t verify your link</h2>
            <p>Could not reach the server. Is the backend running on :8000?</p>
            <p className="alt-link">
              <Link to="/forgotPassword">Back to Forgot password</Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="card success">
            <div className="check">✓</div>
            <h2>Password updated</h2>
            <p>You can now sign in with your new password.</p>
            <p className="alt-link">
              <Link to="/login">Back to login</Link>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card">
          <h1 className="title">Reset your password</h1>
          <p className="subtitle">
            Enter your email and choose a new password.
          </p>

          {banner && (
            <div className="banner" role="alert">
              {banner}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Email */}
            <div className={`field ${errors.email.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="email">
                <span>Email</span>
              </label>
              <div className="input-row">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </div>
              {errors.email.length > 0 && (
                <ul className="errlist">
                  {errors.email.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* 2. New password */}
            <div
              className={`field ${errors.newPassword.length ? 'invalid' : ''}`}
            >
              <label className="label" htmlFor="newPassword">
                <span>New password</span>
                <button
                  type="button"
                  className="peek"
                  onClick={toggle('newPassword')}
                  tabIndex={-1}
                >
                  {show.newPassword ? 'hide' : 'show'}
                </button>
              </label>
              <div className="input-row">
                <input
                  id="newPassword"
                  type={show.newPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={update('newPassword')}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
              </div>
              {errors.newPassword.length > 0 && (
                <ul className="errlist">
                  {errors.newPassword.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. Confirm password */}
            <div
              className={`field ${errors.confirmPassword.length ? 'invalid' : ''}`}
            >
              <label className="label" htmlFor="confirmPassword">
                <span>Confirm password</span>
                <button
                  type="button"
                  className="peek"
                  onClick={toggle('confirmPassword')}
                  tabIndex={-1}
                >
                  {show.confirmPassword ? 'hide' : 'show'}
                </button>
              </label>
              <div className="input-row">
                <input
                  id="confirmPassword"
                  type={show.confirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword.length > 0 && (
                <ul className="errlist">
                  {errors.confirmPassword.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              className={`submit ${status === 'loading' ? 'loading' : ''}`}
              disabled={status === 'loading'}
            >
              Update password
            </button>
          </form>

          <p className="alt-link">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
