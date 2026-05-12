import mongoose from 'mongoose';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Application from '../models/Application.js';
import Admin from '../models/Admin.js';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const generateS3SignedUrl = async (s3Key, expiresInSec = 3600) => {
  if (!s3Key) return null;
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
    });
    return await getSignedUrl(s3, command, { expiresIn: expiresInSec });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

export const deleteS3File = async (s3Key) => {
  if (!s3Key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
      })
    );
  } catch (error) {
    console.warn('Failed to delete from S3:', error.message);
  }
};

export const attachSignedUrls = async (app, expiresInSec = 3600) => {
  if (app.photoPath)        app.photoUrl      = await generateS3SignedUrl(app.photoPath, expiresInSec);
  if (app.firPath)          app.firUrl        = await generateS3SignedUrl(app.firPath, expiresInSec);
  if (app.paymentPath)      app.paymentUrl    = await generateS3SignedUrl(app.paymentPath, expiresInSec);
  if (app.applicationPdfUrl) app.pdfUrl       = await generateS3SignedUrl(app.applicationPdfUrl, expiresInSec);
  return app;
};

export const checkSuperadmin = (adminUser) => {
  if (adminUser?.email === '205124066@nitt.edu') {
    return; // Allow specific email as superadmin unconditionally
  }
  if (adminUser?.role !== 'superadmin') {
    throw new Error('Only superadmin can perform this action');
  }
};
