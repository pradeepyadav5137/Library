import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Application from '../models/Application.js';
import Admin from '../models/Admin.js';
import { sendMail } from '../services/emailService.js';
import { deleteS3File } from '../services/adminService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

// S3 client for manual uploads (since we now use memory storage)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const MAX_ID_RETRIES = 5;

const generateAppId = (userType) => {
  const prefix = userType === 'student' ? 'STU' : userType === 'faculty' ? 'FAC' : 'STF';
  const year = new Date().getFullYear();
  const random = crypto.randomInt(0, 100000).toString().padStart(5, '0');
  return `NITT-${prefix}-${year}-${random}`;
};

/**
 * Upload a file buffer to S3 with a collision-resistant key.
 * Falls back to local filesystem if S3 is not configured.
 */
async function saveFile(fieldName, file, applicationId) {
  const ext = path.extname(file.originalname) ||
    (file.mimetype?.includes('png') ? '.png' : file.mimetype?.includes('pdf') ? '.pdf' : '.jpg');

  if (process.env.S3_BUCKET_NAME) {
    const timestamp = Date.now();
    const key = `applications/pending/${fieldName}-${timestamp}-${crypto.randomUUID()}${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return key;
  }

  // Local filesystem fallback
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const dir = path.join(uploadsDir, applicationId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${fieldName}-${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, file.buffer);

  return `${applicationId}/${filename}`;
}

export const submitApplication = async (req, res) => {
  const uploadedS3Keys = [];

  try {
    const body = req.body || {};
    const userType = req.user.userType;
    const email = req.user.email;
    const rollNo = req.user.rollNo || null;

    const applicationData = {
      applicationId: null,
      userType,
      email,
      rollNo,
      name: body.name,
      fatherName: body.fatherName,
      programme: body.programme,
      branch: body.branch,
      batch: body.batch,
      issuedBooks: body.issuedBooks,
      staffNo: body.staffNo,
      staffName: body.staffName,
      title: body.title,
      designation: body.designation,
      department: body.department,
      joiningDate: body.joiningDate || undefined,
      phone: body.phone,
      dob: body.dob || undefined,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      address: body.address,
      permanentAddress: body.permanentAddress,
      requestCategory: body.requestCategory,
      reasonDetails: body.reasonDetails,
      firNumber: body.firNumber,
      firRegisteredDate: body.firDate || body.firRegisteredDate,
      transactionNumber: body.transactionNumber,
      transactionDate: body.transactionDate,
      photoPath: null,
      firPath: null,
      paymentPath: null,
      applicationPdfUrl: null,
    };

    const files = req.files || {};
    if (files.photo?.[0]) {
      applicationData.photoPath = await saveFile('photo', files.photo[0], 'pending');
      if (process.env.S3_BUCKET_NAME) uploadedS3Keys.push(applicationData.photoPath);
    }
    if (body.photoBase64 && body.photoBase64.startsWith('data:image/')) {
      applicationData.photoBase64 = body.photoBase64;
    }
    if (files.fir?.[0]) {
      applicationData.firPath = await saveFile('fir', files.fir[0], 'pending');
      if (process.env.S3_BUCKET_NAME) uploadedS3Keys.push(applicationData.firPath);
    }
    if (files.payment?.[0]) {
      applicationData.paymentPath = await saveFile('payment', files.payment[0], 'pending');
      if (process.env.S3_BUCKET_NAME) uploadedS3Keys.push(applicationData.paymentPath);
    }
    if (files.applicationPdf?.[0]) {
      applicationData.applicationPdfUrl = await saveFile('applicationPdf', files.applicationPdf[0], 'pending');
      if (process.env.S3_BUCKET_NAME) uploadedS3Keys.push(applicationData.applicationPdfUrl);
    }

    // Retry loop for application ID collision
    let savedApplication;
    let applicationId;

    for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt++) {
      applicationId = generateAppId(userType);
      applicationData.applicationId = applicationId;

      try {
        const application = new Application(applicationData);
        savedApplication = await application.save();
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < MAX_ID_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    if (!savedApplication) {
      throw new Error('Failed to generate a unique application ID. Please try again.');
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
      application: savedApplication
    });

    // Send notification emails
    sendMail(
      savedApplication.email,
      'NITT ID Card Application Submitted',
      `Your application for a duplicate ID card has been submitted successfully.\n\nApplication ID: ${applicationId}\n\nYou can track your application status on our portal using this ID.`,
      `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1a365d; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">National Institute of Technology, Tiruchirappalli</h1>
          <p style="color: #bae6fd; margin: 5px 0 0 0; font-size: 14px;">ID Card Portal</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #2d3748; margin-top: 0;">Application Submitted</h2>
          <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
            Your application for a duplicate ID card has been submitted successfully.
          </p>
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 20px; font-weight: bold; color: #2b6cb0;">Application ID: ${applicationId}</span>
          </div>
          <p style="color: #4a5568; line-height: 1.6; font-size: 14px;">
            You can track your application status on our portal by visiting our website.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #c9a227; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; display: inline-block;">Visit Website</a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #a0aec0; font-size: 12px;">
            &copy; ${new Date().getFullYear()} NITT Library. All rights reserved.
          </p>
        </div>
      </div>
      `
    ).catch(err => console.error('Background Email Error (User):', err));

    try {
      const admins = await Admin.find({ email: { $exists: true } });
      const adminEmails = admins.map(admin => admin.email).filter(Boolean);
      if (adminEmails.length > 0) {
        sendMail(
          adminEmails,
          'New ID Card Application Received',
          `A new duplicate ID card application has been received.\n\nApplication ID: ${applicationId}\nApplicant: ${savedApplication.name || savedApplication.staffName}\nType: ${userType}`,
          `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">National Institute of Technology, Tiruchirappalli</h1>
              <p style="color: #bae6fd; margin: 5px 0 0 0; font-size: 14px;">ID Card Portal</p>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <h2 style="color: #2d3748; margin-top: 0;">New Application Received</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
                A new duplicate ID card application has been received.
              </p>
              <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                <p style="margin: 5px 0;"><strong>Applicant:</strong> ${savedApplication.name || savedApplication.staffName}</p>
                <p style="margin: 5px 0;"><strong>User Type:</strong> ${userType}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin-login'}" style="background-color: #c9a227; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; display: inline-block;">Login to Admin Panel</a>
              </div>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                &copy; ${new Date().getFullYear()} NITT Library. All rights reserved.
              </p>
            </div>
          </div>
          `
        ).catch(err => console.error('Background Email Error (Admins):', err));
      }
    } catch (adminFetchError) {
      console.error('Error fetching admins for notification:', adminFetchError);
    }

  } catch (error) {
    // Clean up uploaded S3 files if application save failed
    if (uploadedS3Keys.length > 0) {
      for (const key of uploadedS3Keys) {
        try {
          await deleteS3File(key);
        } catch (cleanupErr) {
          console.error('S3 cleanup error:', cleanupErr.message);
        }
      }
    }

    console.error('Submit error:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Error submitting application' });
  }
};

export const getApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!applicationId || typeof applicationId !== 'string' || applicationId.length > 50) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const application = await Application.findOne({ applicationId });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Return limited fields for public tracking (prevent PII exposure)
    const safeFields = {
      applicationId: application.applicationId,
      userType: application.userType,
      name: application.name,
      staffName: application.staffName,
      email: application.email,
      rollNo: application.rollNo,
      status: application.status,
      rejectionReason: application.rejectionReason,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      // Fields needed for PDF re-download
      fatherName: application.fatherName,
      programme: application.programme,
      branch: application.branch,
      batch: application.batch,
      issuedBooks: application.issuedBooks,
      staffNo: application.staffNo,
      title: application.title,
      designation: application.designation,
      department: application.department,
      joiningDate: application.joiningDate,
      retirementDate: application.retirementDate,
      phone: application.phone,
      parentMobile: application.parentMobile,
      dob: application.dob,
      gender: application.gender,
      bloodGroup: application.bloodGroup,
      address: application.address,
      permanentAddress: application.permanentAddress,
      requestCategory: application.requestCategory,
      reasonDetails: application.reasonDetails,
      firNumber: application.firNumber,
      firRegisteredDate: application.firRegisteredDate,
      transactionNumber: application.transactionNumber,
      transactionDate: application.transactionDate,
      photoBase64: application.photoBase64,
    };

    res.json({ success: true, application: safeFields });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ message: 'Error fetching application' });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({}).sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

