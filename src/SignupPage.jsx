import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

const SIGNUP_URL = '/pulse/users/signup'

// Mirrors the backend registerValidator() password policy, for the live checklist.
const PASSWORD_RULES = [
  { key: 'len', label: '12+ characters', test: (v) => v.length >= 12 },
  { key: 'upper', label: 'Uppercase', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Lowercase', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'Number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'Special char', test: (v) => /[!@#$%^&*()_\-+={[}\]|\\:;"'<>,.?/~`]/.test(v) },
  { key: 'space', label: 'No spaces', test: (v) => v.length > 0 && /^\S+$/.test(v) },
]

const EMPTY_ERRORS = { email: [], password: [] }

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState(EMPTY_ERRORS)
  const [toast, setToast] = useState(null)        
  const [status, setStatus] = useState('idle')    
  const [successMsg, setSuccessMsg] = useState('')
  const [showPw, setShowPw] = useState(false)



 useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]?.length) setErrors((prev) => ({ ...prev, [key]: [] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrors(EMPTY_ERRORS)
    setToast(null)

    try {
      const res = await fetch(SIGNUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, verifyBase: `${window.location.origin}/verify` }),
      })

      let data = {}
      try { data = await res.json() } catch { /* keep {} */ }

      if (res.ok) {
        setSuccessMsg(data.message || 'Account created. Please verify your email.')
        setStatus('success')
        return
      }

      // 422 — validation middleware: group every message by field
      if (res.status === 422 && Array.isArray(data.errors)) {
        const grouped = { email: [], password: [] }
        for (const err of data.errors) {
          if (grouped[err.path]) grouped[err.path].push(err.msg)
        }
        setErrors(grouped)
        setStatus('idle')
        return
      }

      // 400 "email already exist" — show a toast, keep the form intact
      if (res.status === 400 && /email/i.test(data.message || '')) {
        setToast({ message: data.message || 'Email already exists.' })
        setStatus('idle')
        return
      }

      // anything else — generic toast
      setToast({ message: data.message || 'Something went wrong. Please try again.' })
      setStatus('idle')
    } catch {
      setToast({ message: 'Could not reach the server. Is the backend running on :8000?' })
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="card success">
            <div className="check">✓</div>
            <h2>You're all set</h2>
            <p>{successMsg}</p>
            <p className="mail">{form.email}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <Header />

      {toast && (
        <div className="toast" role="alert" onClick={() => setToast(null)}>
          <span className="toast-icon">!</span>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="main">
      <div className="card">
        <h1 className="title">Create your account</h1>
        <p className="subtitle">
          Already have one? <Link to="/login">Sign in</Link>
        </p>

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
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="policy" aria-hidden="true">
              {PASSWORD_RULES.map((rule) => (
                <span key={rule.key} className={rule.test(form.password) ? 'met' : ''}>
                  {rule.label}
                </span>
              ))}
            </div>

            {errors.password.length > 0 && (
              <ul className="errlist">
                {errors.password.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            )}
          </div>

          <button
            type="submit"
            className={`submit ${status === 'loading' ? 'loading' : ''}`}
            disabled={status === 'loading'}
          >
            Create account
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

function Field({ id, label, hint, errors = [], ...props }) {
  return (
    <div className={`field ${errors.length ? 'invalid' : ''}`}>
      <label className="label" htmlFor={id}>
        <span>{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </label>
      <div className="input-row">
        <input id={id} {...props} />
      </div>
      {errors.length > 0 && (
        <ul className="errlist">
          {errors.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      )}
    </div>
  )
}
