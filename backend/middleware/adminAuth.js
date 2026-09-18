import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Simple in-memory cache to avoid DB lookups on every request
const adminExistsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function adminStillExists(adminId) {
  const cached = adminExistsCache.get(adminId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.exists;
  }
  const exists = await Admin.exists({ _id: adminId });
  adminExistsCache.set(adminId, { exists: !!exists, timestamp: Date.now() });
  return !!exists;
}

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.username || !decoded.role) {
      return res.status(401).json({ message: 'Not authorized as admin' });
    }

    // Verify admin still exists in DB (with caching to reduce DB load)
    if (decoded.id) {
      const exists = await adminStillExists(decoded.id);
      if (!exists) {
        return res.status(401).json({ message: 'Admin account no longer exists' });
      }
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

// Export for testing or clearing cache when an admin is deleted
export const clearAdminCache = (adminId) => {
  if (adminId) {
    adminExistsCache.delete(adminId.toString());
  } else {
    adminExistsCache.clear();
  }
};
