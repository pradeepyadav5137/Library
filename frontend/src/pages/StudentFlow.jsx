

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api' 
import './StudentFlow.css'

export default function StudentFlow() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // Verification state
  const [rollNo, setRollNo] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationSubstep, setVerificationSubstep] = useState('rollno') // 'rollno' or 'otp'
  const [email, setEmail] = useState('') 

  // --- TOAST STATE ---
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 1. NUCLEAR CLEAR ON LOAD
  useEffect(() => {
    console.log("Initializing Student Flow: Wiping previous session data...");
    localStorage.clear();
    sessionStorage.clear();
    authAPI.logout(); // Clear cookie
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)

    // 2. DOUBLE SAFETY CLEAR
    localStorage.removeItem('token');
    localStorage.removeItem('rollNo'); 
    localStorage.removeItem('email');
    localStorage.removeItem('studentFormData');

    try {
      // Send OTP Request
      await authAPI.sendOTP({ rollNo: rollNo.trim(), userType: 'student' })
      
      const generatedEmail = `${rollNo.trim().toLowerCase()}@nitt.edu`;
      setEmail(generatedEmail);
      
      // Show Success Toast
      showToast(`OTP sent to ${generatedEmail}`, 'success');
      
      // Move to OTP step
      setVerificationSubstep('otp')
    } catch (err) {
      console.error("Send OTP Error:", err);
      showToast(err.message || 'Failed to send OTP', 'error');
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Verify OTP with backend
      const res = await authAPI.verifyEmail({
        email: email,
        otp: otp.trim(),
        userType: 'student'
      })
      
      console.log("Verification Successful. Saving new session data for:", rollNo);
      
      // 1. Save Token (COOKIE IS SET BY BACKEND NOW)
      // localStorage.setItem('token', res.token);
      localStorage.setItem('userType', 'student');
      
      // 2. Save Identity
      localStorage.setItem('rollNo', rollNo.trim().toLowerCase()); 
      localStorage.setItem('email', res.email);
      
      // 3. WIPE any old form data specifically
      localStorage.removeItem('studentFormData');

      showToast("Verification Successful! Redirecting...", 'success');

      // Redirect to the separate form page
      setTimeout(() => {
        navigate('/student-form');
      }, 500); // Small delay so user sees the success toast

    } catch (err) {
      console.error("Verify OTP Error:", err);
      showToast(err.message || 'Invalid OTP', 'error');
    }
    setLoading(false)
  }

  return (
    <div className="form-container student-flow">
      
      {/* --- TOAST COMPONENT --- */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.message}
        </div>
      )}

      <div className="form-card">
        <h2>Student – Verification</h2>
        <p className="form-description">Enter your roll number. OTP will be sent to your institute webmail.</p>
        
        {verificationSubstep === 'rollno' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Roll Number *</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. 205124040"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>OTP sent to {email}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button" 
              onClick={() => { 
                setVerificationSubstep('rollno'); 
                setOtp(''); 
                setRollNo(''); 
              }} 
              className="btn btn-secondary"
              style={{marginTop: '10px'}}
            >
              Change roll number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}