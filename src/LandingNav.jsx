import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LandingNav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="lnav">
      <div className="lnav-inner">
        <a className="lnav-logo" href="#top" onClick={close}>
          <span className="lnav-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12 h5 l2 -6 l3 12 l2 -6 h8" />
            </svg>
          </span>
          <span className="lnav-name">Pulse</span>
        </a>

        <button
          type="button"
          className="lnav-burger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`lnav-links ${open ? 'open' : ''}`}>
          <a href="#top" onClick={close}>
            Home
          </a>
          <a href="#features" onClick={close}>
            Features
          </a>
          <a href="#about" onClick={close}>
            About
          </a>
          <a href="#contact" onClick={close}>
            Contact
          </a>
          <Link to="/login" className="lnav-signin" onClick={close}>
            Sign In
          </Link>
          <Link to="/signup" className="lnav-signup" onClick={close}>
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  )
}
