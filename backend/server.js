import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust proxy for AWS/Nginx (needed for cookies and rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(mongoSanitize());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: 'Too many login attempts, please try again after a minute' }
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many OTP requests on your network, please try again after a minute or change network' }
});

const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many verification attempts, please try again after a minute' }
});

const adminLoginStep2Limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP verification attempts, please try again after a minute' }
});

const adminResetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many password reset attempts, please try again later' }
});

// Apply rate limiters to auth routes
app.use('/api/auth/admin-login', loginLimiter);
app.use('/api/auth/admin-login-step2', adminLoginStep2Limiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-email', verifyEmailLimiter);
app.use('/api/auth/admin-reset-password', adminResetPasswordLimiter);

// Serve uploaded files (local fallback when S3 is not configured)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  // Multer file upload errors
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large. Maximum allowed size is ' + (process.env.MAX_FILE_SIZE_MB || 5) + ' MB.',
      LIMIT_FIELD_VALUE: 'The uploaded photo is too large. Please use a smaller image (under 5 MB).',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
      LIMIT_FIELD_COUNT: 'Too many form fields.',
      LIMIT_UNEXPECTED_FILE: `Unexpected file field: "${err.field}".`,
      LIMIT_PART_COUNT: 'Too many parts in the upload.',
    };
    return res.status(400).json({
      message: messages[err.code] || 'File upload error. Please try again with a smaller file.',
    });
  }

  // File filter rejections (wrong MIME type)
  if (err.message && (err.message.includes('JPG') || err.message.includes('PNG') || err.message.includes('PDF'))) {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    message: 'Server error',
    ...(isProduction ? {} : { error: err.message })
  });
});

// Start server after DB connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
