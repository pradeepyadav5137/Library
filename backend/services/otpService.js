import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendMail } from './emailService.js';

export const OTP_EXPIRY_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 50;
export const OTP_COOLDOWN_SECONDS = 10;
export const MAX_VERIFICATION_ATTEMPTS = 5;

const generateRandomOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a new OTP, hash it, save to DB, and send via email
export const createAndSendOtp = async (email, subject, textTemplate, htmlTemplate) => {
  const existingOtpDoc = await Otp.findOne({ email });

  if (existingOtpDoc) {
    const now = new Date();

    // Cooldown check
    if (existingOtpDoc.lastAttempt && (now - existingOtpDoc.lastAttempt) < OTP_COOLDOWN_SECONDS * 1000) {
      throw new Error(`Please wait ${OTP_COOLDOWN_SECONDS} seconds before requesting a new OTP.`);
    }

    // Max attempts check
    if (existingOtpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      if (now < existingOtpDoc.expiresAt) {
        throw new Error('Maximum OTP attempts reached. Please try again later.');
      } else {
        await Otp.deleteOne({ _id: existingOtpDoc._id });
      }
    }
  }

  const rawOtp = generateRandomOtp();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  if (existingOtpDoc && existingOtpDoc.attempts < MAX_OTP_ATTEMPTS) {
    existingOtpDoc.otp = hashedOtp;
    existingOtpDoc.expiresAt = expiresAt;
    existingOtpDoc.lastAttempt = new Date();
    existingOtpDoc.attempts += 1;
    existingOtpDoc.verificationAttempts = 0;
    await existingOtpDoc.save();
  } else {
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt,
      lastAttempt: new Date(),
      attempts: 1,
      verificationAttempts: 0
    });
  }

  const text = textTemplate.replace('{{OTP}}', rawOtp);
  const html = htmlTemplate.replace('{{OTP}}', rawOtp);

  await sendMail(email, subject, text, html);
};

// Verify an OTP against the hashed value in DB
export const verifyOtp = async (email, rawOtp) => {
  // Atomic increment to prevent race conditions
  const otpDoc = await Otp.findOneAndUpdate(
    { email },
    { $inc: { verificationAttempts: 1 } },
    { new: true }
  );

  if (!otpDoc) {
    throw new Error('Invalid or expired OTP');
  }

  if (otpDoc.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new Error('OTP has expired');
  }

  if (otpDoc.verificationAttempts > MAX_VERIFICATION_ATTEMPTS) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  const isValid = await bcrypt.compare(rawOtp, otpDoc.otp);

  if (!isValid) {
    if (otpDoc.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpDoc._id });
      throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    }
    throw new Error(`Invalid OTP. ${MAX_VERIFICATION_ATTEMPTS - otpDoc.verificationAttempts} attempts remaining.`);
  }

  // OTP is valid — delete it (one-time use)
  await Otp.deleteOne({ _id: otpDoc._id });
  return true;
};
