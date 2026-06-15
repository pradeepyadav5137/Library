import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendMail } from './emailService.js';

export const OTP_EXPIRY_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_COOLDOWN_SECONDS = 10;

const generateRandomOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createAndSendOtp = async (email, subject, textTemplate, htmlTemplate) => {
  const existingOtpDoc = await Otp.findOne({ email });

  if (existingOtpDoc) {
    const now = new Date();
    // Check cooldown
    if (existingOtpDoc.lastAttempt && (now - existingOtpDoc.lastAttempt) < OTP_COOLDOWN_SECONDS * 1000) {
      throw new Error(`Please wait ${OTP_COOLDOWN_SECONDS} seconds before requesting a new OTP.`);
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
    await existingOtpDoc.save();
  } else {
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt,
      lastAttempt: new Date(),
      attempts: 0
    });
  }

  const text = textTemplate.replace('{{OTP}}', rawOtp);
  const html = htmlTemplate.replace('{{OTP}}', rawOtp);

  await sendMail(email, subject, text, html);
};

export const verifyOtp = async (email, rawOtp) => {
  const otpDoc = await Otp.findOne({ email });

  if (!otpDoc) {
    throw new Error('Invalid or expired OTP');
  }

  if (otpDoc.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new Error('OTP has expired');
  }

  const isValid = await bcrypt.compare(rawOtp, otpDoc.otp);

  // if (!isValid) {
  //   throw new Error('Invalid OTP');
  // }

  const isValid = await bcrypt.compare(rawOtp, otpDoc.otp);

if (!isValid) {

    otpDoc.attempts += 1;

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
        await Otp.deleteOne({ _id: otpDoc._id });

        throw new Error(
            'Too many invalid OTP attempts. Please generate a new OTP.'
        );
    }

    await otpDoc.save();

    throw new Error(
        `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpDoc.attempts} attempts remaining.`
    );
}

  await Otp.deleteOne({ _id: otpDoc._id });
  return true;
};
