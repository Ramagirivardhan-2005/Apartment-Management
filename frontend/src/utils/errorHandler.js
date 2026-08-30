/**
 * Production Frontend Error Sanitizer
 * 
 * Intercepts technical and database errors, ensuring the end-user ONLY receives
 * safe, human-readable guidance, while logging raw technical details for developers.
 */

// Patterns indicating raw database, server exception, or internal runtime strings
const TECHNICAL_ERROR_PATTERNS = [
  /mongo/i,
  /casterror/i,
  /e11000/i,
  /duplicate key/i,
  /validation failed/i,
  /jwt/i,
  /token/i,
  /syntaxerror/i,
  /typeerror/i,
  /referenceerror/i,
  /internal server error/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /network error/i,
  /failed to fetch/i,
  /\[object object\]/i,
  /undefined/i,
  /null/i,
  /at\s+[a-z0-9_.\/\\:<>]+\s+\(/i, // Stack trace line
];

/**
 * Checks whether a message string contains unsafe technical internals.
 * @param {string} msg 
 * @returns {boolean}
 */
export const isTechnicalError = (msg) => {
  if (!msg || typeof msg !== 'string') return true;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg));
};

/**
 * Standard Production Fallback Message
 */
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

/**
 * Extracts a safe, user-friendly error message from an API response, Axios error, or Error object.
 * 
 * @param {any} error - The caught error object
 * @param {string} [customFallback] - Optional contextual fallback message
 * @returns {string} Safe user-friendly message
 */
export const getErrorMessage = (error, customFallback = GENERIC_ERROR_MESSAGE) => {
  if (!error) return customFallback;

  // Log full error in browser console for developer inspection
  if (process.env.NODE_ENV !== 'production') {
    console.error('[App Error Caught]', error);
  }

  // 1. Network / Server Offline
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // 2. HTTP 500+ / 502 / 503 / 504 Unexpected Server Errors
  const status = error.response?.status;
  if (status && status >= 500) {
    if (status === 503) {
      return error.response?.data?.message || 'Service is temporarily unavailable. Please retry in a moment.';
    }
    return GENERIC_ERROR_MESSAGE;
  }

  // 3. Extract candidate message from API response
  const rawMessage = error.response?.data?.message || error.message;

  if (rawMessage && typeof rawMessage === 'string') {
    const trimmed = rawMessage.trim();
    // If it contains technical jargon or stack fragments, sanitize to generic
    if (isTechnicalError(trimmed)) {
      return GENERIC_ERROR_MESSAGE;
    }
    return trimmed;
  }

  return customFallback;
};

export default getErrorMessage;
