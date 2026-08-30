/**
 * Custom Operational Application Error Class
 * Distinguishes expected user-safe errors (e.g. 400 Bad Request, 401 Unauthorized, 404 Not Found)
 * from unexpected internal technical exceptions (500 Internal Server Error).
 */
export class AppError extends Error {
  /**
   * @param {string} message - User-facing or internal error message
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 429, 500, etc.)
   * @param {boolean} isOperational - Whether this is a trusted, expected operational error
   * @param {any} details - Optional structured validation or contextual metadata
   */
  constructor(message, statusCode = 500, isOperational = true, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.isUserSafe = isOperational && statusCode < 500;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request parameters', details = null) {
    return new AppError(message, 400, true, details);
  }

  static unauthorized(message = 'Unauthorized access. Please log in.') {
    return new AppError(message, 401, true);
  }

  static forbidden(message = 'Access forbidden. You do not have permission.') {
    return new AppError(message, 403, true);
  }

  static notFound(message = 'Requested resource not found') {
    return new AppError(message, 404, true);
  }

  static conflict(message = 'Resource conflict or duplicate entry') {
    return new AppError(message, 409, true);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new AppError(message, 429, true);
  }

  static internal(message = 'Something went wrong. Please try again later.') {
    return new AppError(message, 500, false);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable. Please retry shortly.') {
    return new AppError(message, 503, true);
  }
}

export default AppError;
