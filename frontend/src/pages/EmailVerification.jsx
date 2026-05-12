import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authAPI } from '../services/api'
import StepIndicator from '../components/StepIndicator'
import './StudentFlow.css'

const STUDENT_STEPS = ['Verify Email', 'Student Form', 'Upload Documents', 'Preview & Submit'];

export default function EmailVerification() {
  const { userType } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Determine if it's a student or faculty/staff
  const isStudent = userType === 'student'

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const emailToSend = isStudent ? `${rollNo}@nitt.edu` : email
      
      // Send proper JSON object instead of just string
      const payload = {
        email: emailToSend,
        rollNo: isStudent ? rollNo : null,
        userType: userType
      }
      
      await authAPI.sendOTP(payload)
      
      if (isStudent) {
        setEmail(emailToSend)
      }
      
      setStep(2)
      startResendTimer()
    } catch (err) {
      console.error("Send OTP Error:", err); // Added for easier debugging
      setError(err.message || 'Failed to send OTP. Please try again.')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const emailToVerify = isStudent ? email : email
      const response = await authAPI.verifyEmail(emailToVerify, otp, userType)
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('email', emailToVerify)
      localStorage.setItem('userType', userType)
      
      if (isStudent) {
        localStorage.setItem('rollNo', rollNo)
      }

      // Navigate to appropriate form
      const formPath = {
        student: '/student-form',
        faculty: '/faculty-form',
        staff: '/faculty-form'
      }[userType]

      navigate(formPath)
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    }
    setLoading(false)
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return
    
    setLoading(true)
    setError('')
    
    try {
      // Send proper JSON object
      const payload = {
        email: email,
        rollNo: isStudent ? rollNo : null,
        userType: userType
      }
      
      await authAPI.sendOTP(payload)
      setOtp('')
      startResendTimer()
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.')
    }
    setLoading(false)
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <div className="form-container">
      {isStudent && (
        <StepIndicator
          current={1}
          total={STUDENT_STEPS.length}
          labels={STUDENT_STEPS}
        />
      )}

      <div className="form-card">
        {/* Header */}
        <h2>Email Verification</h2>
        <p className="form-description">
          {isStudent 
            ? 'Enter your Roll Number to receive OTP on your institute email'
            : 'Enter your institute email to receive verification OTP'
          }
        </p>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Enter Email/Roll Number */}
        {step === 1 && (
          <>
            {/* Info Box - Now matches Faculty structure (outside form) */}
            <div className="info-box">
              {isStudent ? (
                <>
                  <h4>Roll Number Verification</h4>
                  <ul>
                    <li>Enter your institute roll number</li>
                    <li>OTP will be sent to: <strong>{rollNo ? `${rollNo}@nitt.edu` : 'rollnumber@nitt.edu'}</strong></li>
                    <li>OTP is valid for 5 minutes</li>
                  </ul>
                </>
              ) : (
                <>
                  <h4>Email Verification Instructions:</h4>
                  <ul>
                    <li>Use your institute email address (@nitt.edu)</li>
                    <li>A 6-digit OTP will be sent to your email</li>
                    <li>OTP is valid for 5 minutes</li>
                    <li style={{color: '#e53e3e', fontWeight: 'bold'}}>Do NOT use Student Roll No email</li>
                  </ul>
                </>
              )}
            </div>

            <form onSubmit={handleSendOTP}>
              {isStudent ? (
                <div className="form-group">
                  <label htmlFor="rollNo">
                    Roll Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="rollNo"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.trim())}
                    placeholder="e.g., 106121001"
                    required
                    autoFocus
                  />
                  {rollNo && (
                    <small>Email: {rollNo}@nitt.edu</small>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="email">
                    Institute Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    placeholder="your.name@nitt.edu"
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="button-group">
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span> Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-secondary"
                >
                  Back to Home
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="success-message">
              OTP has been sent to <strong>{email}</strong>
            </div>

            <div className="info-box">
              <h4>Enter Verification Code</h4>
              <ul>
                <li>Check your email inbox for the 6-digit OTP</li>
                <li>OTP expires in 5 minutes</li>
                <li>Didn't receive? Check spam folder</li>
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="otp">
                Enter 6-digit OTP <span className="required">*</span>
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                className="otp-input"
                required
                autoFocus
              />
            </div>

            <div className="button-group">
              <button type="submit" disabled={loading || otp.length !== 6} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="loading-spinner"></span> Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setOtp('')
                  setError('')
                }}
                className="btn btn-secondary"
              >
                Change {isStudent ? 'Roll Number' : 'Email'}
              </button>
            </div>

            {/* Resend OTP */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize: '14px', color: '#4a5568' }}>
                  Resend OTP in <strong>{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2c5282',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}