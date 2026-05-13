import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api' 
import './Admin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState('email')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const [loginStep, setLoginStep] = useState(1) // 1: credentials, 2: otp
  const [resendTimer, setResendTimer] = useState(0)
  const resendIntervalRef = useRef(null)

  const startResendTimer = () => {
    setResendTimer(60)
    clearInterval(resendIntervalRef.current)
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => clearInterval(resendIntervalRef.current)
  }, [])

  const handleSubmitStep1 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await adminAPI.loginStep1(username, password)
      if (response.require2fa) {
        setLoginStep(2)
        startResendTimer()
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    }
    setLoading(false)
  }

  const handleSubmitStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await adminAPI.loginStep2(username, otp)
      localStorage.setItem('adminUser', JSON.stringify(response.admin))
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    }
    setLoading(false)
  }

  const handleResendLoginOtp = async () => {
    if (resendTimer > 0) return
    setError('')
    setLoading(true)
    try {
      await adminAPI.loginStep1(username, password)
      startResendTimer()
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.')
    }
    setLoading(false)
  }

  const handleForgotSendOtp = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      await adminAPI.forgotPassword(forgotEmail.trim())
      setForgotStep('otp')
      startResendTimer()
    } catch (err) {
      setForgotError(err.message || 'Failed to send OTP. Please check the email.')
    }
    setForgotLoading(false)
  }

  const handleResendForgotOtp = async () => {
    if (resendTimer > 0) return
    setForgotError('')
    setForgotLoading(true)
    try {
      await adminAPI.forgotPassword(forgotEmail.trim())
      startResendTimer()
    } catch (err) {
      setForgotError(err.message || 'Failed to resend OTP.')
    }
    setForgotLoading(false)
  }

  const handleForgotReset = async (e) => {
    e.preventDefault()
    setForgotError('')
    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters')
      return
    }
    setForgotLoading(true)
    try {
      await adminAPI.resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword)
      setShowForgot(false)
      setForgotStep('email')
      setForgotEmail('')
      setForgotOtp('')
      setNewPassword('')
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password. Please try again.')
    }
    setForgotLoading(false)
  }

  return (
    <div className="form-containers admin-login">
      <div className="form-card" style={{ maxWidth: '450px' }}>
        <div className="login-header">
          <h2>Admin Login</h2>
          <p className="form-description">
            Access the ID Card Application Management System
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!showForgot && loginStep === 1 && (
          <form onSubmit={handleSubmitStep1}>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                disabled={loading}
              />
              <small>Contact existing admin if you don't have an account</small>
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            
            <div className="button-group" style={{ marginTop: '25px' }}>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Authenticating...
                  </>
                ) : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgot(!showForgot)}
                className="btn btn-secondary"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {!showForgot && loginStep === 2 && (
          <form onSubmit={handleSubmitStep2}>
            <div className="form-group">
              <label>OTP Sent to registered email *</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                disabled={loading}
                className="otp-input"
              />
              <small>Check your admin email for the 2FA code</small>
              <div style={{ marginTop: '8px' }}>
                {resendTimer > 0 ? (
                  <small style={{ color: '#888' }}>Resend OTP in {resendTimer}s</small>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendLoginOtp}
                    disabled={loading}
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '13px' }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <div className="button-group" style={{ marginTop: '25px' }}>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Verifying...
                  </>
                ) : 'Verify and Login'}
              </button>
              <button
                type="button"
                onClick={() => setLoginStep(1)}
                className="btn btn-secondary"
              >
                ↶ Back
              </button>
            </div>
          </form>
        )}

        {showForgot && (
          <div className="forgot-password-form" style={{ marginTop: '30px' }}>
            <h3>Reset Password</h3>
            <p className="form-description">
              Enter your admin email to receive OTP for password reset
            </p>
            
            {forgotError && <div className="error-message">{forgotError}</div>}
            
            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotSendOtp}>
                <div className="form-group">
                  <label>Admin Email *</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    disabled={forgotLoading}
                  />
                  <small>Must be a registered admin email</small>
                </div>
                <div className="button-group" style={{ marginTop: '20px' }}>
                  <button type="submit" disabled={forgotLoading} className="btn btn-primary">
                    {forgotLoading ? (
                      <>
                        <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                        Sending OTP...
                      </>
                    ) : 'Send OTP to Email'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="btn btn-secondary"
                  >
                    ↶ Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotReset}>
                <div className="form-group">
                  <label>OTP Sent to {forgotEmail}</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    disabled={forgotLoading}
                    className="otp-input"
                  />
                  <small>Check your email for the verification code</small>
                  <div style={{ marginTop: '8px' }}>
                    {resendTimer > 0 ? (
                      <small style={{ color: '#888' }}>Resend OTP in {resendTimer}s</small>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendForgotOtp}
                        disabled={forgotLoading}
                        className="btn btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '13px' }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                    disabled={forgotLoading}
                  />
                  <small>Choose a strong, memorable password</small>
                </div>
                <div className="button-group" style={{ marginTop: '20px' }}>
                  <button type="submit" disabled={forgotLoading} className="btn btn-primary">
                    {forgotLoading ? (
                      <>
                        <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                        Resetting Password...
                      </>
                    ) : 'Reset Password'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setForgotStep('email')} 
                    className="btn btn-secondary"
                  >
                    ↩ Try Different Email
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="login-footer">
          <p className="security-note">
            <strong>🔒 Security Notice:</strong> This system is for authorized personnel only.
            Unauthorized access is prohibited.
          </p>
          <p className="help-text">
            Need help? Contact system administrator at <strong> 205124066@nitt.edu</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
