import crypto from 'crypto';

/**
 * Request Context Middleware
 * Generates and binds a unique correlation ID (X-Request-Id) to each request/response,
 * and records high-resolution start time for performance tracking.
 */
export const requestContext = (req, res, next) => {
  // Use incoming request ID from reverse proxy/CDN if available, else generate fresh UUID
  const requestId = req.headers['x-request-id'] || `req_${crypto.randomUUID()}`;
  
  req.id = requestId;
  req.startTime = process.hrtime();

  res.setHeader('X-Request-Id', requestId);
  next();
};

export default requestContext;
