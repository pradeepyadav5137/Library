import jwt from 'jsonwebtoken';

export const adminAuth = (req, res, next) => {
  try {
    // Only accept strictly from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.username && !decoded.role) {
      return res.status(401).json({ message: 'Not authorized as admin' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};
