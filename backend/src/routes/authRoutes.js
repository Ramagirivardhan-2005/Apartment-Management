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

const router = express.Router();

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
