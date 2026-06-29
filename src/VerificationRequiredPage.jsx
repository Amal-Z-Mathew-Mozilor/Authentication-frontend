import { useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import './signup.css'

export default function VerificationRequiredPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card success">
          <div className="check warn">✉</div>
          <h2>Verify your email</h2>
          <p>Your email isn't verified yet. Please check your inbox for the verification link.</p>
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
