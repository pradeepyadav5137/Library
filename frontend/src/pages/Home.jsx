import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  
  // --- NUCLEAR CLEANUP ON HOME LOAD ---
  useEffect(() => {
    console.log("Home Page: Wiping all verified sessions...");
    
    // 1. Clear Local Storage (Where Token, Email, and Form Data live)
    localStorage.clear();
    
    // 2. Clear Session Storage (Any temporary tabs info)
    sessionStorage.clear();
    
    // 3. Clear any cookie-based tokens (just to be safe)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }, []);
  // -------------------------------------

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Duplicate ID Card Re-issue Portal</h1>
          <p>National Institute of Technology Tiruchirappalli</p>
          <div className="hero-subtitle">
            Select your category to begin the application process
          </div>
        </div>
      </section>

      {/* Role Selection Cards */}
      <section className="role-selection">
        <div className="container">
          <div className="role-cards">
            <Link to="/apply/student" className="role-card">
              <div className="role-card-header">
                <div className="role-icon student-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <h3>Student</h3>
              </div>
              <div className="role-card-body">
                <p>For currently enrolled students seeking duplicate ID card</p>
                <ul className="role-features">
                  <li>Verify with Roll Number</li>
                  <li>B.Tech / M.Tech / Ph.D / Others</li>
                  <li>Online Application</li>
                </ul>
              </div>
              <div className="role-card-footer">
                <span className="apply-arrow">Apply Now →</span>
              </div>
            </Link>
    
            <Link to="/apply/faculty-staff" className="role-card">
              <div className="role-card-header">
                <div className="role-icon faculty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3>Faculty / Staff</h3>
              </div>
              <div className="role-card-body">
                <p>For faculty members and staff employees</p>
                <ul className="role-features">
                  <li>Verify with Institute Email</li>
                  <li>Teaching & Non-Teaching Staff</li>
                  <li>Streamlined Process</li>
                </ul>
              </div>
              <div className="role-card-footer">
                <span className="apply-arrow">Apply Now →</span>
              </div>
            </Link>
          </div>

          {/* Admin Link */}
          <div className="admin-link-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <Link to="/admin-login" className="admin-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Admin Login
            </Link>

            {/* Quick Track Section */}
            <div className="quick-track-card" style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#1a365d', marginBottom: '15px', fontSize: '18px' }}>Quick Track</h3>
              <p style={{ color: '#4a5568', fontSize: '14px', marginBottom: '20px' }}>
                Enter your application ID to check the status of your request.
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const appId = e.target.appId.value.trim();
                if (appId) {
                  window.location.href = `/track/${appId}`;
                }
              }} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  name="appId"
                  placeholder="e.g. NITT-STU-2024-12345"
                  required
                  style={{
                    flex: 1,
                    padding: '10px 15px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#c9a227',
                    color: '#1a365d',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Track
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process Steps */}
      <section className="process-section">
        <div className="container">
          <h2 className="section-title">Application Process</h2>
          <p className="section-subtitle">Follow these simple steps to complete your application</p>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h4>Email Verification</h4>
              <p>Verify your identity using your institute email or roll number</p>
            </div>

            <div className="step-item">
              <div className="step-number">2</div>
              <h4>Fill Application</h4>
              <p>Complete the application form with required details</p>
            </div>

            <div className="step-item">
              <div className="step-number">3</div>
              <h4>Upload Documents</h4>
              <p>Submit necessary documents including FIR copy and photo</p>
            </div>

            <div className="step-item">
              <div className="step-number">4</div>
              <h4>Review & Submit</h4>
              <p>Preview your application and submit for approval</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="requirements-section">
        <div className="container">
          <h2 className="section-title">Required Documents</h2>

          <div className="requirements-grid">
            <div className="requirement-card">
              <div className="req-icon">📸</div>
              <h4>Passport Photo</h4>
              <p>Recent passport-sized photograph (JPG/PNG format, max 5MB)</p>
            </div>

            <div className="requirement-card">
              <div className="req-icon">📄</div>
              <h4>FIR Copy</h4>
              <p>First Information Report or Lost Document Report (If ID Lost) (PDF/Image)</p>
            </div>

            <div className="requirement-card student-only">
              <div className="req-icon">💳</div>
              <h4>Payment Receipt</h4>
              <p>Fee payment receipt - ₹500 (For Students Only)</p>
            </div>
          </div>

          <div className="info-note">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>All documents must be clear and legible. File size should not exceed 5MB per document.</p>
          </div>
        </div>
      </section>
    </div>
  )
}