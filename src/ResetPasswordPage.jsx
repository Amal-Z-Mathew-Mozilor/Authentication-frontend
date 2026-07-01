import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

const EMPTY_ERRORS = { email: [], newPassword: [], confirmPassword: [] }

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState(EMPTY_ERRORS)   // 422 field errors
  const [banner, setBanner] = useState(null)           // 400/401/403 message from backend
  const [status, setStatus] = useState('idle')         // idle | loading | done
  const [show, setShow] = useState({ newPassword: false, confirmPassword: false })

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
      try { data = await res.json() } catch { /* keep {} */ }

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
        setStatus('idle')
        return
      }

      // Expired / already-used reset token → go to the resend page (resend can still work).
      // Pass the reason so the page shows the right wording.
      if (res.status === 401 && /(expired|used)/i.test(data.message || '')) {
        const reason = /used/i.test(data.message) ? 'used' : 'expired'
        navigate(`/reset-expired/${token}`, { state: { reason } })
        return
      }

      // 400 (match / same-as-old / invalid credential) and 403 "Invalid Token" — show message
      setBanner(data.message || 'Could not reset your password.')
      setStatus('idle')
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
      setStatus('idle')
    }
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
            <p className="alt-link"><Link to="/login">Back to login</Link></p>
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
          <p className="subtitle">Enter your email and choose a new password.</p>

          {banner && <div className="banner" role="alert">{banner}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Email */}
            <div className={`field ${errors.email.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="email"><span>Email</span></label>
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
                <ul className="errlist">{errors.email.map((m, i) => <li key={i}>{m}</li>)}</ul>
              )}
            </div>

            {/* 2. New password */}
            <div className={`field ${errors.newPassword.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="newPassword">
                <span>New password</span>
                <button type="button" className="peek" onClick={toggle('newPassword')} tabIndex={-1}>
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
                <ul className="errlist">{errors.newPassword.map((m, i) => <li key={i}>{m}</li>)}</ul>
              )}
            </div>

            {/* 3. Confirm password */}
            <div className={`field ${errors.confirmPassword.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="confirmPassword">
                <span>Confirm password</span>
                <button type="button" className="peek" onClick={toggle('confirmPassword')} tabIndex={-1}>
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
                <ul className="errlist">{errors.confirmPassword.map((m, i) => <li key={i}>{m}</li>)}</ul>
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

          <p className="alt-link"><Link to="/login">Back to login</Link></p>
        </div>
      </main>
    </div>
  )
}
