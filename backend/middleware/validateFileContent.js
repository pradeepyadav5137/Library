/**
 * Magic-byte / file-signature validation middleware.
 * Validates actual file content against expected types.
 * Must be used AFTER multer (memory storage) has parsed the files.
 */

// Known magic byte signatures
const SIGNATURES = {
  jpg: {
    bytes: [0xFF, 0xD8, 0xFF],
    offset: 0,
  },
  png: {
    bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    offset: 0,
  },
  pdf: {
    bytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
  },
};

/**
 * Checks if a buffer starts with the given magic bytes at the given offset.
 */
function matchesMagic(buffer, signature) {
  if (!buffer || buffer.length < signature.offset + signature.bytes.length) {
    return false;
  }
  for (let i = 0; i < signature.bytes.length; i++) {
    if (buffer[signature.offset + i] !== signature.bytes[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Detects the actual file type from buffer magic bytes.
 * @param {Buffer} buffer
 * @returns {string|null} Detected type: 'jpg', 'png', 'pdf', or null
 */
function detectFileType(buffer) {
  if (matchesMagic(buffer, SIGNATURES.jpg)) return 'jpg';
  if (matchesMagic(buffer, SIGNATURES.png)) return 'png';
  if (matchesMagic(buffer, SIGNATURES.pdf)) return 'pdf';
  return null;
}

/**
 * Allowed types per field name.
 */
const ALLOWED_TYPES = {
  photo: ['jpg', 'png'],
  fir: ['jpg', 'png', 'pdf'],
  payment: ['jpg', 'png', 'pdf'],
  applicationPdf: ['jpg', 'png', 'pdf'],
};

/**
 * Sanitizes a filename: removes path traversal, null bytes, and excessive length.
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'unnamed';
  // Remove path components and null bytes
  let clean = filename.replace(/\0/g, '').replace(/[/\\]/g, '_');
  // Remove double extensions like .jpg.exe
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts[parts.length - 1];
  }
  // Limit length
  if (clean.length > 200) {
    const ext = clean.substring(clean.lastIndexOf('.'));
    clean = clean.substring(0, 200 - ext.length) + ext;
  }
  return clean;
}

/**
 * Express middleware that validates uploaded file content via magic bytes.
 * Rejects files whose actual content doesn't match allowed types.
 */
export const validateFileContent = (req, res, next) => {
  const files = req.files;
  if (!files || typeof files !== 'object') {
    return next();
  }

  for (const [fieldName, fileArray] of Object.entries(files)) {
    if (!Array.isArray(fileArray)) continue;

    const allowedTypes = ALLOWED_TYPES[fieldName];
    if (!allowedTypes) {
      // Unknown field — reject
      return res.status(400).json({ message: `Unexpected file field: ${fieldName}` });
    }

    for (const file of fileArray) {
      // Validate buffer exists
      if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ message: `Empty file uploaded for ${fieldName}` });
      }

      // Detect actual file type from magic bytes
      const detectedType = detectFileType(file.buffer);
      if (!detectedType) {
        return res.status(400).json({
          message: `Invalid file content for ${fieldName}. Only JPG, PNG, and PDF files are allowed.`
        });
      }

      if (!allowedTypes.includes(detectedType)) {
        return res.status(400).json({
          message: `Invalid file type for ${fieldName}. Expected: ${allowedTypes.join(', ').toUpperCase()}`
        });
      }

      // Sanitize the original filename
      file.originalname = sanitizeFilename(file.originalname);
    }
  }

  next();
};
