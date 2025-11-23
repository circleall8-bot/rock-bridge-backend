// middleware/authMiddleware.js
import User from '../models/Users.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.body?.token || req.query?.token);

    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Optional: ensure the token matches the one stored in DB (simple server-side session)
    if (!user.accessToken || user.accessToken !== token) {
      return res.status(401).json({ message: 'Token not recognized (please login again)' });
    }

    req.user = user; // attach user
    next();
  } catch (error) {
    console.error('auth error', error);
    res.status(500).json({ message: 'Auth error' });
  }
};
