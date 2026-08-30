import fetch from 'node-fetch';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const runGlobalOtpAuthTests = async () => {
  console.log('\n======================================================');
  console.log('🛡️ TESTING MANDATORY GLOBAL OTP AUTHENTICATION (ALL ROLES)');
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

    // 1. Root Super Admin Creation
    console.log('\n--- 1. ROOT SUPER ADMIN SETUP ---');
    const superAdminEmail = `super.admin.${Date.now()}@apartment.com`;
    const superAdminPass = 'SuperAdminSecret123!';

    const resRoot = await fetch(`${API_BASE}/auth/initial-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Root Super Admin',
        email: superAdminEmail,
        mobile: '9999900001',
        password: superAdminPass,
      }),
    });
    const dataRoot = await resRoot.json();
    assert(dataRoot.success === true, 'Root Super Admin initialized');

    // 2. Super Admin Mandatory 2-Step Login
    console.log('\n--- 2. SUPER ADMIN 2-STEP LOGIN ---');
    const resSALogin1 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: superAdminEmail, password: superAdminPass }),
    });
    const dataSALogin1 = await resSALogin1.json();
    assert(
      dataSALogin1.success === true && dataSALogin1.requiresOtp === true && !dataSALogin1.token,
      'Super Admin Step 1: Credentials validated, OTP generated, NO direct JWT issued',
      dataSALogin1.message
    );

    // Set known OTP in DB for automated test
    const saOtp = '482731';
    const saOtpHash = crypto.createHash('sha256').update(saOtp).digest('hex');
    await User.findOneAndUpdate({ email: superAdminEmail }, { loginOtpHash: saOtpHash });

    // Step 2: Verify Login OTP
    const resSALogin2 = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: dataSALogin1.verificationToken,
        otp: saOtp,
      }),
    });
    const dataSALogin2 = await resSALogin2.json();
    assert(
      dataSALogin2.success === true && !!dataSALogin2.token && dataSALogin2.user?.role === 'super_admin',
      'Super Admin Step 2: Valid OTP issues final JWT and unlocks dashboard',
      dataSALogin2.message
    );
    const superAdminToken = dataSALogin2.token;

    // 3. Super Admin creates Block A & Block Admin
    console.log('\n--- 3. CREATE BLOCK & BLOCK ADMIN WITH ACTIVATION OTP ---');
    const blockAdminEmail = `block.admin.${Date.now()}@apartment.com`;
    const resCreateBlock = await fetch(`${API_BASE}/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Block A - Amber Tower',
        code: `BA-${Date.now().toString().slice(-4)}`,
        floors: 5,
        totalRooms: 20,
        address: 'North Wing',
        adminName: 'Aarav Patel',
        adminEmail: blockAdminEmail,
        adminMobile: '9999900002',
      }),
    });
    const dataCreateBlock = await resCreateBlock.json();
    assert(dataCreateBlock.success === true, 'Block & Block Admin created in PENDING_VERIFICATION state', dataCreateBlock.message);

    // Block Admin verifies activation OTP & sets password
    const baActivationOtp = '112233';
    const baActivationHash = crypto.createHash('sha256').update(baActivationOtp).digest('hex');
    await User.findOneAndUpdate({ email: blockAdminEmail }, { emailOtpHash: baActivationHash });

    const resBAVerify = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: blockAdminEmail, otp: baActivationOtp }),
    });
    const dataBAVerify = await resBAVerify.json();
    assert(dataBAVerify.success === true && !!dataBAVerify.setupPasswordToken, 'Block Admin verifies activation OTP');

    const blockAdminPass = 'BlockAdminPass123!';
    const resBASetup = await fetch(`${API_BASE}/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: blockAdminEmail,
        token: dataBAVerify.setupPasswordToken,
        password: blockAdminPass,
      }),
    });
    const dataBASetup = await resBASetup.json();
    assert(dataBASetup.success === true, 'Block Admin completes password setup and activates account');

    // 4. Block Admin Mandatory 2-Step Login
    console.log('\n--- 4. BLOCK ADMIN 2-STEP LOGIN ---');
    const resBALogin1 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: blockAdminEmail, password: blockAdminPass }),
    });
    const dataBALogin1 = await resBALogin1.json();
    assert(dataBALogin1.success === true && dataBALogin1.requiresOtp === true, 'Block Admin Step 1: Requires 6-digit login OTP');

    const baLoginOtp = '654321';
    await User.findOneAndUpdate({ email: blockAdminEmail }, {
      loginOtpHash: crypto.createHash('sha256').update(baLoginOtp).digest('hex'),
    });

    const resBALogin2 = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: dataBALogin1.verificationToken,
        otp: baLoginOtp,
      }),
    });
    const dataBALogin2 = await resBALogin2.json();
    assert(dataBALogin2.success === true && !!dataBALogin2.token, 'Block Admin Step 2: Valid OTP grants authenticated JWT');
    const blockAdminToken = dataBALogin2.token;

    // 5. Block Admin creates Receptionist
    console.log('\n--- 5. CREATE RECEPTIONIST WITH ACTIVATION OTP ---');
    const recEmail = `receptionist.${Date.now()}@apartment.com`;
    const resCreateRec = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${blockAdminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Kavita Singh',
        email: recEmail,
        mobile: '9999900003',
      }),
    });
    const dataCreateRec = await resCreateRec.json();
    assert(dataCreateRec.success === true, 'Receptionist created with activation OTP trigger');

    // Receptionist verifies activation OTP & sets password
    const recActivationOtp = '334455';
    await User.findOneAndUpdate({ email: recEmail }, {
      emailOtpHash: crypto.createHash('sha256').update(recActivationOtp).digest('hex'),
    });

    const resRecVerify = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recEmail, otp: recActivationOtp }),
    });
    const dataRecVerify = await resRecVerify.json();
    assert(dataRecVerify.success === true, 'Receptionist verifies activation OTP');

    const recPass = 'ReceptionistPass123!';
    const resRecSetup = await fetch(`${API_BASE}/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: recEmail,
        token: dataRecVerify.setupPasswordToken,
        password: recPass,
      }),
    });
    const dataRecSetup = await resRecSetup.json();
    assert(dataRecSetup.success === true, 'Receptionist completes password setup and activates account');

    // 6. Receptionist Mandatory 2-Step Login
    console.log('\n--- 6. RECEPTIONIST 2-STEP LOGIN ---');
    const resRecLogin1 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recEmail, password: recPass }),
    });
    const dataRecLogin1 = await resRecLogin1.json();
    assert(dataRecLogin1.success === true && dataRecLogin1.requiresOtp === true, 'Receptionist Step 1: Requires 6-digit login OTP');

    const recLoginOtp = '987123';
    await User.findOneAndUpdate({ email: recEmail }, {
      loginOtpHash: crypto.createHash('sha256').update(recLoginOtp).digest('hex'),
    });

    const resRecLogin2 = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: dataRecLogin1.verificationToken,
        otp: recLoginOtp,
      }),
    });
    const dataRecLogin2 = await resRecLogin2.json();
    assert(dataRecLogin2.success === true && !!dataRecLogin2.token, 'Receptionist Step 2: Valid OTP grants authenticated JWT');

    // 7. Resident Self-Registration & 2-Step Login
    console.log('\n--- 7. RESIDENT SELF-REGISTRATION & 2-STEP LOGIN ---');
    const residentEmail = `resident.${Date.now()}@apartment.com`;
    const residentPass = 'ResidentPass123!';

    const resResidentReg = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Neha Sharma',
        email: residentEmail,
        mobile: '9999900004',
        password: residentPass,
      }),
    });
    const dataResidentReg = await resResidentReg.json();
    assert(dataResidentReg.success === true && !!dataResidentReg.registrationId, 'Resident self-registers and receives REG ID');

    // Verify Resident Activation OTP
    const resActivationOtp = '556677';
    await User.findOneAndUpdate({ email: residentEmail }, {
      emailOtpHash: crypto.createHash('sha256').update(resActivationOtp).digest('hex'),
    });

    const resResidentVerify = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: residentEmail, otp: resActivationOtp }),
    });
    const dataResidentVerify = await resResidentVerify.json();
    assert(dataResidentVerify.success === true, 'Resident verifies activation OTP');

    // Resident Step 1 Login
    const resResidentLogin1 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: residentEmail, password: residentPass }),
    });
    const dataResidentLogin1 = await resResidentLogin1.json();
    assert(dataResidentLogin1.success === true && dataResidentLogin1.requiresOtp === true, 'Resident Step 1: Requires 6-digit login OTP');

    // Resident Step 2 Login
    const resLoginOtp = '778899';
    await User.findOneAndUpdate({ email: residentEmail }, {
      loginOtpHash: crypto.createHash('sha256').update(resLoginOtp).digest('hex'),
    });

    const resResidentLogin2 = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: dataResidentLogin1.verificationToken,
        otp: resLoginOtp,
      }),
    });
    const dataResidentLogin2 = await resResidentLogin2.json();
    assert(dataResidentLogin2.success === true && !!dataResidentLogin2.token, 'Resident Step 2: Valid OTP grants authenticated JWT');

    // 8. Rate Limiting & Security Safeguards
    console.log('\n--- 8. SECURITY CONTROLS & RATE LIMITING ---');
    // Lockout after invalid attempts
    const resLockout1 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: residentEmail, password: residentPass }),
    });
    const dataLockout1 = await resLockout1.json();

    const resBadOtp = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: dataLockout1.verificationToken,
        otp: '000000',
      }),
    });
    const dataBadOtp = await resBadOtp.json();
    assert(dataBadOtp.success === false && dataBadOtp.remainingAttempts !== undefined, 'Invalid login OTP rejected with remaining attempts tracking');

    // 60-second cooldown check on resend
    const resCooldown = await fetch(`${API_BASE}/auth/resend-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: dataLockout1.verificationToken }),
    });
    const dataCooldown = await resCooldown.json();
    assert(dataCooldown.success === false, '60-second cooldown enforced on login OTP resend requests');

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal Test Error:', error);
    process.exit(1);
  }
};

runGlobalOtpAuthTests();
