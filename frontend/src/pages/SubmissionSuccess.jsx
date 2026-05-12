'use client';

import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { applicationAPI } from '../services/api'
import { generateStudentPDF, generateFacultyStaffPDF } from '../services/pdfGenerator'
import './Success.css'

export default function SubmissionSuccess() {
  const { applicationId } = useParams()
  const location = useLocation()
  const [application, setApplication] = useState(location.state?.application || null)
  const [loading, setLoading] = useState(!application)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!application) {
      const fetchApplication = async () => {
        try {
          const res = await applicationAPI.getById(applicationId)
          if (res.success) {
            setApplication(res.application)
          }
        } catch (err) {
          console.error('Error fetching application:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchApplication()
    }
  }, [applicationId, application])

  const handleDownloadPDF = async () => {
    if (!application) return

    if (application.userType === 'student') {
      await generateStudentPDF(application)
    } else {
      await generateFacultyStaffPDF(application)
    }
  }

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h2>Application Submitted Successfully!</h2>
        <p>Your application has been received and is under review.</p>

        <div className="app-id-box">
          <div className="label">Application ID</div>
          <div className="app-id">{applicationId}</div>
          <small>Please save this ID for future reference and tracking</small>
        </div>

        <div className="next-steps">
          <h3>What&apos;s Next?</h3>
          <ol>
            <li><strong>Download and Print</strong> your application form using the button below.</li>
            <li>Submit the printed form to the <strong>Library</strong> for verification.</li>
            <li>Ensure you have all required attachments (Photo, FIR copy, Payment receipt as applicable).</li>
            <li>Your application will be reviewed by the administration.</li>
          </ol>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-primary"
            disabled={loading || !application}
          >
            {loading ? 'Loading...' : 'Download Application PDF'}
          </button>

          <Link to="/" className="btn btn-secondary">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
