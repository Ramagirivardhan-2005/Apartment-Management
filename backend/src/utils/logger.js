/**
 * Production-Safe Structured Logger
 * Provides sanitized server-side logging with request correlation IDs,
 * automatic masking of sensitive keys, and environment-aware formatting.
 */

// Keys to recursively scrub from log outputs
const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'newpassword',
  'oldpassword',
  'token',
  'refreshtoken',
  'jwt',
  'authorization',
  'secret',
  'jwt_secret',
  'cookie',
  'otp',
  'otphash',
  'verificationhash',
  'hash',
  'cvv',
  'cardnumber',
  'razorpaysignature',
  'razorpay_signature',
  'razorpay_secret',
  'key_secret',
  'private_key',
  'apikey',
  'api_key',
  'smtp_pass',
  'smtp_password',
  'cloudinary_api_secret',
  'credentials',
]);

/**
 * Recursively sanitize an object or array to mask sensitive values.
 * @param {any} data 
 * @param {number} depth 
 * @returns {any}
 */
export const sanitizeData = (data, depth = 0) => {
  if (depth > 8 || data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (data instanceof Date || data instanceof RegExp) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey) || normalizedKey.includes('password') || normalizedKey.includes('secret')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    const timestamp = formatTimestamp();
    const sanitizedMeta = sanitizeData(meta);
    console.log(
      `[${timestamp}] [INFO] ${message}`,
      Object.keys(sanitizedMeta).length > 0 ? JSON.stringify(sanitizedMeta) : ''
    );
  },

  warn: (message, meta = {}) => {
    const timestamp = formatTimestamp();
    const sanitizedMeta = sanitizeData(meta);
    console.warn(
      `[${timestamp}] [WARN] ${message}`,
      Object.keys(sanitizedMeta).length > 0 ? JSON.stringify(sanitizedMeta) : ''
    );
  },

  error: (message, error = null, meta = {}) => {
    const timestamp = formatTimestamp();
    const sanitizedMeta = sanitizeData(meta);
    
    console.error(`====================================================`);
    console.error(`[${timestamp}] [ERROR] ${message}`);
    
    if (error) {
      if (error.stack) {
        console.error(`[Stack Trace]\n${error.stack}`);
      } else if (typeof error === 'object') {
        console.error(`[Error Object]`, JSON.stringify(sanitizeData(error), null, 2));
      } else {
        console.error(`[Error Detail]`, error);
      }
    }

    if (Object.keys(sanitizedMeta).length > 0) {
      console.error(`[Context]`, JSON.stringify(sanitizedMeta, null, 2));
    }
    console.error(`====================================================`);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = formatTimestamp();
      const sanitizedMeta = sanitizeData(meta);
      console.debug(
        `[${timestamp}] [DEBUG] ${message}`,
        Object.keys(sanitizedMeta).length > 0 ? JSON.stringify(sanitizedMeta) : ''
      );
    }
  },
};

export default logger;
