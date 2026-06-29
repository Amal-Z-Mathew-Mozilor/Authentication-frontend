import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import { apiFetch } from './apiFetch.js'
import './signup.css'

const EMPTY_ERRORS = { oldPassword: [], newPassword: [], confirmPassword: [] }

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState(EMPTY_ERRORS)   // 422 field errors
  const [banner, setBanner] = useState(null)           // 400 message from backend
  const [status, setStatus] = useState('idle')         // idle | loading | done
  const [show, setShow] = useState({ oldPassword: false, newPassword: false, confirmPassword: false })

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
      const res = await apiFetch('/pulse/users/changePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      let data = {}
      try { data = await res.json() } catch { /* keep {} */ }

      if (res.ok) {
        setStatus('done')
        return
      }

      // not authenticated → back to login
      if (res.status === 401 || res.status === 403) {
        navigate('/login')
        return
      }

      // 422 — changePasswordValidator: group messages by field
      if (res.status === 422 && Array.isArray(data.errors)) {
        const grouped = { oldPassword: [], newPassword: [], confirmPassword: [] }
        for (const er of data.errors) {
          if (grouped[er.path]) grouped[er.path].push(er.msg)
        }
        setErrors(grouped)
        setStatus('idle')
        return
      }

      // 400 — old mismatch / new≠confirm / same-as-old — show backend message
      setBanner(data.message || 'Could not change your password.')
      setStatus('idle')
    } catch {
      setBanner('Could not reach the server. Is the backend running on :8000?')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className="page">
        <Header account />
        <main className="main">
          <div className="card success">
            <div className="check">✓</div>
            <h2>Password changed</h2>
            <p>Your password has been updated successfully.</p>
            <p className="alt-link"><Link to="/home">Back to home</Link></p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <Header account />
      <main className="main">
        <div className="card">
          <h1 className="title">Change password</h1>
          <p className="subtitle">Enter your current password and choose a new one.</p>

          {banner && <div className="banner" role="alert">{banner}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Old password */}
            <div className={`field ${errors.oldPassword.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="oldPassword">
                <span>Current password</span>
                <button type="button" className="peek" onClick={toggle('oldPassword')} tabIndex={-1}>
                  {show.oldPassword ? 'hide' : 'show'}
                </button>
              </label>
              <div className="input-row">
                <input
                  id="oldPassword"
                  type={show.oldPassword ? 'text' : 'password'}
                  value={form.oldPassword}
                  onChange={update('oldPassword')}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
              </div>
              {errors.oldPassword.length > 0 && (
                <ul className="errlist">{errors.oldPassword.map((m, i) => <li key={i}>{m}</li>)}</ul>
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

            {/* 3. Confirm new password */}
            <div className={`field ${errors.confirmPassword.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="confirmPassword">
                <span>Confirm new password</span>
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
              Change password
            </button>
          </form>

          <p className="alt-link"><Link to="/home">Back to home</Link></p>
        </div>
      </main>
    </div>
  )
}
