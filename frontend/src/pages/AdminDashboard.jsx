'use client';

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI, authAPI } from '../services/api'
import { generateStudentPDF, generateFacultyStaffPDF } from '../services/pdfGenerator'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import './Admin.css'
// import './AdminDashboard.css'

const formatDate = (value) => {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-IN')
  } catch {
    return value
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState(null)
  const [action, setAction] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [addAdminUsername, setAddAdminUsername] = useState('')
  const [addAdminEmail, setAddAdminEmail] = useState('')
  const [addAdminPassword, setAddAdminPassword] = useState('')
  const [addAdminRole, setAddAdminRole] = useState('admin')
  const [addAdminError, setAddAdminError] = useState('')
  const [addAdminLoading, setAddAdminLoading] = useState(false)
  const [addAdminSuccess, setAddAdminSuccess] = useState('')

  const [admins, setAdmins] = useState([])
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [fileViewer, setFileViewer] = useState(null) // { url, isPdf, label, loading, error }

  useEffect(() => {
    // const token = localStorage.getItem('adminToken')
    // if (!token) {
    //   navigate('/admin-login')
    //   return
    // }

    fetchData()
  }, [navigate])

  const fetchData = async () => {
    try {
      const [appRes, statsRes, adminsRes] = await Promise.all([
        adminAPI.getApplications(),
        adminAPI.getDashboardStats(),
        adminAPI.getAllAdmins()
      ])

      setApplications(appRes.applications || appRes || [])
      setStats(statsRes.stats || statsRes || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      })
      setAdmins(adminsRes.admins || [])

      // Get current admin from localStorage
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
      setCurrentAdmin(adminUser)

    } catch (err) {
      console.error('Error fetching data:', err)
    }
    setLoading(false)
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('Please select a new status')
      return
    }
    try {
      await adminAPI.updateStatus(selectedApp.applicationId, newStatus, notes)
      setSelectedApp(null)
      setAction(null)
      setNewStatus('')
      setNotes('')
      fetchData()
      alert('Application status updated successfully!')
    } catch (err) {
      alert('Error updating application: ' + err.message)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    try {
      // FIXED: Changed from adminAPI.reject() to adminAPI.updateStatus()
      await adminAPI.updateStatus(selectedApp.applicationId, 'rejected', notes)
      setSelectedApp(null)
      setAction(null)
      setNotes('')
      fetchData()
      alert('Application rejected successfully!')
    } catch (err) {
      alert('Error rejecting application: ' + err.message)
    }
  }

  const handleLogout = async () => {
    await authAPI.logout()
    // localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/')
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setAddAdminError('')
    setAddAdminSuccess('')
    setAddAdminLoading(true)
    try {
      await adminAPI.createAdmin(addAdminUsername.trim(), addAdminEmail.trim(), addAdminPassword, addAdminRole)
      setAddAdminSuccess('Admin added successfully.')
      setAddAdminUsername('')
      setAddAdminEmail('')
      setAddAdminPassword('')
      fetchData() // Refresh list
      setTimeout(() => {
        setShowAddAdmin(false);
        setAddAdminSuccess('');
      }, 2000)
    } catch (err) {
      setAddAdminError(err.message || 'Failed to add admin')
    }
    setAddAdminLoading(false)
  }

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return

    try {
      await adminAPI.deleteAdmin(adminId)
      alert('Admin deleted successfully')
      fetchData()
    } catch (err) {
      alert(err.message || 'Failed to delete admin')
    }
  }

  const handleRoleChange = async (adminId, newRole) => {
    try {
      await adminAPI.updateAdminRole(adminId, newRole)
      alert('Admin role updated successfully')
      fetchData()
    } catch (err) {
      alert(err.message || 'Failed to update admin role')
    }
  }

  const handleHardDelete = async (appId) => {
    if (!window.confirm('⚠ WARNING: This will permanently delete all data and files for this application. This action cannot be undone. Are you sure?')) return

    try {
      await adminAPI.hardDelete(appId)
      alert('Application and all associated files deleted permanently')
      setSelectedApp(null)
      fetchData()
    } catch (err) {
      alert(err.message || 'Failed to delete application')
    }
  }

  const filteredApps = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter)

  if (loading) return (
    <div className="form-container">
      <div className="form-card">
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          margin: '40px auto',
          border: '3px solid rgba(201, 162, 39, 0.3)',
          borderTopColor: '#c9a227'
        }}></div>
      </div>
    </div>
  )

  return (
    <div className="form-containers admin-dashboard">
      <div className="form-card">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="form-description">Manage all ID card applications from students, faculty, and staff</p>
          </div>
          <div className="admin-header-actions">
            <button
              onClick={() => setShowAddAdmin(!showAddAdmin)}
              className={`btn btn-secondary ${showAddAdmin ? 'active' : ''}`}
            >
              {showAddAdmin ? '✕ Hide Add Admin' : '➕ Add new admin'}
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Add Admin Form */}
        {showAddAdmin && (
          <div className="info-box admin-form" style={{ marginBottom: '30px' }}>
            <div className="admin-mgmt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
              <div>
                <h3>Add New Admin Account</h3>
                {addAdminError && <div className="error-message">{addAdminError}</div>}
                {addAdminSuccess && <div className="success-message">{addAdminSuccess}</div>}
                <form onSubmit={handleAddAdmin}>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={addAdminUsername}
                      onChange={(e) => setAddAdminUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={addAdminEmail}
                      onChange={(e) => setAddAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={addAdminPassword}
                      onChange={(e) => setAddAdminPassword(e.target.value)}
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select value={addAdminRole} onChange={(e) => setAddAdminRole(e.target.value)} required>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>
                  <div className="button-group" style={{ marginTop: '20px' }}>
                    <button type="submit" disabled={addAdminLoading} className="btn btn-primary">
                      {addAdminLoading ? 'Adding...' : 'Add Admin'}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3>Manage Existing Admins</h3>
                <div className="admin-list" style={{ marginTop: '15px' }}>
                  {admins.length === 0 ? (
                    <p>No other admins found</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '14px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Username</th>
                          <th style={{ textAlign: 'left' }}>Email</th>
                          <th style={{ textAlign: 'left' }}>Role</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map(admin => (
                          <tr key={admin._id}>
                            <td>{admin.username}</td>
                            <td>{admin.email}</td>
                            <td>
                              {(currentAdmin?.role === 'superadmin' || currentAdmin?.email === '205124066@nitt.edu') && admin._id !== currentAdmin?._id ? (
                                <select 
                                  value={admin.role || 'admin'} 
                                  onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="superadmin">Super Admin</option>
                                  <option value="supervisor">Supervisor</option>
                                </select>
                              ) : (
                                <span className={`status-badge status-${admin.role || 'admin'}`} style={{ fontSize: '12px' }}>
                                  {admin.role || 'admin'}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {admin._id !== currentAdmin?._id ? (
                                <button
                                  onClick={() => handleDeleteAdmin(admin._id)}
                                  style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              ) : (
                                <span style={{ color: '#718096', fontSize: '12px' }}>(You)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><FileText size={32} /></div>
              <div className="stat-number">{stats.total || 0}</div>
              <div className="stat-label">Total Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Clock size={32} /></div>
              <div className="stat-number">{stats.pending || 0}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={32} /></div>
              <div className="stat-number">{stats.approved || 0}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><XCircle size={32} /></div>
              <div className="stat-number">{stats.rejected || 0}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-title">
            <h3>Applications ({applications.length})</h3>
            <small>Showing {filter === 'all' ? 'all' : filter} applications</small>
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({applications.length})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({applications.filter(a => a.status === 'pending').length})
            </button>
            <button
              className={`filter-btn ${filter === 'physical_copy_received' ? 'active' : ''}`}
              onClick={() => setFilter('physical_copy_received')}
            >
              Physical Copy Received ({applications.filter(a => a.status === 'physical_copy_received').length})
            </button>
            <button
              className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
              onClick={() => setFilter('verified')}
            >
              Verified ({applications.filter(a => a.status === 'verified').length})
            </button>
            <button
              className={`filter-btn ${filter === 'printed' ? 'active' : ''}`}
              onClick={() => setFilter('printed')}
            >
              Printed ({applications.filter(a => a.status === 'printed').length})
            </button>
            <button
              className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected ({applications.filter(a => a.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="applications-table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: '#718096', fontSize: '14px' }}>
                      {applications.length === 0 ? 'No applications found in database' : 'No applications match the selected filter'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app._id || app.applicationId}>
                    <td>
                      <strong>{app.applicationId || 'N/A'}</strong>
                    </td>
                    <td>
                      <div className="applicant-name">
                        {app.userType === 'student' ? app.name : (app.staffName || app.name || 'N/A')}
                      </div>
                    </td>
                    <td>{app.email || 'N/A'}</td>
                    <td>
                      <span className={`type-badge type-${app.userType}`}>
                        {app.userType || 'unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status ? app.status.replace(/_/g, ' ') : 'pending'}
                      </span>
                    </td>
                    <td>
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="action-btn view-btn"
                        onClick={() => {
                          setSelectedApp(app)
                          setAction(null)
                        }}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="app-details-section">
                <h4>Basic Information</h4>
                <div className="form-grid three-cols">
                  <div className="form-group">
                    <label>Application ID</label>
                    <div className="detail-value">{selectedApp.applicationId || 'N/A'}</div>
                  </div>
                  <div className="form-group">
                    <label>User Type</label>
                    <div className="detail-value">
                      <span className={`type-badge type-${selectedApp.userType}`}>
                        {selectedApp.userType || 'unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <div className="detail-value">
                      <span className={`status-badge status-${selectedApp.status}`}>
                        {selectedApp.status ? selectedApp.status.replace(/_/g, ' ') : 'pending'}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="detail-value">{selectedApp.email || 'N/A'}</div>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <div className="detail-value">{selectedApp.phone || 'N/A'}</div>
                  </div>
                  <div className="form-group">
                    <label>Submitted On</label>
                    <div className="detail-value">
                      {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="app-details-section">
                <h4>
                  {selectedApp.userType === 'student' ? 'Student Details' : 'Staff Details'}
                </h4>
                <div className="form-grid three-cols">
                  {selectedApp.userType === 'student' ? (
                    <>
                      <div className="form-group">
                        <label>Name</label>
                        <div className="detail-value">{selectedApp.name || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Roll No.</label>
                        <div className="detail-value">{selectedApp.rollNo || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Branch</label>
                        <div className="detail-value">{selectedApp.branch || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Parent's Name</label>
                        <div className="detail-value">{selectedApp.fatherName || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>No. of Issued Books</label>
                        <div className="detail-value">{selectedApp.issuedBooks || '0'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Name</label>
                        <div className="detail-value">{selectedApp.staffName || selectedApp.name || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Staff No.</label>
                        <div className="detail-value">{selectedApp.staffNo || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Designation</label>
                        <div className="detail-value">{selectedApp.designation || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Title</label>
                        <div className="detail-value">{selectedApp.title || 'N/A'}</div>
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <div className="detail-value">{selectedApp.department || 'N/A'}</div>
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <div className="detail-value">{formatDate(selectedApp.dob)}</div>
                  </div>
                  {selectedApp.userType === 'student' && (
                    <div className="form-group">
                      <label>Blood Group</label>
                      <div className="detail-value">{selectedApp.bloodGroup || 'Not specified'}</div>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Request Category</label>
                    <div className="detail-value">{selectedApp.requestCategory || 'N/A'}</div>
                  </div>
                  <div className="form-group full-width">
                    <label>Reason / Details</label>
                    <div className="detail-value">{selectedApp.reasonDetails || 'No details provided'}</div>
                  </div>
                  {selectedApp.status === 'rejected' && (
                    <div className="form-group full-width">
                      <label style={{ color: '#e53e3e' }}>Rejection Reason</label>
                      <div className="detail-value" style={{ borderColor: '#feb2b2', backgroundColor: '#fff5f5' }}>
                        {selectedApp.rejectionReason || 'No reason specified'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="app-details-section">
                <h4>Uploaded Documents</h4>
                <div className="documents-grid">
                  {[
                    { url: selectedApp.photoUrl, label: 'Photograph', icon: '📷', isPdf: false },
                    { url: selectedApp.firUrl, label: 'FIR Copy', icon: '📄', isPdf: selectedApp.firPath?.endsWith('.pdf') },
                    { url: selectedApp.paymentUrl, label: 'Payment Receipt', icon: '💰', isPdf: selectedApp.paymentPath?.endsWith('.pdf') },
                    { url: selectedApp.pdfUrl, label: 'Application Form', icon: '📋', isPdf: true },
                  ].filter(doc => doc.url).map((doc, i) => (
                    <div className="document-item" key={i}>
                      <div className="doc-icon">{doc.icon}</div>
                      <div className="doc-info">
                        <strong>{doc.label}</strong>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="doc-link"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', textDecoration: 'underline' }}
                            onClick={() => {
                              setFileViewer({
                                url: doc.url,
                                isPdf: doc.isPdf,
                                label: doc.label,
                                loading: true,
                                error: null
                              })

                              // Small delay to simulate validation
                              setTimeout(() => {
                                setFileViewer(prev => ({
                                  ...prev,
                                  loading: false
                                }))
                              }, 100)
                            }}


                          >
                            👁 View
                          </button>
                          {/* <a
                            href={doc.url}
                            download
                            className="doc-link"
                            style={{ color: 'inherit' }}
                          >
                            ⬇ Download
                          </a> */}
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="doc-link"
                          >
                            ⬇ Download
                          </a>

                        </div>
                      </div>
                    </div>
                  ))}
                  {!selectedApp.photoPath && !selectedApp.firPath && !selectedApp.paymentPath && !selectedApp.applicationPdfUrl && (
                    <div style={{ color: '#718096', textAlign: 'center', width: '100%', padding: '20px' }}>
                      No documents uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="decision-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> */}
              <div className="decision-section">
                <div className="action-buttons" style={{ gap: '15px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontWeight: 'bold' }}
                    onClick={async () => {
                      if (!selectedApp) return
                      if (selectedApp.userType === 'student') {
                        await generateStudentPDF(selectedApp)
                      } else {
                        await generateFacultyStaffPDF(selectedApp)
                      }
                    }}
                  >
                    📥 Download Application PDF
                  </button>

                  <button
                    className="btn btn-danger"
                    style={{ fontWeight: 'bold' }}
                    onClick={() => handleHardDelete(selectedApp.applicationId)}
                  >
                    🗑 Permanent Delete
                  </button>
                </div>
              </div>
              {selectedApp.status !== 'rejected' && selectedApp.status !== 'printed' && (
                <div className="decision-section">
                  {!action ? (
                    <div className="action-buttons" style={{ gap: '15px' }}>
                      <button
                        className="btn btn-success"
                        onClick={() => { setAction('update'); setNewStatus(''); }}
                        style={{ fontWeight: 'bold' }}
                      >
                        🔄 Update Status
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setAction('reject')}
                        style={{ fontWeight: 'bold' }}
                      >
                        ❌ Reject Application
                      </button>
                    </div>
                  ) : (
                    <div className="action-form">
                      <h4>{action === 'update' ? 'Update Application Status' : 'Reject Application'}</h4>
                      {action === 'update' && (
                        <div className="form-group">
                          <label>New Status *</label>
                          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} required>
                            <option value="">Select Status...</option>
                            <option value="physical_copy_received">Physical Copy Received</option>
                            <option value="verified">Verified</option>
                            <option value="printed">Printed (Ready for Collection)</option>
                          </select>
                        </div>
                      )}
                      <div className="form-group">
                        <label>
                          {action === 'update' ? 'Notes (Optional)' : 'Reason for Rejection *'}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={
                            action === 'reject'
                              ? 'Please provide a detailed reason for rejection...'
                              : 'Add any notes or comments...'
                          }
                          rows="3"
                          required={action === 'reject'}
                        />
                      </div>
                      <div className="button-group">
                        <button
                          className={action === 'update' ? 'btn btn-success' : 'btn btn-danger'}
                          onClick={action === 'update' ? handleUpdateStatus : handleReject}
                        >
                          {action === 'update' ? 'Confirm Update' : 'Confirm Rejection'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setAction(null)
                            setNewStatus('')
                            setNotes('')
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {fileViewer && (
        <div
          className="file-viewer-overlay"
          onClick={() => setFileViewer(null)}
        >
          <div
            className="file-viewer-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{fileViewer.label}</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {fileViewer.url && !fileViewer.loading && (
                  <a
                    href={fileViewer.url}
                    download
                    className="btn btn-secondary"
                    style={{ fontSize: '13px', padding: '6px 14px', textDecoration: 'none' }}
                  >
                    ⬇ Download
                  </a>
                )}
                <button className="close-btn" onClick={() => setFileViewer(null)}>×</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding: '16px', background: '#f7f7f7', borderRadius: '8px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {fileViewer.loading ? (
                <div style={{ textAlign: 'center', color: '#4a5568' }}>
                  <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }}></div>
                  <p>Loading file...</p>
                </div>
              ) : fileViewer.error ? (
                <div style={{ textAlign: 'center', color: '#e53e3e', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                  <p style={{ fontWeight: '600' }}>{fileViewer.error}</p>
                  <p style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>The file may have been deleted or the link has expired.</p>
                </div>
              ) : fileViewer.isPdf ? (
                <iframe
                  src={fileViewer.url}
                  title={fileViewer.label}
                  style={{ width: '100%', height: '600px', border: 'none', borderRadius: '6px' }}
                />
                

              ) : (
                <img
                  src={fileViewer.url}
                  alt={fileViewer.label}
                  onError={(e) => { e.target.style.display = 'none'; setFileViewer(prev => ({ ...prev, error: 'File not found or could not be loaded.' })) }}
                  style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}