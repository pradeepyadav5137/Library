import { sendMail as nodemailerSendMail } from '../config/nodemailer.js';

export const sendMail = async (to, subject, text, html) => {
  try {
    const data = await nodemailerSendMail(to, subject, text, html);
    console.log(`Email sent to ${to} via Nodemailer. MessageId: ${data.messageId}`);
    return data;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};
