import { Link } from 'react-router-dom'

/**
 * Landing-page footer with brand blurb, social links, and quick-link columns.
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="lfooter" id="contact">
      <div className="lfooter-inner">
        <div className="lfooter-brand">
          <span className="lnav-name">Pulse</span>
          <p className="lfooter-tag">
            Secure authentication for modern apps — sign-up, verification, and
            account protection out of the box.
          </p>
          <div className="lfooter-social">
            <a href="#" aria-label="Twitter">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 5.8c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.3 11.3 0 0 1 3.7 4.6a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 3.9c-.6.2-1.2.2-1.8.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.1a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.2z" />
              </svg>
            </a>
            <a href="#" aria-label="GitHub">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.4 4.6-4.6 4.9.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.5 8.5v9M6.5 5.5v.01M11 17.5v-5a2.5 2.5 0 0 1 5 0v5M11 12.5v5" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#about">Why Pulse</a>
          <Link to="/signup">Sign Up</Link>
          <Link to="/login">Sign In</Link>
        </div>

        <div>
          <h4>Quick Links</h4>
          <a href="#top">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div>
          <h4>Contact</h4>
          <a href="mailto:hello@pulse.com">hello@pulse.com</a>
          <a href="#">Support</a>
          <a href="#">Status</a>
        </div>
      </div>

      <div className="lfooter-bottom">
        <span>© 2026 Pulse. All rights reserved.</span>
        <span>
          <a href="#">Privacy Policy</a> &nbsp;·&nbsp;{' '}
          <a href="#">Terms of Service</a>
        </span>
      </div>
    </footer>
  )
}
