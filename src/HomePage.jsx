import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import { apiFetch } from './apiFetch.js'
import './signup.css'

const ME_URL = '/pulse/users/me'

export default function HomePage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('loading')   // loading | ready | error
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let active = true

    async function loadUser() {
      try {
        const res = await apiFetch(ME_URL, { method: 'POST' })

        if (res.status === 401 || res.status === 403) {
          // not authenticated (missing/expired/invalid token) or revoked → back to login
          if (active) navigate('/login')
          return
        }

        let data = {}
        try { data = await res.json() } catch { /* keep {} */ }

        if (!active) return

        if (res.ok) {
          // /me returns the email as `data` (string); tolerate an object too
          const value = typeof data.data === 'string' ? data.data : data.data?.email
          setEmail(value || '')
          setStatus('ready')
          return
        }

        setStatus('error')
        setToast({ message: data.message || 'Could not load your account.' })
      } catch {
        if (!active) return
        setStatus('error')
        setToast({ message: 'Could not reach the server. Is the backend running on :8000?' })
      }
    }

    loadUser()
    return () => { active = false }
  }, [navigate])

  return (
    <div className="page">
      <Header account />

      {toast && (
        <div className="toast" role="alert" onClick={() => setToast(null)}>
          <span className="toast-icon">!</span>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="main">
        <div className="card home-card">
          {status === 'loading' && <p className="subtitle">Loading…</p>}

          {status === 'ready' && (
            <>
              <h1 className="title">Welcome,</h1>
              <p className="mail">{email}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="title">Welcome</h1>
              <p className="subtitle">We couldn't load your account details.</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
