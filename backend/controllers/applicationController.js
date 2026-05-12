import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Application from '../models/Application.js';
import Admin from '../models/Admin.js';
import { sendMail } from '../services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

const generateAppId = (userType) => {
  const prefix = userType === 'student' ? 'STU' : userType === 'faculty' ? 'FAC' : 'STF';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `NITT-${prefix}-${year}-${random}`;
};

async function saveFile(fieldName, file, applicationId) {
  if (file.key) {
    console.log(`File uploaded to S3. Key: ${file.key}`);
    return file.key;
  }
  const ext = path.extname(file.originalname) ||
    (file.mimetype?.includes('png') ? '.png' : file.mimetype?.includes('pdf') ? '.pdf' : '.jpg');

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const dir = path.join(uploadsDir, applicationId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${fieldName}-${Date.now()}${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, file.buffer);

  return `${applicationId}/${filename}`;
}

export const submitApplication = async (req, res) => {
  try {
    const body = req.body || {};
    const userType = body.userType;
    const applicationId = generateAppId(userType);

    const applicationData = {
      applicationId,
      userType,
      email: body.email,
      rollNo: body.rollNo,
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
    if (files.photo?.[0]) applicationData.photoPath = await saveFile('photo', files.photo[0], applicationId);
    if (files.fir?.[0]) applicationData.firPath = await saveFile('fir', files.fir[0], applicationId);
    if (files.payment?.[0]) applicationData.paymentPath = await saveFile('payment', files.payment[0], applicationId);
    if (files.applicationPdf?.[0]) applicationData.applicationPdfUrl = await saveFile('applicationPdf', files.applicationPdf[0], applicationId);

    const application = new Application(applicationData);
    await application.save();

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
      application
    });

    sendMail(
      application.email,
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
          `A new duplicate ID card application has been received.\n\nApplication ID: ${applicationId}\nApplicant: ${application.name || application.staffName}\nType: ${userType}`,
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
                <p style="margin: 5px 0;"><strong>Applicant:</strong> ${application.name || application.staffName}</p>
                <p style="margin: 5px 0;"><strong>User Type:</strong> ${userType}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin/dashboard'}" style="background-color: #c9a227; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; display: inline-block;">Login to Admin Panel</a>
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
    console.error('Submit error:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Error submitting application' });
  }
};

export const getApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findOne({ applicationId: req.params.applicationId });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ success: true, application });
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
