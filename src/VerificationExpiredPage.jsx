import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

export default function VerificationExpiredPage() {
  const { token } = useParams()
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
      const res = await fetch(`/pulse/users/resend/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verifyBase: `${window.location.origin}/verify`,
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

      // 400 — invalid token / already verified, etc.
      setToast({
        message: data.message || 'Could not resend the verification email.',
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
            <h2>Verification email sent</h2>
            <p>A new verification email has been sent.</p>
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
          <h2>Verification link expired</h2>
          <p>This verification link has expired. Request a new one below.</p>
          <button
            type="button"
            className="submit resend-btn"
            onClick={handleResend}
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
      </main>
    </div>
  )
}
