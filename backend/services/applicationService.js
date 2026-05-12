import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Admin from '../models/Admin.js';
import { sendMail } from './emailService.js';

export const STATUS_FLOW = [
  'pending',
  'physical_copy_received',
  'verified',
  'printed'
];

export const updateApplicationStatusService = async (id, status, reason = null) => {
  if (!STATUS_FLOW.includes(status) && !['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  const application = await Application.findOne(
    { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { applicationId: id }] }
  );

  if (!application) {
    throw new Error('Application not found');
  }

  // Enforce valid transitions (no skipping)
  const oldStatusIndex = STATUS_FLOW.indexOf(application.status);
  const newStatusIndex = STATUS_FLOW.indexOf(status);

  if (oldStatusIndex !== -1 && newStatusIndex !== -1) {
    if (newStatusIndex !== oldStatusIndex + 1 && newStatusIndex !== oldStatusIndex) {
      throw new Error(`Cannot skip from ${application.status} to ${status}`);
    }
  }

  application.status = status;
  application.updatedAt = new Date();
  if (status === 'rejected' && reason) application.rejectionReason = reason;

  await application.save();

  // Determine next step
  const currentIndex = STATUS_FLOW.indexOf(status);
  let nextStep = null;
  if (currentIndex !== -1 && currentIndex < STATUS_FLOW.length - 1) {
    nextStep = STATUS_FLOW[currentIndex + 1];
  }

  // Send status update email
  const subject = `NITT ID Card Application Status Update: ${status}`;
  
  let contentHtml = `<p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>`;
  if (nextStep) {
    contentHtml += `<p style="margin: 5px 0;"><strong>Next Step:</strong> ${nextStep}</p>`;
  }
  if (status === 'rejected' && reason) {
    contentHtml += `<p style="margin: 5px 0; color: #c53030;"><strong>Reason:</strong> ${reason}</p>`;
  }

  const textTemplate = `Your application (${application.applicationId}) status has been updated to: ${status}.${nextStep ? `\nNext Step: ${nextStep}` : ''}${reason ? `\nReason: ${reason}` : ''}`;
  
  const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1a365d; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">National Institute of Technology, Tiruchirappalli</h1>
          <p style="color: #bae6fd; margin: 5px 0 0 0; font-size: 14px;">ID Card Portal</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #2d3748; margin-top: 0;">Status Update</h2>
          <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
            Hello, your application has received a status update.
          </p>
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Application ID:</strong> ${application.applicationId}</p>
            ${contentHtml}
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
  `;

  // Fire and forget
  sendMail(application.email, subject, textTemplate, htmlTemplate).catch(err => console.error('Status email error:', err));

  return application;
};

export const getApplicationStatsService = async () => {
  const [total, pending, approved, rejected, student, faculty] = await Promise.all([
    Application.countDocuments({ isDeleted: false }),
    Application.countDocuments({ status: { $in: ['pending', 'physical_copy_received', 'verified'] }, isDeleted: false }),
    Application.countDocuments({ status: { $in: ['approved', 'printed'] }, isDeleted: false }),
    Application.countDocuments({ status: 'rejected', isDeleted: false }),
    Application.countDocuments({ userType: 'student', isDeleted: false }),
    Application.countDocuments({ userType: { $in: ['faculty', 'staff'] }, isDeleted: false }),
  ]);
  return { total, pending, approved, rejected, student, faculty };
};

export const getAllApplicationsService = async (query) => {
  const { status, userType, search } = query;

  let dbQuery = { isDeleted: false };
  if (status && status !== 'all') dbQuery.status = status;
  if (userType && userType !== 'all') dbQuery.userType = userType;
  if (search) {
    dbQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNo: { $regex: search, $options: 'i' } },
      { applicationId: { $regex: search, $options: 'i' } },
    ];
  }

  return await Application.find(dbQuery).sort({ createdAt: -1 }).lean();
};
