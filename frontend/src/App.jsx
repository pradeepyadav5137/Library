import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import EmailVerification from './pages/EmailVerification'
import StudentForm from './pages/StudentForm'
import FileUpload from './pages/FileUpload'
import FacultyStaffFlow from './pages/FacultyStaffFlow'
import PreviewNew from './pages/PreviewNew'
import SuccessPage from './pages/SubmissionSuccess'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import TrackApplication from './pages/TrackApplication'

// In your Routes

// Inside your Routes component

import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* All routes wrapped in Layout for Header + Footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/apply/:userType" element={<EmailVerification />} />
          <Route path="/student-form" element={<StudentForm />} />
          <Route path="/upload-documents" element={<FileUpload />} />
          <Route path="/preview" element={<PreviewNew />} />
          <Route path="/success/:applicationId" element={<SuccessPage />} />
          <Route path="/apply/faculty-staff" element={<FacultyStaffFlow />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/track/:applicationId" element={<TrackApplication />} />



        </Route>
      </Routes>
    </Router>
  )
}

export default App
