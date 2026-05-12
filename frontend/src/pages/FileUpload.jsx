import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from '../components/StepIndicator'
import './StudentFlow.css'

const STUDENT_STEPS = ['Verify Email', 'Student Form', 'Upload Documents', 'Preview & Submit'];

export default function FileUpload() {
  const navigate = useNavigate()
  const userType = localStorage.getItem('userType')
  const [files, setFiles] = useState({
    photo: null,
    fir: null,
    payment: null
  })
  const [previews, setPreviews] = useState({
    photo: null,
    fir: null,
    payment: null
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestCategory, setRequestCategory] = useState('')
  const [formData, setFormData] = useState({})

  const isStudent = userType === 'student'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const savedFormData = localStorage.getItem('formData')
    if (!savedFormData) {
      navigate(isStudent ? '/student-form' : '/faculty-form')
    } else {
      try {
        const parsed = JSON.parse(savedFormData);
        setRequestCategory(parsed.requestCategory);
        setFormData(parsed);
      } catch(e) {}
    }
  }, [navigate, isStudent])

  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const isPaymentOptional = requestCategory === 'New';
  const isPaymentMandatory = !isPaymentOptional;
  const isFirMandatory = requestCategory === 'Lost';



  const validateFile = (file, fieldName, maxSize = 5) => {
  const maxSizeInBytes = maxSize * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return `File size exceeds ${maxSize}MB limit`;
  }

  const imageTypes = ['image/jpeg', 'image/png'];
  const pdfType = 'application/pdf';

  if (fieldName === 'photo') {
    if (!imageTypes.includes(file.type)) {
      return 'Passport photo must be JPG or PNG only';
    }
  }

  if (fieldName === 'fir' || fieldName === 'payment') {
    if (!imageTypes.includes(file.type) && file.type !== pdfType) {
      return 'Only JPG, PNG or PDF files are allowed';
    }
  }

  return null;
};


  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    setError('')
    
    if (fileList.length > 0) {
      const file = fileList[0]
      // const validationError = validateFile(file)
      const validationError = validateFile(file, name)

      if (validationError) {
        setError(validationError)
        e.target.value = ''
        return
      }
      
      setFiles(prev => ({ ...prev, [name]: file }))
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews(prev => ({ ...prev, [name]: reader.result }))
        }
        reader.readAsDataURL(file)
      } else {
        setPreviews(prev => ({ ...prev, [name]: null }))
      }
    }
  }

  const removeFile = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }))
    setPreviews(prev => ({ ...prev, [fieldName]: null }))
    setError('')
    const fileInput = document.querySelector(`input[name="${fieldName}"]`)
    if (fileInput) fileInput.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate only Photo. FIR is optional.
    if (!files.photo) {
      setError('Please upload your passport-sized photograph')
      setLoading(false)
      return
    }

    // Helper for date validation (not older than 30 days, not in future)
    const isDateValid = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return date <= today && date >= thirtyDaysAgo;
    };

    if (isPaymentMandatory) {
      if (!files.payment) {
        setError('Please upload payment receipt')
        setLoading(false)
        return
      }
      if (!formData.transactionNumber || !formData.transactionDate) {
        setError('Transaction Number and Date are required')
        setLoading(false)
        return
      }
      if (!isDateValid(formData.transactionDate)) {
        setError('Transaction Date cannot be in the future or older than 1 month')
        setLoading(false)
        return
      }
    }

    if (isFirMandatory) {
      if (!files.fir) {
        setError('Please upload the FIR copy or Lost Document Report')
        setLoading(false)
        return
      }
      if (!formData.firNumber || !formData.firDate) {
        setError('FIR Number and Date are required')
        setLoading(false)
        return
      }
      if (!isDateValid(formData.firDate)) {
        setError('FIR Date cannot be in the future or older than 1 month')
        setLoading(false)
        return
      }
    }

    const filesData = {
      photo: files.photo.name,
      fir: files.fir?.name || null, // Allow null FIR
      payment: files.payment?.name || null
    }
    
    localStorage.setItem('uploadedFiles', JSON.stringify(filesData))
    localStorage.setItem('formData', JSON.stringify(formData))
    localStorage.setItem('studentFormData', JSON.stringify(formData))

    setTimeout(() => {
      setLoading(false)
      navigate('/preview', { state: { files: files } })
    }, 1000)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSbiCollect = () => {
    window.open('https://www.onlinesbi.sbi/sbicollect/', '_blank')
  }

  return (
    <div className="form-container">
      {/* Add StepIndicator for Students */}
      {isStudent && (
        <StepIndicator
          current={3}
          total={STUDENT_STEPS.length}
          labels={STUDENT_STEPS}
        />
      )}

      <div className="form-card">
        <h2>Upload Required Documents</h2>
        <p className="form-description">
          Please upload your photo{isStudent && requestCategory !== 'New' ? ' and payment receipt' : ''}.
          {isFirMandatory ? ' FIR is required for Lost category.' : ''}
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="info-box">
          <h4>File Requirements</h4>
          <ul>
            <li>Photo: JPG, JPEG, PNG</li>
            <li>FIR/Payment: JPG, JPEG, PNG, PDF</li>
            <li>Maximum file size: 5MB per file</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Photo Section */}
          <h3>Passport Photograph</h3>
          <div className="form-grid full">
            <div className="form-group">
              <label htmlFor="photo">
                Recent Passport Photo <span className="required">*</span>
              </label>
              {previews.photo && (
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img 
                    src={previews.photo} 
                    alt="Photo preview" 
                    style={{ 
                      width: '120px', 
                      height: '150px', 
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #cbd5e0'
                    }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeFile('photo')} 
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Remove
                  </button>
                </div>
              )}
              {!files.photo && (
                <input 
                  type="file" 
                  id="photo" 
                  name="photo" 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  required 
                />
              )}
              {files.photo && !previews.photo && (
                <div className="file-check">
                  ✓ {files.photo.name} ({formatFileSize(files.photo.size)})
                </div>
              )}
            </div>
          </div>

          {/* FIR Section */}
          {isFirMandatory && (
            <>
              <h3>FIR / Lost Document Report</h3>
              <div className="payment-instructions" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ color: '#1a365d', marginBottom: '10px' }}>FIR Registration Instructions</h4>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Required if ID was lost or stolen.</p>
                <ol style={{ marginLeft: '20px', fontSize: '13px' }}>
                  <li>Example format: FIR No. 123/2023</li>
                  <li>Click below to go to TN Police Portal to register e-FIR for lost items if you haven't yet.</li>
                </ol>
                <button type="button" onClick={() => window.open('https://eservices.tnpolice.gov.in/CCTNSNICSDC/Index', '_blank')} className="btn btn-primary" style={{ marginTop: '15px' }}>Register FIR</button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firNumber">FIR / Report Number {isFirMandatory && <span className="required" style={{ color: '#e53e3e' }}>*</span>}</label>
                  <input type="text" id="firNumber" name="firNumber" value={formData.firNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, firNumber: e.target.value }))} required={isFirMandatory} />
                </div>
                <div className="form-group">
                  <label htmlFor="firDate">Registered Date {isFirMandatory && <span className="required" style={{ color: '#e53e3e' }}>*</span>}</label>
                  <input 
                    type="date" 
                    id="firDate" 
                    name="firDate" 
                    value={formData.firDate || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, firDate: e.target.value }))} 
                    max={new Date().toISOString().split('T')[0]}
                    min={new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}
                    required={isFirMandatory} 
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="policeStation">Police Station Name {isFirMandatory && <span className="required" style={{ color: '#e53e3e' }}>*</span>}</label>
                  <input type="text" id="policeStation" name="policeStation" value={formData.policeStation || ''} onChange={(e) => setFormData(prev => ({ ...prev, policeStation: e.target.value }))} required={isFirMandatory} />
                </div>
              </div>

              <div className="form-grid full">
                <div className="form-group">
                  <label htmlFor="fir">
                    FIR Copy / Lost Report {isFirMandatory ? <span className="required">*</span> : <span className="optional"> (Optional)</span>}
                  </label>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                    Upload FIR copy filed at police station.
                  </p>
              {!files.fir && (
                <input 
                  type="file" 
                  id="fir" 
                  name="fir" 
                  onChange={handleFileChange} 
                  accept=".pdf,image/*" 
                />
              )}
              {files.fir && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="file-check" style={{ flex: 1 }}>
                    ✓ {files.fir.name} ({formatFileSize(files.fir.size)})
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile('fir')} 
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Payment Section (Mandatory for Student unless New) */}
          {isStudent && requestCategory !== 'New' && (
            <>
              <h3>Payment Receipt</h3>
              
              {/* Payment Instructions */}
              <div className="payment-instructions" style={{ 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                fontFamily: 'Segoe UI', // Fixed capitalization
              }}>
                <h4 style={{ color: '#1a365d', marginBottom: '10px' }}>Payment Instructions</h4>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>
                  <strong>Fee for Duplicate ID Card: ₹500/-</strong>
                </p>

                <ol style={{ marginLeft: '20px', fontSize: '13px' }}>
                  <li><strong>Click the button below to go to SBI Collect</strong></li>
                  <li>Select State: <strong>Tamil Nadu</strong></li>
                  <li>Select Type of Corporate/Institution: <strong>Educational Institutions</strong></li>
                  <li>Select Educational Institution Name: <strong>National Institute of Technology Tiruchirappalli</strong></li>
                  <li>Select Payment Category: <strong>Other Fees</strong></li>
                  <li>Enter the amount: <strong>₹500</strong></li>
                  <li>Fill in your details and complete the payment</li>
                  <li>Download/Save the payment receipt as PDF or image</li>
                </ol>
                
                <button 
                  type="button" 
                  onClick={handleSbiCollect}
                  className="btn btn-primary"
                  style={{ marginTop: '15px' }}
                >
                  Go to SBI Collect Website
                </button>
              </div>

              <div className="warning-box" style={{ 
                backgroundColor: '#fff5f5', 
                border: '1px solid #fc8181',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <h4 style={{ color: '#c53030', marginBottom: '10px' }}>⚠ Important Warning</h4>
                <p style={{ fontSize: '13px', color: '#c53030', lineHeight: '1.6' }}>
                  <strong>Submission of fake/forged payment receipts is strictly prohibited.</strong><br />
                  As per NITT rules and regulations, any attempt to submit fraudulent documents will result in:
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px', color: '#c53030' }}>
                  <li>Immediate rejection of application</li>
                  <li>Disciplinary action under institute code of conduct</li>
                  <li>Academic penalties including suspension</li>
                  <li>Legal action under IPC Section 420 (Cheating)</li>
                </ul>
                <p style={{ fontSize: '13px', color: '#c53030', marginTop: '10px', fontStyle: 'italic' }}>
                  Ensure you upload the genuine receipt from SBI Collect only.
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="transactionNumber">Transaction Number {isPaymentMandatory && <span className="required" style={{ color: '#e53e3e' }}>*</span>}</label>
                  <input type="text" id="transactionNumber" name="transactionNumber" value={formData.transactionNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, transactionNumber: e.target.value }))} required={isPaymentMandatory} />
                </div>
                <div className="form-group">
                  <label htmlFor="transactionDate">Transaction Date {isPaymentMandatory && <span className="required" style={{ color: '#e53e3e' }}>*</span>}</label>
                  <input 
                    type="date" 
                    id="transactionDate" 
                    name="transactionDate" 
                    value={formData.transactionDate || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))} 
                    max={new Date().toISOString().split('T')[0]}
                    min={new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}
                    required={isPaymentMandatory} 
                  />
                </div>
              </div>
              <div className="form-grid full">
                <div className="form-group">
                  <label htmlFor="payment">
                    Fee Payment Receipt - ₹500 <span className="required">*</span>
                  </label>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                    Upload the payment receipt downloaded from SBI Collect for ₹500.
                  </p>
                  {!files.payment && (
                    <input 
                      type="file" 
                      id="payment" 
                      name="payment" 
                      onChange={handleFileChange} 
                      accept=".pdf,image/*" 
                      required
                    />
                  )}
                  {files.payment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="file-check" style={{ flex: 1 }}>
                        ✓ {files.payment.name} ({formatFileSize(files.payment.size)})
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile('payment')} 
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* For Faculty (No Payment Required) */}
          {!isStudent && (
            <div className="info-box" style={{ marginTop: '20px', backgroundColor: '#f0fff4', borderColor: '#68d391' }}>
              <h4 style={{ color: '#2f855a' }}>Note for Faculty/Staff</h4>
              <p style={{ fontSize: '13px', color: '#2f855a' }}>
                Faculty and Staff members are exempt from payment fees for duplicate ID cards.
                Only passport photo is required.
              </p>
            </div>
          )}

          <div className="button-group" style={{ marginTop: '35px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Processing...' : 'Continue to Preview →'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn btn-secondary"
            >
              ← Back to Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}