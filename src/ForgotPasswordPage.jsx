import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

const FORGOT_URL = '/pulse/users/forgotPassword'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState([])
  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | sent
  const [sentMsg, setSentMsg] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleSubmit(e) {
    e.preventDefault()
    setToast(null)

    // Email is validated by the backend (forgotPasswordEmail validator → 422); no client check.
    setErrors([])
    setStatus('loading')

    try {
      const res = await fetch(FORGOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          resetBase: `${window.location.origin}/resetPassword`,
        }),
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        /* keep {} */
      }

      if (res.ok) {
        setSentMsg(
          data.message || 'If the email exists, a reset link has been sent.',
        )
        setStatus('sent')
        return
      }

      // 422 — backend email validator
      if (res.status === 422 && Array.isArray(data.errors)) {
        setErrors(
          data.errors.filter((er) => er.path === 'email').map((er) => er.msg),
        )
        setStatus('idle')
        return
      }

      setToast({
        message: data.message || 'Something went wrong. Please try again.',
      })
      setStatus('idle')
    } catch {
      setToast({
        message: 'Could not reach the server. Is the backend running on :8000?',
      })
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="card success">
            <div className="check">✓</div>
            <h2>Check your inbox</h2>
            <p>{sentMsg}</p>
            <p className="mail">{email}</p>
            <p className="alt-link">
              <Link to="/signup">Back to sign up</Link>
            </p>
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
          <h1 className="title">Forgot password?</h1>
          <p className="subtitle">
            Enter your email and we'll send you a link to reset it.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={`field ${errors.length ? 'invalid' : ''}`}>
              <label className="label" htmlFor="email">
                <span>Email</span>
              </label>
              <div className="input-row">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.length) setErrors([])
                  }}
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </div>
              {errors.length > 0 && (
                <ul className="errlist">
                  {errors.map((msg, i) => (
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
              Send reset link
            </button>
          </form>

          <p className="alt-link">
            <Link to="/signup">Back to sign up</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
