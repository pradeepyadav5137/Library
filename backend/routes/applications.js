import express from 'express';
import { upload } from '../middleware/upload.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import {
  submitApplication,
  getApplicationStatus,
  getAllApplications,
} from '../controllers/applicationController.js';
import { validateApplicationSubmit } from '../utils/validators.js';

const router = express.Router();

// Submit application (applicant JWT from verify-email)
router.post('/submit', verifyToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'fir', maxCount: 1 },
  { name: 'payment', maxCount: 1 },
  { name: 'applicationPdf', maxCount: 1 }
]), validateApplicationSubmit, submitApplication);

// Get application status (public by ID)
router.get('/status/:applicationId', getApplicationStatus);

// Get all applications (admin only)
router.get('/all', verifyAdmin, getAllApplications);

export default router;
