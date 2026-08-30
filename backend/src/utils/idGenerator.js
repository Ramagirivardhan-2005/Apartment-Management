import crypto from 'crypto';

/**
 * Generate a unique resident registration ID format: REG-YYYY-XXXXXX
 * Example: REG-2026-000042
 */
export const generateRegistrationId = () => {
  const year = new Date().getFullYear();
  const randomNum = crypto.randomInt(100000, 999999);
  return `REG-${year}-${randomNum}`;
};

/**
 * Generate a unique receipt voucher number format: RCP-YYYY-XXXXXX
 * Example: RCP-2026-582910
 */
export const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = crypto.randomInt(100000, 999999);
  return `RCP-${year}-${randomNum}`;
};

/**
 * Generate a unique transaction ID format: TXN-XXXXXXXXXXXX
 */
export const generateTransactionId = () => {
  const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `TXN-${randomHex}`;
};

/**
 * Generate unique Employee ID based on role
 */
export const generateEmployeeId = (role) => {
  const randomNum = crypto.randomInt(1000, 9999);
  if (role === 'block_admin') return `BA-${randomNum}`;
  if (role === 'receptionist') return `REC-${randomNum}`;
  return `EMP-${randomNum}`;
};
