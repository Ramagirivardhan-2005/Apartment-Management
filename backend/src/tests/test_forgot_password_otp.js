import fetch from 'node-fetch';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const runForgotPassTests = async () => {
  console.log('\n======================================================');
  console.log('🔒 TESTING FORGOT PASSWORD VIA EMAIL OTP WORKFLOW');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  };

  try {
    await connectDB();

    const testEmail = `recovery.user.${Date.now()}@apartment.com`;
    const initialPassword = 'InitialPassword123!';
    const updatedPassword = 'NewSecretPassword456!';

    // 1. Create active verified user
    console.log('\n--- 1. PREPARING TEST USER ---');
    const user = await User.create({
      fullName: 'Vikram Malhotra',
      email: testEmail,
      mobile: '9876500011',
      password: initialPassword,
      role: 'resident',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active',
    });
    assert(!!user._id, 'Test user account created');

    // 2. Request Forgot Password OTP
    console.log('\n--- 2. REQUEST FORGOT PASSWORD OTP ---');
    const resForgot = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const dataForgot = await resForgot.json();
    assert(dataForgot.success === true, 'POST /auth/forgot-password sends 6-digit OTP email', dataForgot.message);

    // 3. Test Cooldown
    console.log('\n--- 3. VERIFY 60S COOLDOWN ENFORCEMENT ---');
    const resCooldown = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const dataCooldown = await resCooldown.json();
    assert(dataCooldown.success === false, 'Enforce 60-second cooldown on repeated OTP requests', dataCooldown.message);

    // 4. Test Invalid OTP Attempt
    console.log('\n--- 4. TEST INVALID OTP SUBMISSION ---');
    const resInvalidOtp = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' }),
    });
    const dataInvalidOtp = await resInvalidOtp.json();
    assert(dataInvalidOtp.success === false && dataInvalidOtp.remainingAttempts !== undefined, 'Invalid OTP rejected with attempts count tracking', dataInvalidOtp.message);

    // 5. Simulate Valid OTP Entry
    console.log('\n--- 5. VERIFY VALID 6-DIGIT OTP ---');
    const rawOtp = '789123';
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    await User.findByIdAndUpdate(user._id, {
      resetPasswordOtpHash: otpHash,
      resetPasswordOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const resVerifyOtp = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: rawOtp }),
    });
    const dataVerifyOtp = await resVerifyOtp.json();
    assert(dataVerifyOtp.success === true && !!dataVerifyOtp.resetToken, 'POST /auth/verify-reset-otp returns reset token', dataVerifyOtp.message);

    const resetToken = dataVerifyOtp.resetToken;

    // 6. Reset Password with Reset Token
    console.log('\n--- 6. RESET PASSWORD WITH TOKEN ---');
    const resResetPass = await fetch(`${API_BASE}/auth/reset-password-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        resetToken,
        newPassword: updatedPassword,
      }),
    });
    const dataResetPass = await resResetPass.json();
    assert(dataResetPass.success === true, 'POST /auth/reset-password-otp updates user password', dataResetPass.message);

    // 7. Verify Old Password Fails
    console.log('\n--- 7. VERIFY OLD PASSWORD IS INVALIDATED ---');
    const resOldLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    const dataOldLogin = await resOldLogin.json();
    assert(dataOldLogin.success === false, 'Old password rejected on login (401 Unauthorized)', dataOldLogin.message);

    // 8. Verify New Password Succeeds
    console.log('\n--- 8. VERIFY NEW PASSWORD LOGS IN SUCCESSFULLY ---');
    const resNewLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword,
      }),
    });
    const dataNewLogin = await resNewLogin.json();
    assert(dataNewLogin.success === true && !!dataNewLogin.token, 'New password authenticates and returns JWT token', dataNewLogin.message);

    // Cleanup test user
    await User.findByIdAndDelete(user._id);

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
};

runForgotPassTests();
