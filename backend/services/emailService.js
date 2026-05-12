/*
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
*/

import { sendMail as nodemailerSendMail } from '../config/nodemailer.js';

export const sendMail = async (to, subject, text, html) => {
  // --- SES Implementation (commented out for future use) ---
  /*
  const fromEmail =  process.env.NODEMAILER_FROM ||process.env.SES_FROM_EMAIL || 'noreply@nitt.edu';

  const toAddresses = Array.isArray(to) ? to : [to];

  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        ...(html && { Html: { Data: html, Charset: 'UTF-8' } }),
        ...(text && { Text: { Data: text, Charset: 'UTF-8' } }),
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const data = await sesClient.send(command);
    console.log(`Email sent to ${toAddresses.join(', ')} via SES. MessageId: ${data.MessageId}`);
    return data;
  } catch (error) {
    console.error(`Failed to send email to ${toAddresses.join(', ')} via SES:`, error);
    throw error;
  }
  */

  // --- Nodemailer Implementation ---
  try {
    const data = await nodemailerSendMail(to, subject, text, html);
    console.log(`Email sent to ${to} via Nodemailer. MessageId: ${data.messageId}`);
    return data;
  } catch (error) {
    console.error(`Failed to send email to ${to} via Nodemailer:`, error);
    throw error;
  }
};
