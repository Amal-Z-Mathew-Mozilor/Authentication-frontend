import Header from './Header.jsx'
import './signup.css'

export default function VerificationInvalidPage() {
  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="card success">
          <div className="check bad">!</div>
          <h2>Invalid verification link</h2>
          <p>
            This verification link isn't valid. Please sign up again to receive
            a new one.
          </p>
        </div>
      </main>
    </div>
  )
}
