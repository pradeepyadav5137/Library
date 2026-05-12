// 'use client';

// 'use client';

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { jsPDF } from 'jspdf'
// import { applicationAPI } from '../services/api'
// import './Form.css'

// const formatDate = (value) => {
//   if (!value) return ''
//   try {
//     const d = new Date(value)
//     if (Number.isNaN(d.getTime())) return value
//     return d.toLocaleDateString('en-IN')
//   } catch {
//     return value
//   }
// }

// const generateStudentPdf = (data) => {
//   const doc = new jsPDF('p', 'mm', 'a4')

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(14)
//   doc.text('NATIONAL INSTITUTE OF TECHNOLOGY TIRUCHIRAPPALLI', 105, 20, { align: 'center' })
//   doc.setFontSize(11)
//   doc.text('TAMIL NADU, INDIA-620015', 105, 26, { align: 'center' })

//   doc.setFontSize(12)
//   doc.text('STUDENT APPLICATION FOR DUPLICATE IDENTITY CARD', 105, 36, { align: 'center' })
//   doc.setFontSize(10)
//   doc.text('(to be filled by the student)', 105, 42, { align: 'center' })

//   let y = 55
//   const lineGap = 7
//   const addField = (label, value) => {
//     doc.setFont('helvetica', 'bold')
//     doc.text(label, 15, y)
//     doc.setFont('helvetica', 'normal')
//     doc.text(String(value || ''), 80, y)
//     y += lineGap
//   }

//   addField('Name of the Student', data.name)
//   addField('Roll No.', data.rollNo)
//   addField('Branch', data.branch)
//   addField("Parent's Name", data.fatherName)
//   addField('Blood Group', data.bloodGroup)
//   addField('D.O.B', formatDate(data.dob))
//   addField('Contact No.', data.phone)
//   addField('Email ID', data.email)
//   addField('Request Category', data.requestCategory)
//   addField('Reason / Details', data.reasonDetails)

//   const filename = `${data.rollNo || 'student'}_duplicate_id_application.pdf`
//   doc.save(filename)
// }

// const generateStaffPdf = (data) => {
//   const doc = new jsPDF('p', 'mm', 'a4')

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(14)
//   doc.text('NATIONAL INSTITUTE OF TECHNOLOGY TIRUCHIRAPPALLI', 105, 20, { align: 'center' })
//   doc.setFontSize(11)
//   doc.text('TAMIL NADU, INDIA-620015', 105, 26, { align: 'center' })

//   doc.setFontSize(12)
//   doc.text('STAFF APPLICATION FOR DUPLICATE IDENTITY CARD', 105, 36, { align: 'center' })
//   doc.setFontSize(10)
//   doc.text('(DESIGNATION/OTHER OFFICIAL CHANGES)', 105, 42, { align: 'center' })
//   doc.text('(to be filled by the staff)', 105, 48, { align: 'center' })

//   let y = 60
//   const lineGap = 7
//   const addField = (label, value) => {
//     doc.setFont('helvetica', 'bold')
//     doc.text(label, 15, y)
//     doc.setFont('helvetica', 'normal')
//     doc.text(String(value || ''), 80, y)
//     y += lineGap
//   }

//   addField('Name of the Staff', data.staffName || data.name)
//   addField('Staff No.', data.staffNo)
//   addField('Designation', data.designation)
//   addField('Title', data.title)
//   addField('Gender', data.gender)
//   addField('Blood Group', data.bloodGroup)
//   addField('Dept./ Section', data.department)
//   addField('D.O.B', formatDate(data.dob))
//   addField('Date of Joining', formatDate(data.joiningDate))
//   addField('Date of Retirement', formatDate(data.retirementDate))
//   addField('Contact No.', data.phone)
//   addField('Email ID', data.email)
//   addField('Request Category', data.requestCategory)
//   addField('Reason / Details', data.reasonDetails)

//   const filename = `${data.staffNo || 'staff'}_duplicate_id_application.pdf`
//   doc.save(filename)
// }

// export default function ApplicationPreview() {
//   const navigate = useNavigate()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const formData = JSON.parse(localStorage.getItem('formData') || '{}')
//   const userType = localStorage.getItem('userType')

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     try {
//       const form = new FormData()
//       form.append('userType', userType)

//       Object.keys(formData).forEach(key => {
//         if (key && formData[key] !== null && formData[key] !== undefined) {
//           form.append(key, formData[key])
//         }
//       })

//       const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '{}')
//       if (uploadedFiles.photo) form.append('photo', uploadedFiles.photo)
//       if (uploadedFiles.fir) form.append('fir', uploadedFiles.fir)
//       if (uploadedFiles.payment) form.append('payment', uploadedFiles.payment)

//       const response = await applicationAPI.submit(form)

//       localStorage.clear()
//       navigate(`/success/${response.data.applicationId}`)
//     } catch (err) {
//       setError(err.response?.data?.message || 'Error submitting application')
//     }
//     setLoading(false)
//   }

//   const handleDownload = () => {
//     if (userType === 'student') {
//       generateStudentPdf(formData)
//     } else {
//       generateStaffPdf(formData)
//     }
//   }

//   const isStudent = userType === 'student'
//   const isFacultyOrStaff = userType === 'faculty' || userType === 'staff'

//   return (
//     <div className="form-container">
//       <div className="form-card">
//         <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px' }}>
//           NATIONAL INSTITUTE OF TECHNOLOGY TIRUCHIRAPPALLI
//         </h2>
//         <p style={{ textAlign: 'center', marginBottom: '16px' }}>
//           TAMIL NADU, INDIA-620015
//         </p>

//         {isStudent && (
//           <h3 style={{ textAlign: 'center', marginBottom: '4px' }}>
//             STUDENT APPLICATION FOR DUPLICATE IDENTITY CARD
//           </h3>
//         )}
//         {isFacultyOrStaff && (
//           <h3 style={{ textAlign: 'center', marginBottom: '4px' }}>
//             STAFF APPLICATION FOR DUPLICATE IDENTITY CARD
//           </h3>
//         )}
//         <p style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: '24px' }}>
//           (to be filled by the {isStudent ? 'student' : 'staff'})
//         </p>

//         {error && <div className="error-message">{error}</div>}

//         {isStudent && (
//           <div className="preview-section">
//             <div className="preview-grid">
//               <div><strong>Name of the Student:</strong> {formData.name}</div>
//               <div><strong>Roll No.:</strong> {formData.rollNo}</div>
//               <div><strong>Branch:</strong> {formData.branch}</div>
//               <div><strong>Parent&apos;s Name:</strong> {formData.fatherName}</div>
//               <div><strong>Blood Group:</strong> {formData.bloodGroup}</div>
//               <div><strong>D.O.B:</strong> {formData.dob}</div>
//               <div><strong>Contact No.:</strong> {formData.phone}</div>
//               <div><strong>Email ID:</strong> {formData.email}</div>
//             </div>
//             <div style={{ marginTop: '16px' }}>
//               <strong>Request Category:</strong> {formData.requestCategory}
//             </div>
//             <div style={{ marginTop: '8px' }}>
//               <strong>Reason / Details:</strong> {formData.reasonDetails}
//             </div>
//           </div>
//         )}

//         {isFacultyOrStaff && (
//           //   <div className="preview-section">
//           //     <div className="preview-grid">
//           //       <div><strong>Name of the Staff:</strong> {formData.staffName || formData.name}</div>
//           //       <div><strong>Staff No.:</strong> {formData.staffNo}</div>
//           //       <div><strong>Designation:</strong> {formData.designation}</div>
//           //       <div><strong>Title:</strong> {formData.title}</div>
//           //       <div><strong>Gender:</strong> {formData.gender}</div>
//           //       <div><strong>Blood Group:</strong> {formData.bloodGroup}</div>
//           //       <div><strong>Dept./Section:</strong> {formData.department}</div>
//           //       <div><strong>D.O.B:</strong> {formData.dob}</div>
//           //       <div><strong>Date of Joining:</strong> {formData.joiningDate}</div>
//           //       <div><strong>Date of Retirement:</strong> {formData.retirementDate || ''}</div>
//           //       <div><strong>Contact No.:</strong> {formData.phone}</div>
//           //       <div><strong>Email ID:</strong> {formData.email}</div>
//           //     </div>
//           //     <div style={{ marginTop: '16px' }}>
//           //       <strong>Request Category:</strong> {formData.requestCategory}</strong>
//           //     </div>
//           //     <div style={{ marginTop: '8px' }}>
//           //       <strong>Reason / Details:</strong> {formData.reasonDetails}
//           //     </div>
//           //   </div>
//           <div className="preview-section">
//             <div className="preview-grid">
//               <div><strong>Name of the Staff:</strong> {formData.staffName || formData.name}</div>
//               <div><strong>Staff No.:</strong> {formData.staffNo}</div>
//               <div><strong>Designation:</strong> {formData.designation}</div>
//               <div><strong>Title:</strong> {formData.title}</div>
//               <div><strong>Gender:</strong> {formData.gender}</div>
//               <div><strong>Blood Group:</strong> {formData.bloodGroup}</div>
//               <div><strong>Dept./Section:</strong> {formData.department}</div>
//               <div><strong>D.O.B:</strong> {formData.dob}</div>
//               <div><strong>Date of Joining:</strong> {formData.joiningDate}</div>
//               <div><strong>Date of Retirement:</strong> {formData.retirementDate || ''}</div>
//               <div><strong>Contact No.:</strong> {formData.phone}</div>
//               <div><strong>Email ID:</strong> {formData.email}</div>
//             </div>

//             <div style={{ marginTop: '16px' }}>
//               <strong>Request Category:</strong> {formData.requestCategory}
//             </div>

//             <div style={{ marginTop: '8px' }}>
//               <strong>Reason / Details:</strong> {formData.reasonDetails}
//             </div>
//           </div>

//         )}


//         <form onSubmit={handleSubmit}>
//           <div className="form-group" style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
//             <input type="checkbox" id="accept" required />
//             <label htmlFor="accept" style={{ marginLeft: '10px', marginBottom: '0' }}>
//               I declare that the information provided is true and accurate
//             </label>
//           </div>

//           <div style={{ marginTop: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
//             <button type="submit" disabled={loading} className="btn btn-primary">
//               {loading ? 'Submitting...' : 'Submit Application'}
//             </button>
//             <button
//               type="button"
//               onClick={() => navigate('/upload-documents')}
//               className="btn btn-secondary"
//             >
//               Back
//             </button>
//             <button
//               type="button"
//               onClick={handleDownload}
//               className="btn btn-secondary"
//             >
//               Download PDF
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }
