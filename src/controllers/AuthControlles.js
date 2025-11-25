// controllers/authController.js
import bcrypt from 'bcrypt';
import User from '../models/Users.js';
import { generateAccessToken, verifyAccessToken } from '../utils/tokens.js';
import  sendEmail  from '../utils/sendEmail.js';

const SALT_ROUNDS = 10;

// Login with email/password
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    user.accessToken = accessToken;
    await user.save();

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('login error', error);
    res.status(500).json({ message: 'Login error' });
  }
};

// Relogin / token-based refresh or validate
// Accepts token in Authorization header or { token } in body
export const reloginWithToken = async (req, res) => {
  try {
    const incomingToken = (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
      ? req.headers.authorization.slice(7)
      : req.body?.token;

    if (!incomingToken) return res.status(400).json({ message: 'Token required' });

    let decoded;
    try {
      decoded = verifyAccessToken(incomingToken);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Check token matches stored one (simple single-session enforcement)
    if (!user.accessToken || user.accessToken !== incomingToken) {
      // Option: allow refresh even if token doesn't match. For simple approach, reject and require login.
      return res.status(401).json({ message: 'Token not recognized. Please login again.' });
    }

    // Issue a new token (refresh) and update DB
    const newToken = generateAccessToken(user);
    user.accessToken = newToken;
    await user.save();

    res.json({
      message: 'Token refreshed',
      accessToken: newToken,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('relogin error', error);
    res.status(500).json({ message: 'Relogin failed' });
  }
};

// Logout - clears server-side token
export const logout = async (req, res) => {
  try {
    // token can come from header or body
    const token = (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
      ? req.headers.authorization.slice(7)
      : req.body?.token;

    if (!token) return res.status(400).json({ message: 'Token required' });

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      // if token invalid, just respond success (idempotency) or inform user
      return res.status(200).json({ message: 'Logged out' });
    }

    const user = await User.findById(decoded.id);
    if (user && user.accessToken === token) {
      user.accessToken = null;
      await user.save();
    }

    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    console.error('logout error', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// Forgot password - sends OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetOTP = otp;
    user.resetOTPExpires = expiry;
    await user.save();

    const resetUrl = `https://rockbridge.store/resetpassword/${otp}`;

    await sendEmail(
      email,
      "Password Reset",
      `
        <p>Hello ${user.name},</p>
        <p>Use the following one-time code to reset your password: <strong>${otp}</strong></p>
        <p>Or click: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>This code expires in 10 minutes.</p>
      `
    );

    res.json({ message: "Reset instructions sent to email" });
  } catch (error) {
    console.error('forgotPassword error', error);
    res.status(500).json({ message: "Error sending reset link" });
  }
};

// Reset password - using email + otp + newPassword
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'email, otp and newPassword required' });

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || !user.resetOTPExpires)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: 'Incorrect OTP' });

    if (user.resetOTPExpires < new Date())
      return res.status(400).json({ message: 'OTP expired' });

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashed;
    user.resetOTP = null;
    user.resetOTPExpires = null;

    // Invalidate any existing tokens after password change
    user.accessToken = null;

    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('resetPassword error', error);
    res.status(500).json({ message: 'Reset failed' });
  }
};
