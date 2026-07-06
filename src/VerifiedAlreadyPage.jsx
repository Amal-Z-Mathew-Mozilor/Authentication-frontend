import { Link } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

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
