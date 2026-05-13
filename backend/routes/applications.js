import express from 'express';
import AWS from 'aws-sdk';
import { upload } from '../middleware/upload.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import {
  submitApplication,
  getApplicationStatus,
  getAllApplications,
} from '../controllers/applicationController.js';
import { validateApplicationSubmit } from '../utils/validators.js';

const router = express.Router();

// ---- S3 signed URL helper ----
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// GET /api/applications/signed-url?key=applications/...
// Returns a 60-second pre-signed URL for a private S3 object.
// Requires the caller to supply the exact S3 key (which they already have
// from the application data), so there is no security escalation.
router.get('/signed-url', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return res.status(400).json({ message: 'S3 key is required' });
    }
    // Only allow keys inside the applications/ prefix
    if (!key.startsWith('applications/')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const filename = key.split('/').pop() || 'download';
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Expires: 120,
    };
    // ?download=1 → force browser save-as instead of opening in-tab
    if (req.query.download === '1') {
      params.ResponseContentDisposition = `attachment; filename="${filename}"`;
    }
    const url = s3.getSignedUrl('getObject', params);
    res.json({ url });
  } catch (err) {
    console.error('Signed URL error:', err);
    res.status(500).json({ message: 'Failed to generate signed URL' });
  }
});

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
