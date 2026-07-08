import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage.jsx'
import SignupPage from './SignupPage.jsx'
import LoginPage from './LoginPage.jsx'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'
import ResetPasswordPage from './ResetPasswordPage.jsx'
import ResetExpiredPage from './ResetExpiredPage.jsx'
import HomePage from './HomePage.jsx'
import VerifyEmailPage from './VerifyEmailPage.jsx'
import ChangePasswordPage from './ChangePasswordPage.jsx'
import WebManagerPage from './WebManagerPage.jsx'
import CookiePolicyPage from './CookiePolicyPage.jsx'
import VerifiedAlreadyPage from './VerifiedAlreadyPage.jsx'
import VerificationExpiredPage from './VerificationExpiredPage.jsx'
import VerificationInvalidPage from './VerificationInvalidPage.jsx'
import VerificationRequiredPage from './VerificationRequiredPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/resetPassword/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-expired/:token" element={<ResetExpiredPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/verify/:token" element={<VerifyEmailPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/web-manager" element={<WebManagerPage />} />
        <Route
          path="/cookie-policy/:websiteId"
          element={<CookiePolicyPage />}
        />
        <Route path="/already-verified" element={<VerifiedAlreadyPage />} />
        <Route
          path="/verification-expired/:token"
          element={<VerificationExpiredPage />}
        />
        <Route
          path="/verification-invalid"
          element={<VerificationInvalidPage />}
        />
        <Route
          path="/verification-required"
          element={<VerificationRequiredPage />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
