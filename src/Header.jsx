import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from './apiFetch.js'

export default function Header({ account = false }) {
  return (
    <header className="header">
      <Link className="logo" to="/">
        <span className="logo-badge">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12 h5 l2 -6 l3 12 l2 -6 h8" />
          </svg>
        </span>
        <span className="logo-name">Pulse</span>
      </Link>

      {account && <AccountMenu />}
    </header>
  )
}

function AccountMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    try {
      // POST /logout clears the auth cookies + blacklists the token (needs the accessToken cookie)
      await apiFetch('/pulse/users/logout', { method: 'POST' })
    } catch { /* ignore — redirect to the landing page regardless */ }
    navigate('/')
  }

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="account-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Account <span className="caret">▾</span>
      </button>

      {open && (
        <div className="account-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/change-password') }}
          >
            Change password
          </button>
          <button type="button" role="menuitem" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
