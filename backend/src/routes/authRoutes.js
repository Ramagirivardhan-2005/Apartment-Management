import express from 'express';
import {
  getSetupStatus,
  initialSetup,
  register,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  verifyOtp,
  activateAccount,
  resendOtp,
  setupPassword,
  getMe,
  updateProfile,
  changePassword,
  forceChangePassword,
  forgotPassword,
  verifyResetOtp,
  resetPasswordWithOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

import { sendEmail, EmailTemplates } from '../services/emailService.js';

const router = express.Router();

// Live Email Diagnostic Route
router.get('/test-email', async (req, res) => {
  const targetEmail = req.query.to || 'vardhanramagiri84@gmail.com';
  const result = await sendEmail({
    to: targetEmail,
    subject: '✅ Vijaya Laxmi Complex - Live Test Email',
    html: EmailTemplates.loginOtp('Valued Resident', '846201', 10),
  });
  res.json({
    success: result.success,
    message: result.success ? `Test email dispatched to ${targetEmail}` : 'Failed to send test email',
    provider: result.provider || (process.env.RESEND_API_KEY ? 'resend' : process.env.BREVO_API_KEY ? 'brevo' : 'smtp'),
    brevoKeyConfigured: !!process.env.BREVO_API_KEY,
    resendKeyConfigured: !!process.env.RESEND_API_KEY,
    details: result,
  });
});

// System Setup Status & Root Initialization
router.get('/setup-status', getSetupStatus);
router.post('/initial-setup', initialSetup);

// Mandatory 2-Step Login with Email OTP (Section 1, 2, 3, 4, 5, 18)
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/resend-login-otp', resendLoginOtp);

// Registration & Account Activation OTP
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/activate-account', activateAccount);
router.post('/resend-otp', resendOtp);
router.post('/setup-password', setupPassword);

// Forgot Password via Email OTP (Section 7, 20)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password-otp', resetPasswordWithOtp);

// Protected Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/force-change-password', protect, forceChangePassword);

export default router;
