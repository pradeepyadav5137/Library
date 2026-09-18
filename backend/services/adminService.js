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

/**
 * Delete a file from S3.
 * @param {string} s3Key
 * @param {object} options
 * @param {boolean} options.throwOnError - If true, throw on failure. Default: false (log warning).
 * @returns {Promise<boolean>} true if deleted successfully or key was empty
 */
export const deleteS3File = async (s3Key, { throwOnError = false } = {}) => {
  if (!s3Key) return true;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
      })
    );
    return true;
  } catch (error) {
    if (throwOnError) {
      throw new Error('Failed to delete associated file. Please try again or contact support.');
    }
    console.warn('Failed to delete from S3:', error.message);
    return false;
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
  if (adminUser?.role !== 'superadmin') {
    throw new Error('Only superadmin can perform this action');
  }
};
