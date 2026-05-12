import Admin from '../models/Admin.js';
import {
  verifyAdminCredentials,
  sendAdminLoginOtp,
  verifyAdminLoginOtpAndIssueToken,
  logoutUser,
  issueJwtCookie
} from '../services/authService.js';
import { createAndSendOtp, verifyOtp, OTP_EXPIRY_MINUTES } from '../services/otpService.js';

export const sendOtp = async (req, res) => {
  try {
    const { rollNo, email, userType } = req.body;

    let targetEmail = null;
    let rollNoLock = null;

    if (userType === 'student') {
      if (!rollNo || typeof rollNo !== 'string') {
        return res.status(400).json({ message: 'Roll number is required' });
      }
      const cleanRoll = rollNo.trim().toLowerCase();
      if (!cleanRoll) {
        return res.status(400).json({ message: 'Valid roll number is required' });
      }
      if (!/^\d{9}$/.test(cleanRoll)) {
        return res.status(400).json({ message: 'Roll number must be exactly 9 digits' });
      }
      targetEmail = `${cleanRoll}@nitt.edu`;
      rollNoLock = cleanRoll;
    } else if (userType === 'faculty' || userType === 'staff') {
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Institute webmail is required' });
      }
      const e = email.trim().toLowerCase();
      if (!e.endsWith('@nitt.edu')) {
        return res.status(400).json({ message: 'Only @nitt.edu webmail is allowed' });
      }
      targetEmail = e;
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    const subject = 'NITT ID Card Re-issue – OTP Verification';
    const textTemplate = `Your OTP is: {{OTP}}. It is valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this with anyone.`;
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1a365d; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">National Institute of Technology, Tiruchirappalli</h1>
          <p style="color: #bae6fd; margin: 5px 0 0 0; font-size: 14px;">ID Card Portal</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #2d3748; margin-top: 0;">OTP Verification</h2>
          <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
            Your One-Time Password (OTP) for verifying your email address is:
          </p>
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px;">{{OTP}}</span>
          </div>
          <p style="color: #4a5568; line-height: 1.6; font-size: 14px;">
            This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. Please do not share this code with anyone.
          </p>
          <p style="color: #718096; line-height: 1.6; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            If you did not request this verification, please ignore this email.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #a0aec0; font-size: 12px;">
            &copy; ${new Date().getFullYear()} NITT Library. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await createAndSendOtp(targetEmail, subject, textTemplate, htmlTemplate);

    res.json({
      success: true,
      message: 'OTP sent to your institute webmail',
      email: targetEmail,
      ...(rollNoLock != null ? { rollNo: rollNoLock } : {})
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(error.message.includes('wait') || error.message.includes('Maximum') ? 429 : 500)
       .json({ message: error.message || 'Failed to send OTP. Please try again.' });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    if (!email || !otp || !userType) {
      return res.status(400).json({ message: 'Email, OTP and user type are required' });
    }

    const e = email.trim().toLowerCase();

    await verifyOtp(e, String(otp).trim());

    const payload = {
      email: e,
      userType,
      verified: true
    };
    if (userType === 'student') {
      const rollNo = e.replace(/@nitt\.edu$/, '');
      payload.rollNo = rollNo;
    }

    const token = issueJwtCookie(res, payload, '2h', 2 * 60 * 60 * 1000);

    res.json({
      success: true,
      token,
      email: e,
      userType,
      ...(payload.rollNo ? { rollNo: payload.rollNo } : {})
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({ message: error.message || 'Verification failed' });
  }
};

export const adminLoginStep1 = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const admin = await verifyAdminCredentials(username, password);
    await sendAdminLoginOtp(admin);

    res.json({ success: true, require2fa: true, message: 'OTP sent to admin email' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

export const adminLoginStep2 = async (req, res) => {
  try {
    const { username, otp } = req.body;
    if (!username || !otp) {
      return res.status(400).json({ message: 'Username and OTP required' });
    }

    const result = await verifyAdminLoginOtpAndIssueToken(res, username, otp);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ message: error.message || 'Invalid credentials' });
  }
};

export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }
    const e = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: e });
    if (!admin) {
      return res.status(404).json({ message: 'No admin account found with this email' });
    }

    const subject = 'NITT Admin – Password Reset OTP';
    const textTemplate = `Your OTP is: {{OTP}}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`;
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1a365d; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">National Institute of Technology, Tiruchirappalli</h1>
          <p style="color: #bae6fd; margin: 5px 0 0 0; font-size: 14px;">Admin Portal</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #2d3748; margin-top: 0;">Password Reset OTP</h2>
          <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
            Your One-Time Password (OTP) for resetting your admin password is:
          </p>
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px;">{{OTP}}</span>
          </div>
          <p style="color: #4a5568; line-height: 1.6; font-size: 14px;">
            This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. Please do not share this code with anyone.
          </p>
          <p style="color: #718096; line-height: 1.6; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #a0aec0; font-size: 12px;">
            &copy; ${new Date().getFullYear()} NITT Library. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await createAndSendOtp(e, subject, textTemplate, htmlTemplate);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(error.message.includes('wait') || error.message.includes('Maximum') ? 429 : 500)
       .json({ message: error.message || 'Failed to send OTP' });
  }
};

export const adminResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }
    const e = email.trim().toLowerCase();

    await verifyOtp(e, String(otp).trim());

    const admin = await Admin.findOne({ email: e });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ message: error.message || 'Failed to update password' });
  }
};

export const logout = (req, res) => {
  logoutUser(res);
  res.json({ success: true, message: 'Logged out successfully' });
};
