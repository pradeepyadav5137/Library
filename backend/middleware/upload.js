

import multer from 'multer';
import multerS3 from 'multer-s3';
// import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import AWS from "aws-sdk";




const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


// File filter (strict validation)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png'];
  const allowedPdf = ['application/pdf'];

  if (file.fieldname === 'photo') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Photo must be JPG or PNG'), false);
    }
  }

  if (
    file.fieldname === 'fir' ||
    file.fieldname === 'payment' ||
    file.fieldname === 'applicationPdf'
  ) {
    if (
      !allowedImageTypes.includes(file.mimetype) &&
      !allowedPdf.includes(file.mimetype)
    ) {
      return cb(new Error('Only JPG, PNG or PDF allowed'), false);
    }
  }

  cb(null, true);
};

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Files stored as: applications/<applicationId>/<fieldname>-<timestamp>.<ext>
      // applicationId is not yet generated here, so we use a temp folder pattern
      // The controller will receive file.location (full S3 URL)
      const ext = path.extname(file.originalname) ||
        (file.mimetype?.includes('png') ? '.png' :
         file.mimetype?.includes('pdf') ? '.pdf' : '.jpg');
      const timestamp = Date.now();
      const key = `applications/pending/${file.fieldname}-${timestamp}${ext}`;
      cb(null, key);
    },
  }),
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024,
  },
});
