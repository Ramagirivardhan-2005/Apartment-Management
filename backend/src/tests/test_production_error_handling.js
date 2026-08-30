import { logger, sanitizeData } from '../utils/logger.js';
import { AppError } from '../utils/appError.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('\n====================================================');
  console.log('🧪 RUNNING PRODUCTION ERROR HANDLING & LOGGING TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, testName) => {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  };

  // Test 1: Sensitive Data Masking in Logger
  console.log('--- 1. Testing Sensitive Data Sanitizer ---');
  const sensitivePayload = {
    email: 'resident@skyline.com',
    password: 'superSecretPassword123!',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    otp: '984512',
    razorpay_secret: 's8e97fS9DFhsd9f8sdhf89sd',
    cardDetails: {
      cardNumber: '4111222233334444',
      cvv: '123',
      expiry: '12/28',
    },
  };

  const sanitized = sanitizeData(sensitivePayload);
  assert(sanitized.email === 'resident@skyline.com', 'Preserves non-sensitive email field');
  assert(sanitized.password === '[REDACTED]', 'Masks raw password');
  assert(sanitized.token === '[REDACTED]', 'Masks JWT authorization token');
  assert(sanitized.otp === '[REDACTED]', 'Masks OTP numbers');
  assert(sanitized.razorpay_secret === '[REDACTED]', 'Masks payment gateway secret');
  assert(sanitized.cardDetails.cardNumber === '[REDACTED]', 'Masks nested credit card number');
  assert(sanitized.cardDetails.cvv === '[REDACTED]', 'Masks nested CVV');
  assert(sanitized.cardDetails.expiry === '12/28', 'Preserves non-sensitive expiry date');

  // Test 2: AppError Factory & Classification
  console.log('\n--- 2. Testing AppError Class ---');
  const badReq = AppError.badRequest('Invalid room preference');
  assert(badReq.statusCode === 400, 'AppError.badRequest sets status 400');
  assert(badReq.isOperational === true, 'AppError is marked operational');
  assert(badReq.isUserSafe === true, '400 error is marked user-safe');

  const internalErr = AppError.internal();
  assert(internalErr.statusCode === 500, 'AppError.internal sets status 500');
  assert(internalErr.isOperational === false, 'AppError.internal is non-operational');
  assert(internalErr.isUserSafe === false, '500 error is not user-safe');

  // Test 3: 404 Undefined Route Handler
  console.log('\n--- 3. Testing 404 Route Handler via API ---');
  try {
    const res404 = await fetch(`${API_BASE}/non-existent-route-endpoint-xyz`);
    const data404 = await res404.json();
    assert(res404.status === 404, 'Returns HTTP 404 for undefined routes');
    assert(data404.success === false, 'Returns success: false');
    assert(data404.requestId !== undefined, 'Returns correlation requestId in response');
    assert(res404.headers.get('x-request-id') !== null, 'Response contains X-Request-Id header');
  } catch (e) {
    assert(false, `404 route test encountered exception: ${e.message}`);
  }

  // Test 4: Malformed JWT Error Handling
  console.log('\n--- 4. Testing Invalid/Malformed JWT Authentication ---');
  try {
    const resAuth = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: 'Bearer invalid.malformed.jwt.token',
      },
    });
    const dataAuth = await resAuth.json();
    assert(resAuth.status === 401, 'Returns HTTP 401 for malformed JWT');
    assert(dataAuth.success === false, 'Returns success: false');
    assert(!JSON.stringify(dataAuth).includes('jwt malformed'), 'Does not leak raw jwt library exception');
    assert(dataAuth.message === 'Invalid or expired session. Please log in again.', 'Returns clean user-friendly session message');
  } catch (e) {
    assert(false, `Auth test encountered exception: ${e.message}`);
  }

  // Test 5: Invalid ObjectId (Mongoose CastError Transformation)
  console.log('\n--- 5. Testing Invalid ObjectId (Mongoose CastError) ---');
  try {
    // Attempting to fetch a room with an invalid ObjectId format
    const resCast = await fetch(`${API_BASE}/rooms/invalid-object-id-12345`);
    const dataCast = await resCast.json();
    assert(resCast.status === 400 || resCast.status === 401, 'Handles invalid ObjectId with safe 4xx status');
    assert(!JSON.stringify(dataCast).includes('Cast to ObjectId failed'), 'Does not leak raw Mongoose CastError BSON details');
  } catch (e) {
    assert(false, `CastError test encountered exception: ${e.message}`);
  }

  // Test 6: Health Endpoint
  console.log('\n--- 6. Testing Health Endpoint ---');
  try {
    const resHealth = await fetch(`${API_BASE}/health`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200, 'Health check returns HTTP 200');
    assert(dataHealth.status === 'online', 'Health status is online');
    assert(dataHealth.database === 'connected', 'Database connection verified');
  } catch (e) {
    assert(false, `Health check test encountered exception: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL PRODUCTION ERROR HANDLING & LOGGING TESTS PASSED (100%)!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
};

runTests();
