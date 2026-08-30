import logger from '../utils/logger.js';
import { AppError } from '../utils/appError.js';

/**
 * Centralized Production-Grade Express Error Handling Middleware
 * 
 * Guarantees:
 * 1. Detailed, non-sanitized technical error logging on the server console (with stack traces).
 * 2. Complete data protection: zero internal stack traces, DB queries, or credentials leaked to clients.
 * 3. Safe, user-friendly responses for production clients.
 * 4. Preservation of clean, actionable operational validation messages.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Track request duration
  let durationMs = 0;
  if (req.startTime) {
    const diff = process.hrtime(req.startTime);
    durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
  }

  // 1. Full Server-Side Logging (Always available for developers)
  logger.error(
    `[${req.method}] ${req.originalUrl || req.url} - Error: ${err.message || 'Unknown Error'} (${durationMs}ms)`,
    err,
    {
      requestId: req.id || 'N/A',
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?._id || 'unauthenticated',
      userRole: req.user?.role || 'none',
      params: req.params,
      query: req.query,
      body: req.body,
    }
  );

  // 2. Transform Specific Known Error Types

  // Mongoose CastError (e.g. Invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid format for resource identifier '${err.path || 'id'}'`;
    error = AppError.badRequest(message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    const cleanMsg = messages.length > 0 ? messages.join('. ') : 'Invalid input data provided';
    error = AppError.badRequest(cleanMsg);
  }

  // MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with this ${field} already exists. Please use a unique value.`;
    error = AppError.conflict(message);
  }

  // JWT Verification / Expiry Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Session expired or invalid. Please log in again.');
  }

  // Multer Upload Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = AppError.badRequest('File size exceeds the 5MB upload limit. Please upload a smaller file.');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = AppError.badRequest('Unexpected file field received in upload.');
    } else {
      error = AppError.badRequest(`File upload error: ${err.message}`);
    }
  }

  // Body Parser / JSON Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = AppError.badRequest('Invalid JSON payload formatted in request body');
  }

  // Determine status code and message
  const statusCode = error.statusCode || (error.status && Number.isInteger(error.status) ? error.status : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  // 3. Response Construction
  if (error.isOperational && statusCode < 500) {
    // Trusted operational client error (400, 401, 403, 404, 409, 429)
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      requestId: req.id,
    });
  }

  // Unexpected Server Error (500, Database down, unhandled library exception)
  const userSafeMessage = 'Something went wrong. Please try again later.';

  const responsePayload = {
    success: false,
    message: userSafeMessage,
    requestId: req.id,
  };

  // In non-production mode, append developer debug details without breaking client structure
  if (!isProduction) {
    responsePayload.debug = {
      name: err.name,
      originalMessage: err.message,
      stack: err.stack,
    };
  }

  return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json(responsePayload);
};

export default errorHandler;
