import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'apartment_mgmt_super_secret_jwt_key_2026_production';

/**
 * Generate a cryptographically secure 6-digit numeric OTP (Section 11)
 */
export const generate6DigitOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash an OTP using SHA-256 for secure storage (Section 12)
 */
export const hashOtp = (otp) => {
  if (!otp) return '';
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Timing-safe comparison of entered OTP with stored SHA-256 hash
 */
export const verifyOtpHash = (enteredOtp, storedHash) => {
  if (!enteredOtp || !storedHash) return false;
  try {
    const enteredHash = hashOtp(enteredOtp);
    const enteredBuf = Buffer.from(enteredHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');

    if (enteredBuf.length !== storedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(enteredBuf, storedBuf);
  } catch (error) {
    return false;
  }
};

/**
 * Generate a short-lived temporary verification token for 2FA / OTP verification (Section 19)
 * @param {string} userId
 * @param {string} purpose - 'LOGIN' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'
 * @param {number} expiresInMinutes - default 10
 */
export const generateVerificationToken = (userId, purpose, expiresInMinutes = 10) => {
  return jwt.sign(
    {
      userId: userId.toString(),
      purpose,
      isTemporary2FA: true,
    },
    JWT_SECRET,
    {
      expiresIn: `${expiresInMinutes}m`,
    }
  );
};

/**
 * Verify temporary verification token and ensure purpose matches (Section 19)
 */
export const verifyVerificationToken = (token, expectedPurpose) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId || !decoded.isTemporary2FA) {
      return null;
    }
    if (expectedPurpose && decoded.purpose !== expectedPurpose) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Mask email for privacy (e.g., rah******@gmail.com)
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 3)}******@${domain}`;
};
