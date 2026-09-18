import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Admin from '../models/Admin.js';
import {
  attachSignedUrls,
  deleteS3File,
  generateS3SignedUrl,
  checkSuperadmin
} from '../services/adminService.js';
import {
  updateApplicationStatusService,
  getApplicationStatsService,
  getAllApplicationsService
} from '../services/applicationService.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { clearAdminCache } from '../middleware/adminAuth.js';

// Get all applications with signed URLs
export const getAllApplications = async (req, res) => {
  try {
    const applications = await getAllApplicationsService(req.query);
    const applicationsWithUrls = await Promise.all(applications.map(app => attachSignedUrls(app, 3600)));
    res.json({ success: true, applications: applicationsWithUrls, count: applicationsWithUrls.length });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await getApplicationStatsService();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Get single application by ID with signed URLs
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).lean();
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const appData = await attachSignedUrls(application, 3600);
    res.json({ success: true, application: appData });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

// Update application status (enforces workflow transitions)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const application = await updateApplicationStatusService(id, status, reason);
    res.json({ success: true, message: `Application status updated successfully`, application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(error.message === 'Invalid status' || error.message === 'Application not found' ? 400 : 500)
       .json({ message: error.message || 'Failed to update status' });
  }
};

// Soft delete (mark as deleted, keep in DB)
export const softDeleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Soft delete error:', error);
    res.status(500).json({ message: 'Failed to delete application' });
  }
};

// Hard delete (remove from DB + S3 files, superadmin only)
export const hardDeleteApplication = async (req, res) => {
  try {
    checkSuperadmin(req.admin);
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };
    const application = await Application.findOne(query);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Delete S3 files first — if any fail, abort the DB deletion
    const s3Keys = [
      application.photoPath,
      application.firPath,
      application.paymentPath,
      application.applicationPdfUrl,
    ].filter(Boolean);

    const deletionResults = await Promise.allSettled(
      s3Keys.map(key => deleteS3File(key, { throwOnError: true }))
    );

    const failures = deletionResults.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('S3 deletion failures during hard delete:', failures.map(f => f.reason?.message));
      return res.status(500).json({
        message: 'Failed to delete some associated files. Application was not deleted. Please try again.'
      });
    }

    await Application.findByIdAndDelete(application._id);

    res.json({ success: true, message: 'Application and all associated files permanently deleted' });
  } catch (error) {
    console.error('Hard delete error:', error);
    res.status(error.message.includes('superadmin') ? 403 : 500).json({ message: error.message || 'Failed to permanently delete application' });
  }
};

// Create new admin (superadmin only)
export const createAdmin = async (req, res) => {
  try {
    checkSuperadmin(req.admin);
    const { username, email, password, role } = req.body;

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) return res.status(400).json({ message: 'Admin with this username or email already exists' });

    const admin = new Admin({ username, email, password, role: role || 'admin' });
    await admin.save();
    res.json({ success: true, message: 'Admin created successfully', admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(error.message.includes('superadmin') ? 403 : 500).json({ message: error.message || 'Failed to create admin' });
  }
};

// Get all admins (passwords excluded)
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, admins, count: admins.length });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

// Delete admin (superadmin only, cannot delete self)
export const deleteAdmin = async (req, res) => {
  try {
    checkSuperadmin(req.admin);
    const { id } = req.params;
    if (req.admin.id === id) return res.status(400).json({ message: 'Cannot delete your own account' });

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Invalidate cached auth for deleted admin
    clearAdminCache(id);

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(error.message.includes('superadmin') ? 403 : 500).json({ message: error.message || 'Failed to delete admin' });
  }
};

// Update admin role (superadmin only, cannot change own role)
export const updateAdminRole = async (req, res) => {
  try {
    checkSuperadmin(req.admin);
    const { id } = req.params;
    const { role } = req.body;

    if (req.admin.id === id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    if (!['admin', 'supervisor', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const admin = await Admin.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Invalidate cached auth so role change takes effect immediately
    clearAdminCache(id);

    res.json({ success: true, message: 'Admin role updated successfully', admin });
  } catch (error) {
    console.error('Update admin role error:', error);
    res.status(error.message.includes('superadmin') ? 403 : 500).json({ message: error.message || 'Failed to update admin role' });
  }
};
