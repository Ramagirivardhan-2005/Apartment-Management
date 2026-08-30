import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { logAudit } from '../middleware/audit.js';
import { sendEmail, EmailTemplates } from '../services/emailService.js';
import {
  generate6DigitOtp,
  hashOtp,
  verifyOtpHash,
  generateVerificationToken,
  verifyVerificationToken,
  maskEmail,
} from '../utils/otpUtils.js';
import { generateRegistrationId, generateEmployeeId } from '../utils/idGenerator.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc Check if initial Super Admin setup is required (Zero data state)
// @route GET /api/auth/setup-status
export const getSetupStatus = async (req, res, next) => {
  try {
    const superAdminCount = await User.countDocuments({ role: 'super_admin', isDeleted: false });
    res.json({
      success: true,
      setupRequired: superAdminCount === 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Initialize root Super Admin account (First-time setup only)
// @route POST /api/auth/initial-setup
export const initialSetup = async (req, res, next) => {
  try {
    const superAdminCount = await User.countDocuments({ role: 'super_admin', isDeleted: false });
    if (superAdminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'System already has an active Super Admin account. Please log in.',
      });
    }

    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required to initialize the Super Admin.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const superAdmin = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      password,
      role: 'super_admin',
      employeeId: 'ROOT-001',
      status: 'active',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await logAudit({
      user: superAdmin,
      action: 'SYSTEM_INITIALIZED_SUPER_ADMIN',
      entityType: 'User',
      entityId: superAdmin._id,
      newValue: { email: superAdmin.email, fullName: superAdmin.fullName },
      req,
    });

    const token = generateToken(superAdmin._id);

    res.status(201).json({
      success: true,
      message: 'Super Administrator initialized successfully! Welcome to the system.',
      token,
      user: {
        _id: superAdmin._id,
        fullName: superAdmin.fullName,
        email: superAdmin.email,
        mobile: superAdmin.mobile,
        role: superAdmin.role,
        status: superAdmin.status,
        isEmailVerified: superAdmin.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Step 1: User / Staff Login (Password Validated -> Dispatches 6-Digit Email OTP) (Section 1, 2, 3, 4, 5, 18)
// @route POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password, mobile, emailOrMobile } = req.body;

    let query = { isDeleted: false };
    const input = emailOrMobile || email || mobile;
    if (input) {
      const cleanInput = String(input).trim();
      if (cleanInput.includes('@')) {
        query.email = cleanInput.toLowerCase();
      } else {
        query.$or = [
          { mobile: cleanInput },
          { email: cleanInput.toLowerCase() },
          { registrationId: cleanInput.toUpperCase() },
          { employeeId: cleanInput.toUpperCase() },
        ];
      }
    } else {
      return res.status(400).json({ success: false, message: 'Email, Mobile, or Registration ID is required' });
    }

    const user = await User.findOne(query).populate('assignedBlock', 'name code');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }

    // Check mandatory initial email verification status
    if (!user.isEmailVerified || user.status === 'pending_verification') {
      return res.status(403).json({
        success: false,
        isEmailUnverified: true,
        email: user.email,
        role: user.role,
        message:
          'Your email address has not been verified. Please complete account activation using the OTP sent to your email.',
      });
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated or blocked. Please contact the administrator.',
      });
    }

    // Validate Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials' });
    }

    // Section 18: Password is valid. Do NOT issue final JWT yet!
    // Generate secure 6-digit numeric login OTP
    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    user.loginOtpHash = otpHash;
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.loginOtpAttempts = 0;
    user.loginOtpCooldownUntil = new Date(Date.now() + 60 * 1000); // 60s cooldown
    await user.save();

    // Generate short-lived temporary verification token (Section 19)
    const verificationToken = generateVerificationToken(user._id, 'LOGIN', 10);

    // Send Login OTP Email (Section 2, 3, 4, 5, 17)
    console.log(`\n====================================================\n🔑 [LOGIN 2FA OTP] For ${user.email}: ${rawOtp}\n====================================================\n`);

    sendEmail({
      to: user.email,
      subject: 'Your Login Verification OTP - Vijaya Laxmi Complex',
      html: EmailTemplates.loginOtp(user.fullName, rawOtp, 10),
    }).catch((err) => console.warn('[Login OTP Email Error]', err.message));

    await logAudit({
      user,
      action: 'LOGIN_OTP_DISPATCHED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      requiresOtp: true,
      verificationToken,
      email: maskEmail(user.email),
      role: user.role,
      otpPreview: rawOtp,
      message: 'A 6-digit login verification OTP has been dispatched to your registered email address.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Step 2: Verify 6-Digit Login OTP & Issue Final Authenticated Session/JWT (Section 2, 3, 4, 5, 18)
// @route POST /api/auth/verify-login-otp
export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { verificationToken, otp } = req.body;

    if (!verificationToken || !otp) {
      return res.status(400).json({ success: false, message: 'Verification token and 6-digit OTP are required' });
    }

    // Verify temporary verification token (Section 19)
    const decoded = verifyVerificationToken(verificationToken, 'LOGIN');
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Your verification session has expired. Please enter your password again to sign in.',
      });
    }

    const user = await User.findById(decoded.userId).populate('assignedBlock', 'name code');
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Attempt limit check (Max 5 attempts - Section 14)
    if (user.loginOtpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Maximum 5 verification attempts exceeded. Please restart login to receive a new OTP.',
      });
    }

    // Expiry check (10 minutes - Section 13)
    if (!user.loginOtpExpiresAt || user.loginOtpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'The login OTP has expired. Please click Resend OTP to receive a fresh code.',
      });
    }

    // Timing-safe SHA-256 hash comparison (Section 11, 12)
    const isOtpValid = verifyOtpHash(otp, user.loginOtpHash);

    if (!isOtpValid) {
      user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
      await user.save();

      const remaining = Math.max(0, 5 - user.loginOtpAttempts);
      await logAudit({
        user,
        action: 'LOGIN_OTP_FAILED',
        entityType: 'User',
        entityId: user._id,
        newValue: { attempts: user.loginOtpAttempts, remaining },
        req,
      });

      return res.status(400).json({
        success: false,
        remainingAttempts: remaining,
        message: remaining > 0
          ? `Invalid OTP. You have ${remaining} attempt(s) remaining.`
          : 'Invalid OTP. Maximum attempts exceeded. Please restart login.',
      });
    }

    // Login 2FA Successful! Invalidate OTP
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpCooldownUntil = undefined;
    await user.save();

    // Create Final Authenticated JWT Session
    const authToken = generateToken(user._id);

    // Send Login Security Alert Email (Section 22)
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    sendEmail({
      to: user.email,
      subject: 'Security Alert: Successful Login to Apartment Portal',
      html: EmailTemplates.loginSecurityAlert(user.fullName, clientIp, userAgent, new Date()),
    }).catch((err) => console.error('[Security Alert Error]', err.message));

    await logAudit({
      user,
      action: 'USER_LOGIN_SUCCESSFUL_2FA',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: 'Login verified successfully! Access granted.',
      token: authToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        registrationId: user.registrationId,
        employeeId: user.employeeId,
        assignedBlock: user.assignedBlock,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Resend Login 6-Digit OTP (Section 15)
// @route POST /api/auth/resend-login-otp
export const resendLoginOtp = async (req, res, next) => {
  try {
    const { verificationToken } = req.body;

    if (!verificationToken) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const decoded = verifyVerificationToken(verificationToken, 'LOGIN');
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cooldown check (60s)
    if (user.loginOtpCooldownUntil && user.loginOtpCooldownUntil > new Date()) {
      const remainingSeconds = Math.ceil((new Date(user.loginOtpCooldownUntil) - new Date()) / 1000);
      return res.status(429).json({
        success: false,
        cooldownRemaining: remainingSeconds,
        message: `Please wait ${remainingSeconds}s before requesting a new login OTP.`,
      });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    user.loginOtpHash = otpHash;
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.loginOtpAttempts = 0;
    user.loginOtpCooldownUntil = new Date(Date.now() + 60 * 1000);
    await user.save();

    console.log(`\n====================================================\n🔑 [RESEND LOGIN OTP] For ${user.email}: ${rawOtp}\n====================================================\n`);

    sendEmail({
      to: user.email,
      subject: 'Your Login Verification OTP - Vijaya Laxmi Complex',
      html: EmailTemplates.loginOtp(user.fullName, rawOtp, 10),
    }).catch((err) => console.warn('[Resend Login OTP Error]', err.message));

    res.json({
      success: true,
      message: 'New 6-digit login verification OTP sent to your registered email.',
      cooldownSeconds: 60,
      otpPreview: rawOtp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc User Self-Registration (Section 6, 10, 21)
// @route POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { fullName, email, mobile, password, dob, gender, address, emergencyContact } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, mobile, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile.trim();

    const existingEmail = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    const existingMobile = await User.findOne({ mobile: cleanMobile, isDeleted: false });
    if (existingMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);
    const registrationId = generateRegistrationId();

    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password,
      role: 'resident',
      registrationId,
      dob,
      gender,
      address,
      emergencyContact,
      status: 'pending_verification',
      isEmailVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      emailOtpAttempts: 0,
      emailOtpCooldownUntil: new Date(Date.now() + 60 * 1000), // 60s cooldown
    });

    // Send Registration OTP Email (Section 6, 17, 21)
    console.log(`\n====================================================\n🔑 [REGISTRATION OTP] For ${user.email}: ${rawOtp}\n====================================================\n`);

    sendEmail({
      to: user.email,
      subject: 'Verify Your Resident Account - Vijaya Laxmi Complex',
      html: EmailTemplates.accountActivationOtp(user.fullName, 'Resident', null, rawOtp, 10),
    }).catch((err) => console.warn('[Registration Email Error]', err.message));

    await logAudit({
      user,
      action: 'RESIDENT_SELF_REGISTERED_OTP_SENT',
      entityType: 'User',
      entityId: user._id,
      newValue: { registrationId, email: cleanEmail },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Registration initiated. 6-digit OTP sent to ${user.email}. Please verify your email to activate your account.`,
      email: user.email,
      registrationId: user.registrationId,
      otpPreview: rawOtp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify Email using 6-digit OTP (Account Activation - Section 6, 21)
// @route POST /api/auth/verify-otp
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false })
      .populate('assignedBlock', 'name code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found for this email address' });
    }

    if (user.isEmailVerified && user.status === 'active') {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: 'Email is already verified. You can log in.',
      });
    }

    // Security check: Max 5 attempts
    if (user.emailOtpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        isBlocked: true,
        message: 'Maximum 5 verification attempts exceeded. Please request a new OTP.',
      });
    }

    // Expiry check (10 minutes)
    if (!user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'The OTP has expired. Please click Resend OTP to receive a fresh 6-digit code.',
      });
    }

    // Verify OTP timing-safe hash
    const isOtpValid = verifyOtpHash(otp, user.emailOtpHash);

    if (!isOtpValid) {
      user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
      await user.save();

      const remainingAttempts = Math.max(0, 5 - user.emailOtpAttempts);

      await logAudit({
        user,
        action: 'EMAIL_OTP_VERIFICATION_FAILED',
        entityType: 'User',
        entityId: user._id,
        newValue: { attempts: user.emailOtpAttempts, remainingAttempts },
        req,
      });

      return res.status(400).json({
        success: false,
        remainingAttempts,
        message: remainingAttempts > 0
          ? `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`
          : 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.',
      });
    }

    // Successful OTP verification -> Activate Account directly without password creation
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.status = 'active';
    user.mustChangePassword = false;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    user.emailOtpCooldownUntil = undefined;
    user.setupPasswordToken = undefined;
    user.setupPasswordExpiresAt = undefined;
    await user.save();

    await logAudit({
      user,
      action: 'EMAIL_VERIFIED_SUCCESSFULLY',
      entityType: 'User',
      entityId: user._id,
      newValue: { emailVerifiedAt: user.emailVerifiedAt, role: user.role },
      req,
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Account verified successfully! Proceeding to advance payment and portal activation.',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        registrationId: user.registrationId,
        employeeId: user.employeeId,
        assignedBlock: user.assignedBlock,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Direct 1-click Email Link Activation without requiring password creation
// @route POST /api/auth/activate-account
export const activateAccount = async (req, res, next) => {
  try {
    const { email, token } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail, isDeleted: false })
      .populate('assignedBlock', 'name code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found for this email address' });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.status = 'active';
    user.mustChangePassword = false;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    user.emailOtpCooldownUntil = undefined;
    user.setupPasswordToken = undefined;
    user.setupPasswordExpiresAt = undefined;
    await user.save();

    await logAudit({
      user,
      action: 'ACCOUNT_ACTIVATED_VIA_EMAIL_LINK',
      entityType: 'User',
      entityId: user._id,
      newValue: { emailVerifiedAt: user.emailVerifiedAt, role: user.role },
      req,
    });

    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Account verified successfully! Proceeding to advance payment and portal activation.',
      token: authToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        registrationId: user.registrationId,
        employeeId: user.employeeId,
        assignedBlock: user.assignedBlock,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Resend OTP for Account Email Verification (60s cooldown)
// @route POST /api/auth/resend-otp
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false })
      .populate('assignedBlock', 'name code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found for this email' });
    }

    if (user.isEmailVerified && user.status === 'active') {
      return res.status(400).json({ success: false, message: 'Email is already verified. You can log in.' });
    }

    // Cooldown check (60 seconds)
    if (user.emailOtpCooldownUntil && user.emailOtpCooldownUntil > new Date()) {
      const remainingSeconds = Math.ceil((new Date(user.emailOtpCooldownUntil) - new Date()) / 1000);
      return res.status(429).json({
        success: false,
        cooldownRemaining: remainingSeconds,
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
      });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpAttempts = 0;
    user.emailOtpCooldownUntil = new Date(Date.now() + 60 * 1000);
    await user.save();

    const blockName = user.assignedBlock ? user.assignedBlock.name : '';

    console.log(`\n====================================================\n🔑 [ACCOUNT ACTIVATION OTP] For ${user.email}: ${rawOtp}\n====================================================\n`);

    sendEmail({
      to: user.email,
      subject: 'Your Account Verification OTP - Vijaya Laxmi Complex',
      html: EmailTemplates.accountActivationOtp(user.fullName, user.role.replace('_', ' ').toUpperCase(), blockName, rawOtp, 10),
    }).catch((err) => console.warn('[Resend OTP Error]', err.message));

    res.json({
      success: true,
      message: 'New 6-digit OTP dispatched to your registered email address.',
      cooldownSeconds: 60,
      otpPreview: rawOtp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Set Password after initial OTP verification
// @route POST /api/auth/setup-password
export const setupPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({ success: false, message: 'Email, setup token, and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      setupPasswordToken: token,
      setupPasswordExpiresAt: { $gt: new Date() },
    }).populate('assignedBlock', 'name code');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password setup token.',
      });
    }

    user.password = password;
    user.setupPasswordToken = undefined;
    user.setupPasswordExpiresAt = undefined;
    user.status = 'active';
    await user.save();

    await logAudit({
      user,
      action: 'PASSWORD_SETUP_COMPLETED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password created successfully! You are now logged in.',
      token: authToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        registrationId: user.registrationId,
        employeeId: user.employeeId,
        assignedBlock: user.assignedBlock,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Request Password Reset OTP via Email (Section 7, 20)
// @route POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const cleanInput = String(email).trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanInput },
        { mobile: cleanInput },
        { registrationId: cleanInput.toUpperCase() },
        { employeeId: cleanInput.toUpperCase() },
      ],
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email or mobile number.' });
    }

    // Cooldown check (60s)
    if (user.resetPasswordOtpCooldownUntil && user.resetPasswordOtpCooldownUntil > new Date()) {
      const remainingSeconds = Math.ceil((new Date(user.resetPasswordOtpCooldownUntil) - new Date()) / 1000);
      return res.status(429).json({
        success: false,
        cooldownRemaining: remainingSeconds,
        message: `Please wait ${remainingSeconds}s before requesting a new OTP.`,
      });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpCooldownUntil = new Date(Date.now() + 60 * 1000); // 60s cooldown
    await user.save();

    console.log(`\n====================================================\n🔑 [PASSWORD RESET OTP] For ${user.email}: ${rawOtp}\n====================================================\n`);

    sendEmail({
      to: user.email,
      subject: 'Password Reset Verification OTP - Vijaya Laxmi Complex',
      html: EmailTemplates.forgotPasswordOtp(user.fullName, rawOtp, 10),
    }).catch((err) => console.warn('[Forgot Password Email Error]', err.message));

    await logAudit({
      user,
      action: 'FORGOT_PASSWORD_OTP_REQUESTED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: `6-digit password reset OTP has been dispatched to ${user.email}.`,
      email: user.email,
      otpPreview: rawOtp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify Password Reset 6-Digit OTP (Section 7, 20)
// @route POST /api/auth/verify-reset-otp
export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail, isDeleted: false });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.',
      });
    }

    if (!user.resetPasswordOtpExpiresAt || user.resetPasswordOtpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'The OTP has expired. Please request a fresh OTP.',
      });
    }

    const isValid = verifyOtpHash(otp, user.resetPasswordOtpHash);

    if (!isValid) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();

      const remaining = Math.max(0, 5 - user.resetPasswordOtpAttempts);
      return res.status(400).json({
        success: false,
        remainingAttempts: remaining,
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempt(s) remaining.`
          : 'Invalid OTP. Maximum attempts exceeded.',
      });
    }

    // OTP verified -> Generate short-lived password reset token (15 mins)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpiresAt = undefined;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    await logAudit({
      user,
      action: 'RESET_PASSWORD_OTP_VERIFIED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: 'OTP verified successfully. You may now choose your new password.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Reset Password using verified Reset Token (Section 7, 20)
// @route POST /api/auth/reset-password-otp
export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() },
      isDeleted: false,
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset session. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully - Apartment Complex',
      html: EmailTemplates.passwordChangedAlert(user.fullName, new Date()),
    });

    await logAudit({
      user,
      action: 'PASSWORD_RESET_COMPLETED_VIA_OTP',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current authenticated profile
// @route GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('assignedBlock', 'name code address floors totalRooms');

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, dob, gender, address, emergencyContact, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (address) user.address = { ...user.address, ...address };
    if (emergencyContact) user.emergencyContact = { ...user.emergencyContact, ...emergencyContact };
    if (avatar) user.avatar = avatar;

    await user.save();

    await logAudit({
      user,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Change Password
// @route POST /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      user,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Force change password on initial login
// @route POST /api/auth/force-change-password
export const forceChangePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id).populate('assignedBlock', 'name code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully - Apartment Complex',
      html: EmailTemplates.passwordChangedAlert(user.fullName, new Date()),
    });

    await logAudit({
      user,
      action: 'FIRST_TIME_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.json({
      success: true,
      message: 'Password updated successfully! Welcome to your portal.',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        registrationId: user.registrationId,
        employeeId: user.employeeId,
        assignedBlock: user.assignedBlock,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        mustChangePassword: false,
      },
    });
  } catch (error) {
    next(error);
  }
};
