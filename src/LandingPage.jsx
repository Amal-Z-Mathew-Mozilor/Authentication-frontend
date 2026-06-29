import { Link } from 'react-router-dom'
import LandingNav from './LandingNav.jsx'
import Footer from './Footer.jsx'
import './signup.css'   // design tokens + reusable classes
import './landing.css'

const FEATURES = [
  {
    title: 'Secure passwords',
    desc: 'Passwords are hashed with bcrypt and never stored in plain text — strong by default.',
    icon: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  },
  {
    title: 'Email verification',
    desc: 'Every new account confirms ownership through a secure, single-use verification link.',
    icon: <><path d="M3 7l9 6 9-6" /><rect x="3" y="5" width="18" height="14" rx="2" /></>,
  },
  {
    title: 'Brute-force protection',
    desc: 'Per-account and per-IP limits lock out repeated failed attempts automatically.',
    icon: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  },
  {
    title: 'Password recovery',
    desc: 'Self-service reset flow with expiring tokens and one-click resend if a link lapses.',
    icon: <><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>,
  },
  {
    title: 'Token sessions',
    desc: 'Short-lived access tokens with refresh rotation and instant revocation on logout.',
    icon: <><circle cx="8" cy="12" r="3" /><path d="M11 12h10M18 9v6" /></>,
  },
  {
    title: 'Modern stack',
    desc: 'A clean React + Express foundation you can drop into any product in minutes.',
    icon: <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />,
  },
]

export default function LandingPage() {
  return (
    <div className="landing" id="top">
      <LandingNav />

      {/* hero */}
      <section className="hero">
        <div className="hero-orbits" aria-hidden="true"><span /><span /><span /></div>
        <div className="hero-inner">
          <h1>Welcome to <span className="accent">Pulse</span></h1>
          <p>Secure authentication for modern apps — sign-up, email verification, account
            protection, and password recovery, ready out of the box.</p>
          <div className="hero-cta">
            <Link to="/signup" className="lbtn lbtn-primary">Get Started</Link>
            <a href="#features" className="lbtn lbtn-ghost">Learn More</a>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="lsection" id="features">
        <h2 className="lsection-title">Everything you need to authenticate</h2>
        <p className="lsection-sub">A complete, production-ready auth layer — so you can focus on
          your product, not on security plumbing.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article className="feature-card" key={f.title}>
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">{f.icon}</svg>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* why choose us */}
      <section className="why" id="about">
        <div className="why-inner">
          <div>
            <h2>Why choose Pulse?</h2>
            <p>Pulse handles the hard parts of authentication so your team doesn't have to —
              with sensible defaults and security baked in at every step.</p>
            <ul className="why-list">
              <li><span className="tick">✓</span> bcrypt password hashing &amp; strict policy</li>
              <li><span className="tick">✓</span> Verified emails before first login</li>
              <li><span className="tick">✓</span> Account lockout &amp; IP rate limiting</li>
              <li><span className="tick">✓</span> Expiring reset &amp; verification tokens</li>
            </ul>
            <div className="why-stats">
              <div className="why-stat"><div className="num">12+</div><div className="lbl">char passwords</div></div>
              <div className="why-stat"><div className="num">JWT</div><div className="lbl">+ refresh rotation</div></div>
              <div className="why-stat"><div className="num">5</div><div className="lbl">try lockout</div></div>
            </div>
          </div>
          <div className="why-visual" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lsection lcta">
        <div className="lcta-box">
          <h2>Ready to get started?</h2>
          <p>Create your Pulse account in seconds, or sign in to pick up where you left off.</p>
          <div className="lcta-buttons">
            <Link to="/signup" className="lbtn lbtn-primary">Sign Up</Link>
            <Link to="/login" className="lbtn lbtn-ghost">Sign In</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
