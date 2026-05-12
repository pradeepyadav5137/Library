import express from 'express';
import {
  adminLoginStep1,
  adminLoginStep2,
  adminForgotPassword,
  adminResetPassword,
  verifyEmailOtp,
  sendOtp,
  logout,
} from '../controllers/authController.js';

const router = express.Router();

// Admin Login (2FA)
router.post('/admin-login', adminLoginStep1);
router.post('/admin-login-step2', adminLoginStep2);

router.post('/admin-forgot-password', adminForgotPassword);
router.post('/admin-reset-password', adminResetPassword);

// Send OTP (student: rollNo → rollno@nitt.edu; faculty/staff: email @nitt.edu)
router.post('/send-otp', sendOtp);

// Verify OTP (email, otp, userType) – returns JWT with locked email/rollNo
router.post('/verify-email', verifyEmailOtp);

// Logout
router.post('/logout', logout);

export default router;
