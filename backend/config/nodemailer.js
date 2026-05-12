import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.NODEMAILER_PORT || '587', 10),
  secure: process.env.NODEMAILER_SECURE === 'true',
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD
  }
});

export const sendMail = (to, subject, text, html) => {
  return transporter.sendMail({
    from: process.env.NODEMAILER_FROM || process.env.NODEMAILER_USER,
    to,
    subject,
    text: text || undefined,
    html: html || undefined
  });
};

export default transporter;
