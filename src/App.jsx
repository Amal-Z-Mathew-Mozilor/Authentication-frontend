import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import ResetExpiredPage from './pages/ResetExpiredPage.jsx'
import HomePage from './pages/HomePage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'
import WebManagerPage from './pages/WebManagerPage.jsx'
import CookiePolicyPage from './pages/CookiePolicyPage.jsx'
import PolicyPreviewPage from './pages/PolicyPreviewPage.jsx'
import VerifiedAlreadyPage from './pages/VerifiedAlreadyPage.jsx'
import VerificationExpiredPage from './pages/VerificationExpiredPage.jsx'
import VerificationInvalidPage from './pages/VerificationInvalidPage.jsx'
import VerificationRequiredPage from './pages/VerificationRequiredPage.jsx'

/**
 * Application root — holds the BrowserRouter and declares every route in the app.
 * @returns {JSX.Element}
 */
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
          path="/cookie-policy/:websiteId/preview"
          element={<PolicyPreviewPage />}
        />
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
