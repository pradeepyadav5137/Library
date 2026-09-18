import multer from 'multer';
import { sanitizeFilename } from './validateFileContent.js';

// Use memory storage to allow validation before writing to disk/S3
const storage = multer.memoryStorage();

// File filter (checks MIME type + extensions)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and PDF files are allowed.'), false);
  }

  // Double check extension mapping for security
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (file.mimetype === 'image/jpeg' && !['jpg', 'jpeg'].includes(ext)) {
    return cb(new Error('File extension does not match content type.'), false);
  }
  if (file.mimetype === 'image/png' && ext !== 'png') {
    return cb(new Error('File extension does not match content type.'), false);
  }
  if (file.mimetype === 'application/pdf' && ext !== 'pdf') {
    return cb(new Error('File extension does not match content type.'), false);
  }

  // Basic sanitization (more thorough check done in validateFileContent middleware)
  file.originalname = sanitizeFilename(file.originalname);
  cb(null, true);
};

// Configured upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024,
    // Accommodate base64 images that are passed as text fields
    fieldSize: 7 * 1024 * 1024, 
    files: 5,
  }
});
