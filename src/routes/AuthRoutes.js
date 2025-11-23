import express from 'express';
import { forgotPassword, loginUser, reloginWithToken, resetPassword } from '../controllers/AuthControlles.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginUser);

// relogin (validate & refresh token) - accepts Authorization: Bearer <token> OR { token }
router.post('/relogin', reloginWithToken);
router.post('/forgot', forgotPassword);
// POST /api/auth/reset-password
router.post('/reset', resetPassword);
// Example protected endpoint
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});

export default router;
