import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import '../styles/signup.css'

/**
 * /verification-required status page — prompts the user to verify their email, with a button that navigates back to /login.
 * @returns {JSX.Element}
 */
export default function VerificationRequiredPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card success">
          <div className="check warn">✉</div>
          <h2>Verify your email</h2>
          <p>
            Your email isn't verified yet. Please check your inbox for the
            verification link.
          </p>
          <button
            type="button"
            className="submit resend-btn"
            onClick={() => navigate('/login')}
          >
            Back to login
          </button>
        </div>
      </main>
    </div>
  )
}
