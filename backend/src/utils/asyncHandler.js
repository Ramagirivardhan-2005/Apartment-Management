/**
 * Async Route Handler Wrapper
 * Automatically catches uncaught Promise rejections and passes them to next(err)
 * for centralized error handling and logging.
 * 
 * @param {Function} fn - Express async route handler (req, res, next)
 * @returns {Function}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
