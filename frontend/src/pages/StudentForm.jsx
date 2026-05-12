import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from '../components/StepIndicator'
import './StudentFlow.css'

// 1. Define Default State cleanly
const INITIAL_STATE = {
  name: '',
  rollNo: '',
  fatherName: '',
  motherName: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  email: '',
  phone: '',
  parentMobile: '',
  permanentAddress: '',
  programme: '',
  branch: '',
  batch: '',
  semester: '',
  issuedBooks: '',
  requestCategory: '',
  firNumber: '',
  firDate: '',
  policeStation: ''
};

const STUDENT_STEPS = ['Email Verification', 'Application Form', 'Upload Documents', 'Preview & Submit'];

export default function StudentForm() {
  const navigate = useNavigate()

  const verifiedRollNo = localStorage.getItem('rollNo');
  const verifiedEmail = localStorage.getItem('email');

  // --- TOAST STATE ---
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const [formData, setFormData] = useState(() => {
    const savedString = localStorage.getItem('studentFormData');

    if (savedString) {
      try {
        const savedData = JSON.parse(savedString);
        if (savedData.rollNo === verifiedRollNo) {
          // Safe Merge: Default + Saved + Verified Credentials
          return {
            ...INITIAL_STATE,
            ...savedData,
            rollNo: verifiedRollNo,
            email: verifiedEmail
          };
        }
      } catch (e) {
        // Silent catch
      }
    }

    // Default Start
    return {
      ...INITIAL_STATE,
      rollNo: verifiedRollNo || '',
      email: verifiedEmail || ''
    };
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    window.scrollTo(0, 0);
    // const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!verifiedRollNo || userType !== 'student') {
      localStorage.clear();
      navigate('/apply/student');
    }
  }, [navigate, verifiedRollNo]);

  const handleChange = (e) => {
    const { name, value } = e.target
    // Prevent leading spaces
    const cleanValue = (typeof value === 'string') ? value.replace(/^\s+/, '') : value;

    const updatedData = { ...formData, [name]: cleanValue };

    setFormData(updatedData)
    localStorage.setItem('studentFormData', JSON.stringify(updatedData));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Mobile Number must be exactly 10 digits'
    }
    if (formData.parentMobile && !/^\d{10}$/.test(formData.parentMobile)) {
      newErrors.parentMobile = 'Parent Mobile must be exactly 10 digits'
    }

    if (!formData.name) newErrors.name = "Full Name is required";
    if (!formData.fatherName) newErrors.fatherName = "Father's Name is required";
    if (!formData.dob) {
      newErrors.dob = "Date of Birth is required";
    }
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.phone) newErrors.phone = "Mobile Number is required";
    if (!formData.parentMobile) newErrors.parentMobile = "Parent Mobile is required";
    if (!formData.permanentAddress) newErrors.permanentAddress = "Address is required";
    if (!formData.programme) newErrors.programme = "Programme is required";
    if (!formData.branch) newErrors.branch = "Branch is required";
    // if (!formData.batch) newErrors.batch = "Batch is required";

    if (!formData.batch) {
      newErrors.batch = "Batch is required";
    } else {
      const batchPattern = /^\d{4}-\d{4}$/;

      if (!batchPattern.test(formData.batch)) {
        newErrors.batch = "Format must be YYYY-YYYY (e.g. 2021-2025)";
      } else {
        const [startYear, endYear] = formData.batch.split('-').map(Number);
        if (endYear <= startYear) {
          newErrors.batch = "End year must be greater than start year";
        }
      }
    }
    if (!formData.semester) newErrors.semester = "Semester is required";

    if (formData.issuedBooks === '' || formData.issuedBooks === null) {
      newErrors.issuedBooks = "Issued Books count is required (enter 0 if none)";
    } else {
      const booksCount = parseInt(formData.issuedBooks);
      if (booksCount < 0) {
        newErrors.issuedBooks = "Cannot be less than 0";
      } else if (booksCount > 6) {
        newErrors.issuedBooks = "Cannot issue more than 6 books";
      }
    }

    if (!formData.requestCategory) newErrors.requestCategory = "Request Category is required";

    setErrors(newErrors)
    return newErrors
  }

  const handleNextStep = (e) => {
    if (e) e.preventDefault();

    const errorsFound = validateForm();

    if (Object.keys(errorsFound).length > 0) {
      // Show Toast instead of Alert
      showToast("Please fix the errors highlighted in red.", "error");

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Save to both keys for safety
    localStorage.setItem('studentFormData', JSON.stringify(formData));
    localStorage.setItem('formData', JSON.stringify(formData));
    navigate('/upload-documents');
  }

  return (
    <div className="form-container">

      {/* Add StepIndicator */}
      <StepIndicator
        current={2}
        total={STUDENT_STEPS.length}
        labels={STUDENT_STEPS}
      />

      {/* --- TOAST COMPONENT (Using CSS classes) --- */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.message}
        </div>
      )}

      <div className="form-card">
        <h2>Student Application Form</h2>
        <p className="form-description">
          Please fill in all required fields marked with <span style={{ color: '#e53e3e' }}>*</span>
        </p>

        <form>
          {/* --- Personal Information --- */}
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="name">Full Name <span className="required">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" maxLength="50" required />
              {errors.name && <small style={{ color: '#e53e3e' }}>{errors.name}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="rollNo">Roll Number <span className="required">*</span></label>
              <input type="text" id="rollNo" name="rollNo" value={formData.rollNo} disabled style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed', fontWeight: 'bold' }} />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address <span className="required">*</span></label>
              <input type="email" id="email" name="email" value={formData.email} disabled style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }} />
            </div>

            <div className="form-group">
              <label htmlFor="fatherName">Father's Name <span className="required">*</span></label>
              <input type="text" id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleChange} required />
              {errors.fatherName && <small style={{ color: '#e53e3e' }}>{errors.fatherName}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="dob">Date of Birth <span className="required">*</span></label>
              <input 
                type="date" 
                id="dob" 
                name="dob" 
                value={formData.dob} 
                onChange={handleChange} 
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 15)).toISOString().split('T')[0]}
                required 
              />
              {errors.dob && <small style={{ color: '#e53e3e' }}>{errors.dob}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender <span className="required">*</span></label>
              <select
                id="gender"
                name="gender"
                value={['Male', 'Female', ''].includes(formData.gender) ? formData.gender : 'Other'}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setFormData({ ...formData, gender: 'Other' });
                  } else {
                    handleChange(e);
                  }
                }}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {/* Show input if Other is selected */}
              {(!['Male', 'Female', ''].includes(formData.gender)) && (
                <input
                  type="text"
                  name="gender"
                  value={formData.gender === 'Other' ? '' : formData.gender}
                  onChange={handleChange}
                  placeholder="Please specify gender"
                  style={{ marginTop: '10px' }}
                  required
                />
              )}
              {errors.gender && <small style={{ color: '#e53e3e' }}>{errors.gender}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="bloodGroup">Blood Group <span className="optional">(Optional)</span></label>
              <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange}>
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* --- Contact Information --- */}
          <h3>Contact Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="phone">Mobile Number <span className="required">*</span></label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="10 digit number" maxLength="10" required />
              {errors.phone && <small style={{ color: '#e53e3e' }}>{errors.phone}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="parentMobile">Parent/Guardian Mobile <span className="required">*</span></label>
              <input type="tel" id="parentMobile" name="parentMobile" value={formData.parentMobile} onChange={handleChange} placeholder="10 digit number" maxLength="10" required />
              {errors.parentMobile && <small style={{ color: '#e53e3e' }}>{errors.parentMobile}</small>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="permanentAddress">Permanent Address <span className="required">*</span></label>
              <textarea id="permanentAddress" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} rows="3" required />
              {errors.permanentAddress && <small style={{ color: '#e53e3e' }}>{errors.permanentAddress}</small>}
            </div>
          </div>

          {/* --- Academic Information --- */}
          <h3>Academic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="programme">
                Programme <span className="required">*</span>
              </label>
              <select
                id="programme"
                name="programme"
                value={formData.programme}
                onChange={handleChange}
                required
              >
                <option value="">Select Programme</option>

                <optgroup label="Under Graduate Programmes">
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.Arch">B.Arch</option>
                  <option value="B.Sc B.Ed">B.Sc B.Ed</option>
                </optgroup>

                <optgroup label="Post Graduate Programmes">
                  <option value="M.Tech">M.Tech</option>
                  <option value="M.Arch">M.Arch</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                  <option value="M.A">M.A</option>
                </optgroup>

                <optgroup label="Research Programmes">
                  <option value="M.Sc (Research)">M.Sc (By Research)</option>
                  <option value="Ph.D">Ph.D</option>
                </optgroup>
              </select>

              {errors.programme && (
                <small style={{ color: '#e53e3e' }}>{errors.programme}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="branch">
                Branch / Department <span className="required">*</span>
              </label>
              <select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
              >
                <option value="">Select Branch / Department</option>

                <optgroup label="Engineering Departments">
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Computer Science and Engineering">
                    Computer Science and Engineering
                  </option>
                  <option value="Electrical and Electronics Engineering">
                    Electrical and Electronics Engineering
                  </option>
                  <option value="Electronics and Communication Engineering">
                    Electronics and Communication Engineering
                  </option>
                  <option value="Instrumentation and Control Engineering">
                    Instrumentation and Control Engineering
                  </option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Metallurgical and Materials Engineering">
                    Metallurgical and Materials Engineering
                  </option>
                  <option value="Production Engineering">Production Engineering</option>
                  <option value="Architecture">Architecture</option>
                </optgroup>

                <optgroup label="Science Departments">
                  <option value="Chemistry">Chemistry</option>
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Science">Computer Science</option>
                </optgroup>

                <optgroup label="Humanities & Management">
                  <option value="English">English (Language and Literature)</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Management Studies">Management Studies</option>
                </optgroup>

                <optgroup label="Other Departments">
                  <option value="Computer Applications">Computer Applications</option>
                  <option value="Energy and Environment">Energy and Environment</option>
                </optgroup>
              </select>

              {errors.branch && (
                <small style={{ color: '#e53e3e' }}>{errors.branch}</small>
              )}
            </div>



            <div className="form-group">
              <label htmlFor="batch">
                Batch/Year <span className="required">*</span>
              </label>
              <input
                type="text"
                id="batch"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g. 2021-2025"
                pattern="^\d{4}-\d{4}$"
                title="Format must be YYYY-YYYY (e.g., 2021-2025)"
                maxLength="9"
                required
              />
              {errors.batch && (
                <small style={{ color: '#e53e3e' }}>{errors.batch}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="semester">Current Semester <span className="required">*</span></label>
              <select id="semester" name="semester" value={formData.semester} onChange={handleChange} required>
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {errors.semester && <small style={{ color: '#e53e3e' }}>{errors.semester}</small>}
            </div>



            <div className="form-group">
              <label htmlFor="issuedBooks">No. of Issued Books <span className="required">*</span></label>
              <input type="number" id="issuedBooks" name="issuedBooks" value={formData.issuedBooks} onChange={handleChange} min="0" placeholder="0 if none" required />
              {errors.issuedBooks && <small style={{ color: '#e53e3e' }}>{errors.issuedBooks}</small>}
            </div>
          </div>

          {/* --- Request Details --- */}
          <h3>Request Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="requestCategory">Reason <span className="required">*</span></label>
              <select id="requestCategory" name="requestCategory" value={formData.requestCategory} onChange={handleChange} required>
                <option value="">Select Reason</option>
                <option value="New">New</option>
                <option value="Lost">Lost</option>
                <option value="Damaged">Damaged</option>
                <option value="Correction">Data Correction</option>
              </select>
              {errors.requestCategory && <small style={{ color: '#e53e3e' }}>{errors.requestCategory}</small>}
            </div>


          </div>

          <div className="button-group">
            <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">Exit</button>
            <button type="button" onClick={handleNextStep} className="btn btn-primary">Continue to Upload Documents →</button>
          </div>
        </form>
      </div>
    </div>
  )
}