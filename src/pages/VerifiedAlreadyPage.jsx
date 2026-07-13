import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import '../styles/signup.css'

/**
 * /already-verified status page — informs the user their email is already verified and links back to sign up.
 * @returns {JSX.Element}
 */
export default function VerifiedAlreadyPage() {
  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card success">
          <div className="check">✓</div>
          <h2>Email already verified</h2>
          <p>
            Your email address has already been verified. You can sign in to
            your account.
          </p>
          <p className="alt-link">
            <Link to="/signup">Back to sign up</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
