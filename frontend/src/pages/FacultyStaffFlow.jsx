// 'use client';

// import { useState, useEffect, useRef } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import StepIndicator from '../components/StepIndicator'
// import { authAPI, applicationAPI } from '../services/api'
// import { generateFacultyStaffPDF } from '../services/pdfGenerator'
// import './FacultyFlow.css'

// const FACULTY_STAFF_STEPS = ['Email Verification', 'Application Form', 'Upload Documents', 'Preview & Submit']

// const formatDate = (dateString) => {
//   if (!dateString) return ''
//   try {
//     const date = new Date(dateString)
//     return date.toLocaleDateString('en-GB')
//   } catch {
//     return dateString
//   }
// }

// const INITIAL_FORM_STATE = {
//   requestCategory: '',
//   dataToChange: [],
//   otherDataChange: '',
//   title: '',
//   staffName: '',
//   staffNo: '',
//   designation: '',
//   department: '',
//   dob: '',
//   joiningDate: '',
//   retirementDate: '',
//   gender: '',
//   bloodGroup: '',
//   phone: '',
//   permanentAddress: '',
//   correctionDetails: '',
//   officeOrderAttached: false
// };

// export default function FacultyStaffFlow() {
//   const { userType } = useParams() 
//   const navigate = useNavigate()

//   // Determine Role
//   const isGenericUrl = !userType || userType === 'faculty-staff';
//   const [role, setRole] = useState((!isGenericUrl && userType) ? userType : 'staff');

//   const [step, setStep] = useState(0)
//   const [loading, setLoading] = useState(false)
  
//   const [email, setEmail] = useState('')
//   const [otp, setOtp] = useState('')
//   const [verificationSubstep, setVerificationSubstep] = useState('email')
//   const [verifiedEmail, setVerifiedEmail] = useState('')
  
//   // File State
//   const [files, setFiles] = useState({ photo: null })
//   const [filePreviews, setFilePreviews] = useState({ photo: null })
//   const [fileError, setFileError] = useState('')

//   // --- TOAST STATE ---
//   const [toast, setToast] = useState(null);

//   const showToast = (message, type = 'error') => {
//     setToast({ message, type });
//     // Scroll to top to ensure toast is seen
//     window.scrollTo({ top: 0, behavior: 'smooth' });
    
//     // Auto-hide after 3 seconds
//     setTimeout(() => {
//       setToast(null);
//     }, 3000);
//   };
  
//   // Clean start on load
//   useEffect(() => {
//     localStorage.clear();
//     sessionStorage.clear();
//     authAPI.logout();
//     setFormData(INITIAL_FORM_STATE);
//   }, []);

//   const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  
//   const departmentOptions = [
//     'Civil Engineering', 'Computer Science & Engineering', 'Electrical & Electronics Engineering',
//     'Electronics & Communication Engineering', 'Instrumentation & Control Engineering', 'Mechanical Engineering',
//     'Metallurgical and Materials Engineering', 'Production Engineering', 'Chemical Engineering', 'Architecture',
//     'Integrated Teacher Education Programme (ITEP)', 'Physics', 'Chemistry', 'Mathematics', 'Computer Science',
//     'Computer Applications', 'English', 'Management Studies', 'Other'
//   ]
  
//   const dataChangeOptions = [
//     'Name', 'Address', 'Designation', 'Email ID', 'Date Of Birth', 'Contact No', 'Transfer / Promotion / Redesignation', 'Other'
//   ]

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes'
//     const k = 1024
//     const sizes = ['Bytes', 'KB', 'MB']
//     const i = Math.floor(Math.log(bytes) / Math.log(k))
//     return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
//   }

//   const validateFile = (file, maxSize = 5) => {
//     const maxSizeInBytes = maxSize * 1024 * 1024
//     if (file.size > maxSizeInBytes) {
//       return `File size exceeds ${maxSize}MB limit`
//     }
//     return null
//   }

//   const handleFileChange = (e) => {
//     const { name, files: fileList } = e.target
//     setFileError('')

//     if (fileList.length > 0) {
//       const file = fileList[0]
//       const validationError = validateFile(file)
//       if (validationError) {
//         showToast(validationError, 'error')
//         e.target.value = ''
//         return
//       }

//       setFiles(prev => ({ ...prev, [name]: file }))

//       if (file.type.startsWith('image/')) {
//         const reader = new FileReader()
//         reader.onloadend = () => {
//           setFilePreviews(prev => ({ ...prev, [name]: reader.result }))
//         }
//         reader.readAsDataURL(file)
//       } else {
//         setFilePreviews(prev => ({ ...prev, [name]: null }))
//       }
//     }
//   }

//   const removeFile = (fieldName) => {
//     setFiles(prev => ({ ...prev, [fieldName]: null }))
//     setFilePreviews(prev => ({ ...prev, [fieldName]: null }))
//     setFileError('')
//     const fileInput = document.querySelector(`input[name="${fieldName}"]`)
//     if (fileInput) fileInput.value = ''
//   }
  
//   const handleSendOtp = async (e) => {
//     e.preventDefault()
//     const emailTrimmed = String(email).trim().toLowerCase()
    
//     if (!emailTrimmed.endsWith('@nitt.edu')) {
//       showToast('Only @nitt.edu institute email is allowed', 'error')
//       return
//     }
    
//     setLoading(true)
//     localStorage.removeItem('token');
    
//     try {
//       await authAPI.sendOTP({ 
//         email: emailTrimmed, 
//         userType: role || 'staff'
//       })
//       showToast(`OTP sent to ${emailTrimmed}`, 'success')
//       setVerificationSubstep('otp')
//     } catch (err) {
//       showToast(err.message || 'Failed to send OTP', 'error')
//     }
//     setLoading(false)
//   }
  
//   const handleVerifyOtp = async (e) => {
//     e.preventDefault()
//     setLoading(true)
    
//     try {
//       const finalEmail = String(email).trim().toLowerCase();
//       const finalOtp = String(otp).trim();
//       const finalRole = role || 'staff'; 

//       const res = await authAPI.verifyEmail(finalEmail, finalOtp, finalRole);
      
//       // Save session data
//       // localStorage.setItem('token', res.token)
//       localStorage.setItem('email', res.email)
//       localStorage.setItem('userType', finalRole)
      
//       setVerifiedEmail(res.email)
//       showToast('Verification Successful!', 'success')
      
//       setTimeout(() => {
//         setStep(1)
//       }, 500)
//     } catch (err) {
//       const backendMsg = err.response?.data?.message || err.message || 'Invalid OTP';
//       showToast(backendMsg, 'error')
//     }
//     setLoading(false)
//   }
  
//   const handleInputChange = (e) => {
//     const { name, value, type: inputType, checked } = e.target
//     let updatedData;
//     if (inputType === 'checkbox') {
//       if (name === 'dataToChange') {
//         const updatedCheckboxData = formData.dataToChange.includes(value)
//           ? formData.dataToChange.filter(item => item !== value)
//           : [...formData.dataToChange, value]
//         updatedData = { ...formData, dataToChange: updatedCheckboxData };
//       } else {
//         updatedData = { ...formData, [name]: checked };
//       }
//     } else {
//       // Prevent leading spaces
//       const cleanValue = (typeof value === 'string') ? value.replace(/^\s+/, '') : value;
//       updatedData = { ...formData, [name]: cleanValue };
//     }
//     setFormData(updatedData);
//   }
  
//   const handleFormSubmit = (e) => {
//     e.preventDefault()
    
//     // 1. Check Request Category
//     if (!formData.requestCategory) { 
//       showToast('Please select a request category', 'error'); 
//       return 
//     }
    
//     // 2. Check Required Fields
//     const requiredFields = ['title', 'staffName', 'staffNo', 'designation', 'department', 'dob', 'joiningDate', 'gender', 'bloodGroup', 'phone', 'permanentAddress'];
//     const missingFields = requiredFields.filter(field => !formData[field]);
    
//     if (missingFields.length > 0) {
//       showToast('Please fill all required fields', 'error'); 
//       return
//     }
    
//     setStep(2)
//   }

//   const handleFileUploadSubmit = (e) => {
//     e.preventDefault();

//     // Validate Photo
//     if (!files.photo) {
//       showToast('Please upload a passport-size photo', 'error');
//       return;
//     }

//     setStep(3);
//   }
  
//   const handleFinalSubmit = async () => {
//     setLoading(true)
    
//     try {
//       const formDataToSend = new FormData()
//       const finalRole = role || 'staff';
//       formDataToSend.append('userType', finalRole) 
//       formDataToSend.append('email', verifiedEmail)
      
//       Object.keys(formData).forEach(key => {
//         if (formData[key] !== undefined && formData[key] !== null) {
//           if (Array.isArray(formData[key])) {
//             formDataToSend.append(key, JSON.stringify(formData[key]))
//           } else {
//             formDataToSend.append(key, formData[key])
//           }
//         }
//       })
      
//       if (files.photo) formDataToSend.append('photo', files.photo)
//       formDataToSend.append('submittedAt', new Date().toISOString())
      
//       // Generate temp ID for PDF
//       const year = new Date().getFullYear()
//       const randomNum = Math.floor(10000 + Math.random() * 90000)
//       const prefix = finalRole === 'faculty' ? 'FAC' : 'STF';
//       const tempApplicationId = `NITT-${prefix}-${year}-${randomNum}`
      
//       const pdfDoc = await generateFacultyStaffPDF({
//         ...formData,
//         email: verifiedEmail,
//         userType: finalRole
//       }, false);
//       const pdfBlob = pdfDoc.output('blob');
//       formDataToSend.append('applicationPdf', pdfBlob, `application_${formData.staffNo || tempApplicationId}.pdf`);

//       const result = await applicationAPI.submit(formDataToSend)
//       const realApplicationId = result.applicationId || result.id || tempApplicationId
      
//       showToast('Application submitted successfully!', 'success')
      
//       localStorage.clear();
//       sessionStorage.clear();
      
//       setTimeout(() => {
//          navigate(`/success/${realApplicationId}`, { state: { application: result.application } })
//       }, 1000)
//     } catch (err) {
//       const backendMsg = err.response?.data?.message || err.message;
//       showToast(`Submission Error: ${backendMsg}`, 'error');
//     } finally {
//       setLoading(false)
//     }
//   }
  
//   // STEP 0: EMAIL VERIFICATION
//   if (step === 0) {
//     return (
//       <div className="faculty-form-container">
//         {/* TOAST COMPONENT */}
//         {toast && (
//           <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
//             <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
//             {toast.message}
//           </div>
//         )}

//         {/* <StepIndicator current={0} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
//         <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />

        
//         <div className="faculty-form-card">
//           <h2>Email Verification</h2>
//           <p className="form-description">Enter your institute email (@nitt.edu) to receive verification OTP</p>

//           <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
//             <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>Applying as:</label>
//             <div style={{ display: 'flex', gap: '20px' }}>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input 
//                   type="radio" name="role" value="staff" 
//                   checked={role === 'staff'} onChange={() => setRole('staff')}
//                   disabled={loading || verificationSubstep === 'otp'}
//                   style={{ marginRight: '8px' }}
//                 /> Staff
//               </label>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input 
//                   type="radio" name="role" value="faculty" 
//                   checked={role === 'faculty'} onChange={() => setRole('faculty')}
//                   disabled={loading || verificationSubstep === 'otp'}
//                   style={{ marginRight: '8px' }}
//                 /> Faculty
//               </label>
//             </div>
//           </div>
          
//           <div className="info-box">
//             <h4>Email Verification Instructions:</h4>
//             <ul>
//               <li>Use your institute email address (@nitt.edu)</li>
//               <li>A 6-digit OTP will be sent to your email</li>
//               <li>OTP is valid for 5 minutes</li>
//               <li style={{color: '#e53e3e', fontWeight: 'bold'}}>Do NOT use Student Roll No email</li>
//             </ul>
//           </div>
          
//           {verificationSubstep === 'email' ? (
//             <form onSubmit={handleSendOtp}>
//               <div className="form-group">
//                 <label>Institute Email *</label>
//                 <input
//                   type="email" value={email} onChange={(e) => setEmail(e.target.value)}
//                   placeholder="name@nitt.edu" required disabled={loading}
//                 />
//                 <small>Only @nitt.edu emails are allowed</small>
//               </div>
//               <div className="button-group">
//                 <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
//               </div>
//             </form>
//           ) : (
//             <form onSubmit={handleVerifyOtp}>
//               <div className="form-group">
//                 <label>OTP sent to {email}</label>
//                 <input
//                   type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
//                   placeholder="Enter 6-digit OTP" maxLength={6} required disabled={loading}
//                 />
//               </div>
//               <div className="button-group">
//                 <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => { setVerificationSubstep('email'); setOtp(''); }}>Change Email</button>
//               </div>
//             </form>
//           )}
//         </div>
//       </div>
//     )
//   }
  
//   // STEP 1: FORM
//   if (step === 1) {
//     return (
//       <div className="faculty-form-container">
//         {/* TOAST COMPONENT */}
//         {toast && (
//           <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
//             <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
//             {toast.message}
//           </div>
//         )}

//         {/* <StepIndicator current={1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
//         <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />

//         <div className="faculty-form-card">
//           <h2>ID Card Form for {role === 'faculty' ? 'Faculty' : 'Staff'}</h2>
//           <p className="form-description">The printed form must be submitted to the library for verification after being duly signed by the Registrar</p>
          
//           <form onSubmit={handleFormSubmit}>
//             <h3>Request Details</h3>
//             <div className="form-group">
//               <label>Request Category *</label>
//               <select name="requestCategory" value={formData.requestCategory} onChange={handleInputChange} required>
//                 <option value="">Select Category</option>
//                 <option value="New">New ID Card</option>
//                 <option value="Correction">Correction</option>
//                 <option value="Update">Update</option>
//                 <option value="Replacement">Replacement</option>
//               </select>
//             </div>
            
//             {(formData.requestCategory === 'Correction' || formData.requestCategory === 'Update') && (
//               <div className="form-group">
//                 <label>Data to be Changed *</label>
//                 <div className="checkbox-group">
//                   {dataChangeOptions.map(option => (
//                     <label key={option} className="checkbox-label">
//                       <input type="checkbox" name="dataToChange" value={option} checked={formData.dataToChange.includes(option)} onChange={handleInputChange} />
//                       <span>{option}</span>
//                     </label>
//                   ))}
//                 </div>
//                 {/* Show Input if Other is checked */}
//                 {formData.dataToChange.includes('Other') && (
//                   <input
//                     type="text"
//                     name="otherDataChange"
//                     value={formData.otherDataChange || ''}
//                     onChange={handleInputChange}
//                     placeholder="Please specify other data"
//                     style={{ marginTop: '10px' }}
//                   />
//                 )}
//               </div>
//             )}
            
//             <h3>Personal Information</h3>
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Title *</label>
//                 <select name="title" value={formData.title} onChange={handleInputChange} required>
//                   <option value="">Select Title</option>
//                   <option value="Prof">Prof.</option>
//                   <option value="Dr">Dr.</option>
//                   <option value="Mr">Mr.</option>
//                   <option value="Ms">Ms.</option>
//                   <option value="Mrs">Mrs.</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label>Name *</label>
//                 <input type="text" name="staffName" value={formData.staffName} onChange={handleInputChange} required />
//               </div>
//               <div className="form-group">
//                 <label>Staff No. *</label>
//                 <input type="text" name="staffNo" value={formData.staffNo} onChange={handleInputChange} required />
//               </div>
//               <div className="form-group">
//                 <label>Designation *</label>
//                 <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} required />
//               </div>
//               <div className="form-group">
//                 <label>Department / Section *</label>
//                 <select
//                   name="department"
//                   value={departmentOptions.includes(formData.department) ? formData.department : 'Other'}
//                   onChange={(e) => {
//                     if (e.target.value === 'Other') {
//                       setFormData({...formData, department: 'Other'});
//                     } else {
//                       handleInputChange(e);
//                     }
//                   }}
//                   required
//                 >
//                   <option value="">Select Department</option>
//                   {departmentOptions.map(dept => <option key={dept} value={dept}>{dept}</option>)}
//                 </select>
//                 {/* Show input if Other is selected */}
//                 {(!departmentOptions.includes(formData.department) || formData.department === 'Other') && (
//                   <input
//                     type="text"
//                     name="department"
//                     value={formData.department === 'Other' ? '' : formData.department}
//                     onChange={handleInputChange}
//                     placeholder="Please specify department"
//                     style={{ marginTop: '10px' }}
//                     required
//                   />
//                 )}
//               </div>
//               <div className="form-group">
//                 <label>Date of Birth *</label>
//                 <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
//               </div>
//               <div className="form-group">
//                 <label>Date of Joining *</label>
//                 <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
//               </div>
//               <div className="form-group">
//                 <label>Date of Retirement</label>
//                 <input type="date" name="retirementDate" value={formData.retirementDate} onChange={handleInputChange} />
//               </div>
//               <div className="form-group">
//                 <label>Gender *</label>
//                 <select name="gender" value={formData.gender} onChange={handleInputChange} required>
//                   <option value="">Select</option>
//                   <option value="Male">Male</option>
//                   <option value="Female">Female</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label>Blood Group *</label>
//                 <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} required>
//                   <option value="">Select</option>
//                   <option value="A+">A+</option>
//                   <option value="A-">A-</option>
//                   <option value="B+">B+</option>
//                   <option value="B-">B-</option>
//                   <option value="AB+">AB+</option>
//                   <option value="AB-">AB-</option>
//                   <option value="O+">O+</option>
//                   <option value="O-">O-</option>
//                 </select>
//               </div>
//             </div>
            
//             <h3>Contact Information</h3>
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Email ID *</label>
//                 <input type="email" value={verifiedEmail} readOnly disabled className="disabled-input" />
//               </div>
//               <div className="form-group">
//                 <label>Mobile Number *</label>
//                 <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} maxLength="10" required />
//               </div>
//             </div>
//             <div className="form-group">
//               <label>Address *</label>
//               <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" required />
//             </div>
            
//             {/* Removed Photo Upload from here */}

//             <div className="button-group">
//               <button type="button" onClick={() => { setStep(0) }} className="btn btn-secondary">← Back</button>
//               <button type="submit" className="btn btn-primary">Continue to Documents →</button>
//             </div>
//           </form>
//         </div>
//       </div>
//     )
//   }

//   // STEP 2: UPLOAD DOCUMENTS
//   if (step === 2) {
//     return (
//       <div className="faculty-form-container">
//         {toast && (
//           <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
//             <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
//             {toast.message}
//           </div>
//         )}
//         {/* <StepIndicator current={2} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
//         <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />


//         <div className="faculty-form-card">
//           <h2>Upload Required Documents</h2>
//           <p className="form-description">
//             Please upload your photo.
//           </p>

//           <div className="info-box">
//             <h4>File Requirements</h4>
//             <ul>
//               <li>Supported formats: JPG, PNG, PDF</li>
//               <li>Maximum file size: 5MB per file</li>
//             </ul>
//           </div>

//           <form onSubmit={handleFileUploadSubmit}>
//             {/* Photo Section */}
//             <h3>Passport Photograph</h3>
//             <div className="form-grid full">
//               <div className="form-group">
//                 <label htmlFor="photo">
//                   Recent Passport Photo <span className="required">*</span>
//                 </label>
//                 {filePreviews.photo && (
//                   <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
//                     <img
//                       src={filePreviews.photo}
//                       alt="Photo preview"
//                       style={{
//                         width: '120px',
//                         height: '150px',
//                         objectFit: 'cover',
//                         borderRadius: '8px',
//                         border: '2px solid #cbd5e0'
//                       }}
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeFile('photo')}
//                       className="btn btn-secondary"
//                       style={{ padding: '8px 16px', fontSize: '13px' }}
//                     >
//                       Remove
//                     </button>
//                   </div>
//                 )}
//                 {!files.photo && (
//                   <input
//                     type="file"
//                     id="photo"
//                     name="photo"
//                     onChange={handleFileChange}
//                     accept="image/*"
//                     required
//                   />
//                 )}
//                 {files.photo && !filePreviews.photo && (
//                   <div className="file-check">
//                     ✓ {files.photo.name} ({formatFileSize(files.photo.size)})
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="button-group" style={{ marginTop: '35px' }}>
//               <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
//               <button type="submit" className="btn btn-primary">Preview Application →</button>
//             </div>
//           </form>
//         </div>
//       </div>
//     )
//   }
  
//   // STEP 3: PREVIEW & SUBMIT
//   if (step === 3) {
//     return (
//       <div className="faculty-form-container">
//         {/* TOAST COMPONENT */}
//         {toast && (
//           <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
//             <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
//             {toast.message}
//           </div>
//         )}

//         {/* <StepIndicator current={3} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
//         <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />

//         <div className="faculty-form-card">
//           <h2>Preview Your Application</h2>
//           <div className="preview-section">
//             <h3>Summary for {formData.staffName} ({role})</h3>
            
//             {/* FULL PREVIEW GRID */}
//             <div className="preview-grid">
//                <div className="preview-item"><strong>Request Category:</strong> {formData.requestCategory}</div>
//                {formData.dataToChange.length > 0 && (
//                  <div className="preview-item"><strong>Data to Change:</strong> {formData.dataToChange.join(', ')} {formData.otherDataChange ? `(${formData.otherDataChange})` : ''}</div>
//                )}
//                <div className="preview-item"><strong>Title:</strong> {formData.title}</div>
//                <div className="preview-item"><strong>Name:</strong> {formData.staffName}</div>
//                <div className="preview-item"><strong>Staff No:</strong> {formData.staffNo}</div>
//                <div className="preview-item"><strong>Designation:</strong> {formData.designation}</div>
//                <div className="preview-item"><strong>Department:</strong> {formData.department}</div>
//                <div className="preview-item"><strong>Date of Birth:</strong> {formatDate(formData.dob)}</div>
//                <div className="preview-item"><strong>Joining Date:</strong> {formatDate(formData.joiningDate)}</div>
//                {formData.retirementDate && <div className="preview-item"><strong>Retirement Date:</strong> {formatDate(formData.retirementDate)}</div>}
//                <div className="preview-item"><strong>Gender:</strong> {formData.gender}</div>
//                <div className="preview-item"><strong>Blood Group:</strong> {formData.bloodGroup}</div>
//                <div className="preview-item"><strong>Email:</strong> {verifiedEmail}</div>
//                <div className="preview-item"><strong>Mobile:</strong> {formData.phone}</div>
//                <div className="preview-item full-width"><strong>Address:</strong> {formData.address}</div>
//                <div className="preview-item"><strong>Photo:</strong> {files.photo ? files.photo.name : 'Not Uploaded'}</div>
//             </div>
//           </div>
          
//           <div className="button-group">
//             <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">← Edit</button>
//             <button type="button" onClick={handleFinalSubmit} disabled={loading} className="btn btn-primary">{loading ? 'Submitting...' : 'Submit Application'}</button>
//           </div>
//         </div>
//       </div>
//     )
//   }
//   return null;
// }


'use client';

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepIndicator from '../components/StepIndicator'
import { authAPI, applicationAPI } from '../services/api'
import { generateFacultyStaffPDF } from '../services/pdfGenerator'
import './FacultyFlow.css'

const FACULTY_STAFF_STEPS = ['Email Verification', 'Application Form', 'Upload Documents', 'Preview & Submit']

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  } catch {
    return dateString
  }
}

const INITIAL_FORM_STATE = {
  requestCategory: '',
  dataToChange: [],
  otherDataChange: '',
  title: '',
  staffName: '',
  staffNo: '',
  designation: '',
  department: '',
  dob: '',
  joiningDate: '',
  retirementDate: '',
  gender: '',
  phone: '',
  address: '',
  permanentAddress: '',
  correctionDetails: '',
  officeOrderAttached: false
};

export default function FacultyStaffFlow() {
  const { userType } = useParams() 
  const navigate = useNavigate()

  // Determine Role
  const isGenericUrl = !userType || userType === 'faculty-staff';
  const [role, setRole] = useState((!isGenericUrl && userType) ? userType : 'staff');

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationSubstep, setVerificationSubstep] = useState('email')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  
  // File State
  const [files, setFiles] = useState({ photo: null, fir: null })
  const [filePreviews, setFilePreviews] = useState({ photo: null, fir: null })
  const [fileError, setFileError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [consent, setConsent] = useState(false)

  // --- TOAST STATE ---
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    // Scroll to top to ensure toast is seen with a small delay to allow render
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };
  
  // Clean start on load
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    authAPI.logout();
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  
  const departmentOptions = [
    'Civil Engineering', 'Computer Science & Engineering', 'Electrical & Electronics Engineering',
    'Electronics & Communication Engineering', 'Instrumentation & Control Engineering', 'Mechanical Engineering',
    'Metallurgical and Materials Engineering', 'Production Engineering', 'Chemical Engineering', 'Architecture',
    'Integrated Teacher Education Programme (ITEP)', 'Physics', 'Chemistry', 'Mathematics', 'Computer Science',
    'Computer Applications', 'English', 'Management Studies', 'Other'
  ]
  
  const dataChangeOptions = [
    'Name', 'Address', 'Designation', 'Email ID', 'Date Of Birth', 'Contact No', 'Transfer / Promotion / Redesignation', 'Other'
  ]

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFile = (file, maxSize = 5) => {
    const maxSizeInBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      return `File size exceeds ${maxSize}MB limit`
    }
    return null
  }

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    setFileError('')

    if (fileList.length > 0) {
      const file = fileList[0]
      const validationError = validateFile(file)
      if (validationError) {
        showToast(validationError, 'error')
        e.target.value = ''
        return
      }

      setFiles(prev => ({ ...prev, [name]: file }))

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreviews(prev => ({ ...prev, [name]: reader.result }))
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreviews(prev => ({ ...prev, [name]: null }))
      }
    }
  }

  const removeFile = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }))
    setFilePreviews(prev => ({ ...prev, [fieldName]: null }))
    setFileError('')
    const fileInput = document.querySelector(`input[name="${fieldName}"]`)
    if (fileInput) fileInput.value = ''
  }
  
  const handleSendOtp = async (e) => {
    e.preventDefault()
    const emailTrimmed = String(email).trim().toLowerCase()
    
    if (!emailTrimmed.endsWith('@nitt.edu')) {
      showToast('Only @nitt.edu institute email is allowed', 'error')
      return
    }
    
    setLoading(true)
    localStorage.removeItem('token');
    
    try {
      await authAPI.sendOTP({ 
        email: emailTrimmed, 
        userType: role || 'staff'
      })
      showToast(`OTP sent to ${emailTrimmed}`, 'success')
      setVerificationSubstep('otp')
    } catch (err) {
      showToast(err.message || 'Failed to send OTP', 'error')
    }
    setLoading(false)
  }
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const finalEmail = String(email).trim().toLowerCase();
      const finalOtp = String(otp).trim();
      const finalRole = role || 'staff'; 

      const res = await authAPI.verifyEmail(finalEmail, finalOtp, finalRole);
      
      // Save session data
      // localStorage.setItem('token', res.token)
      localStorage.setItem('email', res.email)
      localStorage.setItem('userType', finalRole)
      
      setVerifiedEmail(res.email)
      showToast('Verification Successful!', 'success')
      
      setTimeout(() => {
        setStep(1)
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 200);
      }, 500)
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.message || 'Invalid OTP';
      showToast(backendMsg, 'error')
    }
    setLoading(false)
  }
  
  const handleInputChange = (e) => {
    const { name, value, type: inputType, checked } = e.target
    let updatedData;
    if (inputType === 'checkbox') {
      if (name === 'dataToChange') {
        const updatedCheckboxData = formData.dataToChange.includes(value)
          ? formData.dataToChange.filter(item => item !== value)
          : [...formData.dataToChange, value]
        updatedData = { ...formData, dataToChange: updatedCheckboxData };
      } else {
        updatedData = { ...formData, [name]: checked };
      }
    } else {
      // Prevent leading spaces
      const cleanValue = (typeof value === 'string') ? value.replace(/^\s+/, '') : value;
      updatedData = { ...formData, [name]: cleanValue };
    }
    setFormData(updatedData);
  }
  
  const handleFormSubmit = (e) => {
    e.preventDefault()
    
    // 1. Check Request Category
    if (!formData.requestCategory) { 
      showToast('Please select a request category', 'error'); 
      return 
    }
    
    // 2. Check Required Fields
    const requiredFields = ['title', 'staffName', 'staffNo', 'designation', 'department', 'dob', 'joiningDate', 'gender', 'phone', 'address'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      showToast('Please fill all required fields', 'error'); 
      return
    }
    
    setStep(2)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 200);
  }

  const handleFileUploadSubmit = (e) => {
    e.preventDefault();

    // Validate Photo
    if (!files.photo) {
      showToast('Please upload a passport-size photo', 'error');
      return;
    }

    setStep(3);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 200);
  }
  
  const handleFinalSubmit = async () => {
    setLoading(true)
    
    try {
      const formDataToSend = new FormData()
      const finalRole = role || 'staff';
      formDataToSend.append('userType', finalRole) 
      formDataToSend.append('email', verifiedEmail)
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          if (Array.isArray(formData[key])) {
            formDataToSend.append(key, JSON.stringify(formData[key]))
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })
      
      if (files.photo) formDataToSend.append('photo', files.photo)
      if (files.fir) formDataToSend.append('fir', files.fir)
      formDataToSend.append('submittedAt', new Date().toISOString())
      
      // Generate temp ID for PDF
      const year = new Date().getFullYear()
      const randomNum = Math.floor(10000 + Math.random() * 90000)
      const prefix = finalRole === 'faculty' ? 'FAC' : 'STF';
      const tempApplicationId = `NITT-${prefix}-${year}-${randomNum}`
      
      const pdfDoc = await generateFacultyStaffPDF({
        ...formData,
        email: verifiedEmail,
        userType: finalRole
      }, false);
      const pdfBlob = pdfDoc.output('blob');
      formDataToSend.append('applicationPdf', pdfBlob, `application_${formData.staffNo || tempApplicationId}.pdf`);

      const result = await applicationAPI.submit(formDataToSend, (progress) => {
        setUploadProgress(progress)
      })
      const realApplicationId = result.applicationId || result.id || tempApplicationId
      
      showToast('Application submitted successfully!', 'success')
      
      localStorage.clear();
       setTimeout(() => {
         navigate(`/success/${realApplicationId}`, { replace: true, state: { application: result.application } })
      }, 1000)
    } catch (err) {
      console.error('Submission error:', err)
      showToast(err.message || 'Failed to submit application. Please try again.', 'error')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }
  
  // STEP 0: EMAIL VERIFICATION
  if (step === 0) {
    return (
      <div className="faculty-form-container">
        {/* TOAST COMPONENT */}
        {toast && (
          <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            {toast.message}
          </div>
        )}

        {/* <StepIndicator current={0} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
        <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />

        
        <div className="faculty-form-card">
          <h2>Email Verification</h2>
          <p className="form-description">Enter your institute email (@nitt.edu) to receive verification OTP</p>

          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>Applying as:</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="radio" name="role" value="staff" 
                  checked={role === 'staff'} onChange={() => setRole('staff')}
                  disabled={loading || verificationSubstep === 'otp'}
                  style={{ marginRight: '8px' }}
                /> Staff
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="radio" name="role" value="faculty" 
                  checked={role === 'faculty'} onChange={() => setRole('faculty')}
                  disabled={loading || verificationSubstep === 'otp'}
                  style={{ marginRight: '8px' }}
                /> Faculty
              </label>
            </div>
          </div>
          
          <div className="info-box">
            <h4>Email Verification Instructions:</h4>
            <ul>
              <li>Use your institute email address (@nitt.edu)</li>
              <li>A 6-digit OTP will be sent to your email</li>
              <li>OTP is valid for 5 minutes</li>
              <li style={{color: '#e53e3e', fontWeight: 'bold'}}>Do NOT use Student Roll No email</li>
            </ul>
          </div>
          
          {verificationSubstep === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Institute Email *</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nitt.edu" required disabled={loading}
                />
                <small>Only @nitt.edu emails are allowed</small>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>OTP sent to {email}</label>
                <input
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" 
                  maxLength={6} 
                  required 
                  disabled={loading}
                  className="otp-input"
                  style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center' }}
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setVerificationSubstep('email'); setOtp(''); }}>Change Email</button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }
  
  // STEP 1: FORM
  if (step === 1) {
    return (
      <div className="faculty-form-container">
        {/* TOAST COMPONENT */}
        {toast && (
          <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            {toast.message}
          </div>
        )}

        {/* <StepIndicator current={1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
        <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />

        <div className="faculty-form-card">
          <h2>ID Card Form for {role === 'faculty' ? 'Faculty' : 'Staff'}</h2>
          <p className="form-description">The printed form must be submitted to the library for verification after being duly signed by the Registrar</p>
          
          <form onSubmit={handleFormSubmit}>
            <h3>Request Details</h3>
            <div className="form-group">
              <label>Request Category <span className="required-asterisk">*</span></label>
              <select name="requestCategory" value={formData.requestCategory} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                <option value="New">New</option>
                <option value="Upgrade">Upgrade</option>
                <option value="Lost">Lost</option>
                <option value="Correction">Correction</option>
              </select>
            </div>
            
            {(formData.requestCategory === 'Correction' || formData.requestCategory === 'Update') && (
              <div className="form-group">
                <label>Data to be Changed <span className="required-asterisk">*</span></label>
                <div className="checkbox-group">
                  {dataChangeOptions.map(option => (
                    <label key={option} className="checkbox-label">
                      <input type="checkbox" name="dataToChange" value={option} checked={formData.dataToChange.includes(option)} onChange={handleInputChange} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {/* Show Input if Other is checked */}
                {formData.dataToChange.includes('Other') && (
                  <input
                    type="text"
                    name="otherDataChange"
                    value={formData.otherDataChange || ''}
                    onChange={handleInputChange}
                    placeholder="Please specify other data"
                    style={{ marginTop: '10px' }}
                  />
                )}
              </div>
            )}
            
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Title <span className="required-asterisk">*</span></label>
                <select name="title" value={formData.title} onChange={handleInputChange} required>
                  <option value="">Select Title</option>
                  <option value="Prof">Prof.</option>
                  <option value="Dr">Dr.</option>
                  <option value="Mr">Mr.</option>
                  <option value="Ms">Ms.</option>
                  <option value="Mrs">Mrs.</option>
                </select>
              </div>
              <div className="form-group">
                <label>Name <span className="required-asterisk">*</span></label>
                <input type="text" name="staffName" value={formData.staffName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Staff No. <span className="required-asterisk">*</span></label>
                <input type="text" name="staffNo" value={formData.staffNo} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Designation <span className="required-asterisk">*</span></label>
                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Department / Section <span className="required-asterisk">*</span></label>
                <select
                  name="department"
                  value={departmentOptions.includes(formData.department) ? formData.department : 'Other'}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setFormData({...formData, department: 'Other'});
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  required
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                {/* Show input if Other is selected */}
                {(!departmentOptions.includes(formData.department) || formData.department === 'Other') && (
                  <input
                    type="text"
                    name="department"
                    value={formData.department === 'Other' ? '' : formData.department}
                    onChange={handleInputChange}
                    placeholder="Please specify department"
                    style={{ marginTop: '10px' }}
                    required
                  />
                )}
              </div>
              <div className="form-group">
                <label>Date of Birth <span className="required-asterisk">*</span></label>
                <input 
                  type="date" 
                  name="dob" 
                  value={formData.dob} 
                  onChange={handleInputChange} 
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0]}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Date of Joining <span className="required-asterisk">*</span></label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Date of Retirement</label>
                <input type="date" name="retirementDate" value={formData.retirementDate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Gender <span className="required-asterisk">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            
            <h3>Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Email ID <span className="required-asterisk">*</span></label>
                <input type="email" value={verifiedEmail} readOnly disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Mobile Number <span className="required-asterisk">*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} maxLength="10" required />
              </div>
            </div>
            <div className="form-group">
              <label>Address <span className="required-asterisk">*</span></label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" required />
            </div>
            
            {/* Removed Photo Upload from here */}

            <div className="button-group">
              <button type="button" onClick={() => { setStep(0) }} className="btn btn-secondary">← Back</button>
              <button type="submit" className="btn btn-primary">Continue to Documents →</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // STEP 2: UPLOAD DOCUMENTS
  if (step === 2) {
    return (
      <div className="faculty-form-container">
        {toast && (
          <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            {toast.message}
          </div>
        )}
        {/* <StepIndicator current={2} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
        <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />


        <div className="faculty-form-card">
          <h2>Upload Required Documents</h2>
          <p className="form-description">
            Please upload your photo.
          </p>

          <div className="info-box">
            <h4>File Requirements</h4>
            <ul>
              <li>Photo: JPG, JPEG, PNG</li>
              <li>FIR: JPG, JPEG, PNG, PDF</li>
              <li>Maximum file size: 5MB per file</li>
            </ul>
          </div>

          <form onSubmit={handleFileUploadSubmit}>
            {/* Photo Section */}
            <h3>Passport Photograph</h3>
            <div className="form-grid full">
              <div className="form-group">
                <label htmlFor="photo">
                  Recent Passport Photo <span className="required">*</span>
                </label>
                {filePreviews.photo && (
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img
                      src={filePreviews.photo}
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
                {files.photo && !filePreviews.photo && (
                  <div className="file-check">
                    ✓ {files.photo.name} ({formatFileSize(files.photo.size)})
                  </div>
                )}
              </div>
            </div>

            {/* FIR Section for Lost */}
            {formData.requestCategory === 'Lost' && (
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
                    <label htmlFor="firNumber">FIR Number <span className="required">*</span></label>
                    <input type="text" id="firNumber" name="firNumber" value={formData.firNumber || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="firDate">FIR Date <span className="required">*</span></label>
                    <input 
                      type="date" 
                      id="firDate" 
                      name="firDate" 
                      value={formData.firDate || ''} 
                      onChange={handleInputChange} 
                      max={new Date().toISOString().split('T')[0]}
                      min={new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}
                      required 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="policeStation">Police Station Name <span className="required">*</span></label>
                    <input type="text" id="policeStation" name="policeStation" value={formData.policeStation || ''} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-grid full">
                  <div className="form-group">
                    <label htmlFor="fir">
                      FIR Copy / Lost Report <span className="required">*</span>
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
                    required
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


            <div className="button-group" style={{ marginTop: '35px' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
              <button type="submit" className="btn btn-primary">Preview Application →</button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  
  // STEP 3: PREVIEW & SUBMIT
  if (step === 3) {
    return (
      <div className="faculty-form-container">
        {/* TOAST COMPONENT */}
        {toast && (
          <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
            {toast.message}
          </div>
        )}

        {/* <StepIndicator current={3} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} /> */}
        <StepIndicator current={step + 1} total={FACULTY_STAFF_STEPS.length} labels={FACULTY_STAFF_STEPS} />

        <div className="faculty-form-card">
          <h2>Preview Your Application</h2>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: '#1a365d', marginBottom: '20px', fontSize: '18px', borderBottom: '2px solid #c9a227', paddingBottom: '10px' }}>
              Summary for {formData.staffName} ({role})
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              {[
                ['Request Category', formData.requestCategory],
                ['Title', formData.title],
                ['Name', formData.staffName],
                ['Staff No', formData.staffNo],
                ['Designation', formData.designation],
                ['Department', formData.department],
                ['Date of Birth', formatDate(formData.dob)],
                ['Joining Date', formatDate(formData.joiningDate)],
                ['Retirement Date', formData.retirementDate ? formatDate(formData.retirementDate) : 'N/A'],
                ['Gender', formData.gender],
                ['Email', verifiedEmail],
                ['Mobile', formData.phone],
                ['Address', formData.address],
                ['Photo', files.photo ? files.photo.name : 'Not Uploaded'],
                ...(['Lost', 'Stolen'].includes(formData.requestCategory) ? [['FIR Document', files.fir ? files.fir.name : 'Not Uploaded']] : [])
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#4a5568', marginBottom: '5px', fontWeight: '500' }}>
                    {label}
                  </div>
                  <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#ffffff' }}>
                    {value || 'Not provided'}
                  </div>
                </div>
              ))}
              {formData.dataToChange.length > 0 && (
                <div style={{ gridColumn: 'span 2', marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#4a5568', marginBottom: '5px', fontWeight: '500' }}>
                    Data to Change
                  </div>
                  <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#ffffff' }}>
                    {formData.dataToChange.join(', ')} {formData.otherDataChange ? `(${formData.otherDataChange})` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {loading && uploadProgress > 0 && (
            <div style={{ width: '100%', background: '#edf2f7', borderRadius: '4px', height: '10px', marginBottom: '15px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, background: '#c9a227', height: '100%', transition: 'width 0.3s ease' }}></div>
            </div>
          )}
          
          <div style={{ 
            marginBottom: '20px', 
            background: '#fef3c7', 
            padding: '15px', 
            borderRadius: '6px', 
            border: '1px solid #f59e0b' 
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#78350f', cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 'auto' }} />
              <span>I hereby declare that the information provided above is true to the best of my knowledge and belief. I agree to abide by the rules and regulations of the institute.</span>
            </label>
          </div>
          
          <div className="button-group">
            <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">← Edit</button>
            <button type="button" onClick={handleFinalSubmit} disabled={loading || !consent} className="btn btn-primary">
              {loading ? (
                uploadProgress < 100 && uploadProgress > 0
                  ? `Uploading Files... ${uploadProgress}%`
                  : 'Finalizing Submission (Please Wait)...'
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }
  return null;
}