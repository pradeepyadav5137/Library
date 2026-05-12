import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { createAndSendOtp, verifyOtp, OTP_EXPIRY_MINUTES } from './otpService.js';

export const issueJwtCookie = (res, payload, expiresInStr, maxAgeMs) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiresInStr });
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: maxAgeMs
  });
  return token;
};

export const verifyAdminCredentials = async (username, password) => {
  const admin = await Admin.findOne({ username });
  if (!admin) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  return admin;
};

export const sendAdminLoginOtp = async (admin) => {
  const subject = 'NITT Admin – Login OTP';
  const textTemplate = `Your OTP for admin login is: {{OTP}}. It is valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this with anyone.`;
  const htmlTemplate = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background-color: #1a365d; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">National Institute of Technology, Tiruchirappalli</h1>
        <p style="color: #bae6fd; margin: 5px 0 0 0; font-size: 14px;">Admin Portal</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #2d3748; margin-top: 0;">Admin Login OTP</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Your One-Time Password (OTP) for admin login is:
        </p>
        <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px;">{{OTP}}</span>
        </div>
        <p style="color: #4a5568; line-height: 1.6; font-size: 14px;">
          This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. Please do not share this code with anyone.
        </p>
        <p style="color: #718096; line-height: 1.6; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          If you did not attempt to login, please secure your account immediately.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #a0aec0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} NITT Library. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await createAndSendOtp(admin.email, subject, textTemplate, htmlTemplate);
};

export const verifyAdminLoginOtpAndIssueToken = async (res, username, rawOtp) => {
  const admin = await Admin.findOne({ username });
  if (!admin) {
    throw new Error('Invalid credentials');
  }

  await verifyOtp(admin.email, rawOtp);

  const payload = { id: admin._id, username: admin.username, role: admin.role };
  const token = issueJwtCookie(res, payload, '24h', 24 * 60 * 60 * 1000);

  return { token, admin: { id: admin._id, username: admin.username, role: admin.role } };
};

export const logoutUser = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
};
