import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const ran = useRef(false) // guard against StrictMode double-invoke (would 'use up' the token twice)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function verify() {
      try {
        const res = await fetch(`/pulse/users/verifyEmail/${token}`, {
          method: 'POST',
          credentials: 'include',
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

        const msg = data.message || ''
        if (res.status === 401 && /expired/i.test(msg)) {
          navigate(`/verification-expired/${token}`)
          return
        }
        if (res.status === 401 && /used/i.test(msg)) {
          navigate('/already-verified')
          return
        }
        if (res.status === 403) {
          navigate('/verification-invalid')
          return
        }

        setError(msg || 'Could not verify your email.')
      } catch {
        setError('Could not reach the server. Is the backend running on :8000?')
      }
    }

    verify()
  }, [token, navigate])

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card success">
          {!error ? (
            <>
              <h2>Verifying…</h2>
              <p className="subtitle">
                Please wait while we verify your email.
              </p>
            </>
          ) : (
            <>
              <div className="check bad">!</div>
              <h2>Verification failed</h2>
              <p>{error}</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
