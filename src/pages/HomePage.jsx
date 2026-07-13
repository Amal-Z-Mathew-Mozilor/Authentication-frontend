import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { apiFetch } from '../lib/apiFetch.js'
import '../styles/signup.css'

const ME_URL = '/pulse/users/me'

/**
 * /home dashboard page — POSTs /pulse/users/me via apiFetch to load the current user's email, redirects to /login on 401/403, and renders the Account header with the email or an error state.
 * @returns {JSX.Element}
 */
export default function HomePage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('loading') // loading | ready | error
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
        try {
          data = await res.json()
        } catch {
          /* keep {} */
        }

        if (!active) return

        if (res.ok) {
          // /me returns the email as `data` (string); tolerate an object too
          const value =
            typeof data.data === 'string' ? data.data : data.data?.email
          setEmail(value || '')
          setStatus('ready')
          return
        }

        setStatus('error')

        setToast({ message: data.message || 'Could not load your account.' })
      } catch {
        if (!active) return
        setStatus('error')
        setToast({
          message:
            'Could not reach the server. Is the backend running on :8000?',
        })
      }
    }

    loadUser()
    return () => {
      active = false
    }
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
