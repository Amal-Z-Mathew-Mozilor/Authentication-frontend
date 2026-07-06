import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

export default function ResetExpiredPage() {
  const { token } = useParams()
  const { state } = useLocation()
  const used = state?.reason === 'used' // used vs expired → different wording (resend works either way)
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleResend() {
    setStatus('sending')
    setToast(null)
    try {
      const res = await fetch(`/pulse/users/resetResend/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
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
        setStatus('sent')
        return
      }

      setToast({ message: data.message || 'Could not resend the reset email.' })
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
            <h2>Reset email sent</h2>
            <p>A new password reset email has been sent.</p>
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
        <div className="card success">
          <div className="check warn">⏱</div>
          <h2>{used ? 'Reset link already used' : 'Reset link expired'}</h2>
          <p>
            {used
              ? 'This password reset link has already been used. Request a new one below.'
              : 'This password reset link has expired. Request a new one below.'}
          </p>
          <button
            type="button"
            className="submit resend-btn"
            onClick={handleResend}
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : 'Resend reset link'}
          </button>
        </div>
      </main>
    </div>
  )
}
