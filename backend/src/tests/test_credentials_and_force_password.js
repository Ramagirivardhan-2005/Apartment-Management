import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { hashOtp } from '../utils/otpUtils.js';
import { generateVerificationToken } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- Starting Credentials & Force Password Change Test Suite ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to DB for testing');

    const testTimestamp = Date.now();

    // 1. Fetch or ensure Super Admin
    let superAdmin = await User.findOne({ role: 'super_admin', isDeleted: false });
    if (!superAdmin) {
      superAdmin = await User.create({
        fullName: 'Super Admin Test',
        email: `super.admin.${testTimestamp}@test.com`,
        mobile: `99${testTimestamp.toString().slice(-8)}`,
        password: 'Password@123',
        role: 'super_admin',
        isEmailVerified: true,
        status: 'active',
      });
    } else {
      superAdmin.password = 'Password@123';
      await superAdmin.save();
    }

    // Step 1: Login Super Admin
    const saLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: superAdmin.email,
        password: 'Password@123',
      }),
    });
    const saLoginData = await saLoginRes.json();
    assert(saLoginData.success && saLoginData.requiresOtp, 'Super Admin initial login requested 2FA OTP');

    // Retrieve Super Admin OTP from DB
    const saUserDb = await User.findById(superAdmin._id);
    const saTestOtp = '123456';
    saUserDb.loginOtpHash = hashOtp(saTestOtp);
    saUserDb.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await saUserDb.save();

    const saVerifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: saLoginData.verificationToken,
        otp: saTestOtp,
      }),
    });
    const saVerifyData = await saVerifyRes.json();
    assert(saVerifyData.success && saVerifyData.token, 'Super Admin 2FA verified and token received');
    const saToken = saVerifyData.token;

    // 2. Super Admin creates Block and Block Admin
    const baEmail = `block.admin.${testTimestamp}@test.com`;
    const blockRes = await fetch(`${API_BASE}/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${saToken}`,
      },
      body: JSON.stringify({
        name: `Tower ${testTimestamp.toString().slice(-4)}`,
        code: `T${testTimestamp.toString().slice(-3)}`,
        totalFloors: 10,
        roomsPerFloor: 4,
        adminName: 'BA Test User',
        adminEmail: baEmail,
        adminMobile: `98${testTimestamp.toString().slice(-8)}`,
      }),
    });
    const blockData = await blockRes.json();
    console.log('blockData:', blockData);
    assert(blockData.success, 'Block and Block Admin created by Super Admin');

    // Check Block Admin in DB
    const baUserDb = await User.findOne({ email: baEmail });
    assert(baUserDb && baUserDb.mustChangePassword === true, 'Block Admin created with mustChangePassword = true');
    assert(baUserDb.status === 'pending_verification', 'Block Admin created with pending_verification');

    // Verify Block Admin Email OTP & Activate
    const baActivationOtp = '654321';
    baUserDb.emailOtpHash = hashOtp(baActivationOtp);
    baUserDb.emailOtpExpiresAt = new Date(Date.now() + 600000);
    await baUserDb.save();

    const baOtpVerifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: baEmail,
        otp: baActivationOtp,
      }),
    });
    const baOtpVerifyData = await baOtpVerifyRes.json();
    assert(baOtpVerifyData.success, 'Block Admin email OTP verified successfully');

    // Set temp known password for testing
    baUserDb.password = 'TempPass@123';
    await baUserDb.save();

    // 3. Block Admin logs in with temporary password
    const baLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: baEmail,
        password: 'TempPass@123',
      }),
    });
    const baLoginData = await baLoginRes.json();
    assert(baLoginData.success && baLoginData.requiresOtp, 'Block Admin login requested 2FA OTP');

    // Mock 2FA OTP for Block Admin
    const baUserReload = await User.findOne({ email: baEmail });
    baUserReload.loginOtpHash = hashOtp('112233');
    baUserReload.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await baUserReload.save();

    const baLoginVerifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: baLoginData.verificationToken,
        otp: '112233',
      }),
    });
    const baLoginVerifyData = await baLoginVerifyRes.json();
    assert(baLoginVerifyData.success && baLoginVerifyData.user.mustChangePassword === true, 'Block Admin 2FA returns mustChangePassword = true');
    const baToken = baLoginVerifyData.token;

    // 4. Block Admin forces password change
    const baForcePassRes = await fetch(`${API_BASE}/auth/force-change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${baToken}`,
      },
      body: JSON.stringify({
        newPassword: 'MyNewSecurePassword@2026',
      }),
    });
    const baForcePassData = await baForcePassRes.json();
    assert(baForcePassData.success && baForcePassData.user.mustChangePassword === false, 'Block Admin force-change-password sets mustChangePassword = false');

    // Verify DB state
    const baFinalDb = await User.findOne({ email: baEmail });
    assert(baFinalDb.mustChangePassword === false, 'Database confirms mustChangePassword is false');

    // 5. Block Admin creates Receptionist
    const recEmail = `receptionist.${testTimestamp}@test.com`;
    const recRes = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${baToken}`,
      },
      body: JSON.stringify({
        fullName: 'Receptionist Test User',
        email: recEmail,
        mobile: `97${testTimestamp.toString().slice(-8)}`,
      }),
    });
    const recData = await recRes.json();
    assert(recData.success, 'Receptionist created by Block Admin');

    const recUserDb = await User.findOne({ email: recEmail });
    assert(recUserDb && recUserDb.mustChangePassword === true, 'Receptionist created with mustChangePassword = true');

    // Activate Receptionist
    recUserDb.isEmailVerified = true;
    recUserDb.status = 'active';
    recUserDb.password = 'RecTemp@123';
    await recUserDb.save();

    // Receptionist logs in
    const recLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: recEmail,
        password: 'RecTemp@123',
      }),
    });
    const recLoginData = await recLoginRes.json();
    assert(recLoginData.success && recLoginData.requiresOtp, 'Receptionist login requested 2FA');

    const recUserReload = await User.findOne({ email: recEmail });
    recUserReload.loginOtpHash = hashOtp('334455');
    recUserReload.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await recUserReload.save();

    const recLoginVerifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: recLoginData.verificationToken,
        otp: '334455',
      }),
    });
    const recLoginVerifyData = await recLoginVerifyRes.json();
    assert(recLoginVerifyData.success && recLoginVerifyData.user.mustChangePassword === true, 'Receptionist 2FA returns mustChangePassword = true');
    const recToken = recLoginVerifyData.token;

    // Receptionist forces password change
    const recForcePassRes = await fetch(`${API_BASE}/auth/force-change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        newPassword: 'RecPersonalPassword@2026',
      }),
    });
    const recForcePassData = await recForcePassRes.json();
    assert(recForcePassData.success && recForcePassData.user.mustChangePassword === false, 'Receptionist updated password and mustChangePassword is false');

    // 6. Receptionist registers Resident
    const resEmail = `resident.${testTimestamp}@test.com`;
    const residentRes = await fetch(`${API_BASE}/users/resident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recToken}`,
      },
      body: JSON.stringify({
        fullName: 'Resident Test User',
        email: resEmail,
        mobile: `96${testTimestamp.toString().slice(-8)}`,
      }),
    });
    const residentData = await residentRes.json();
    assert(residentData.success, 'Resident registered by Receptionist');

    const resUserDb = await User.findOne({ email: resEmail });
    assert(resUserDb && resUserDb.mustChangePassword === true, 'Resident registered with mustChangePassword = true');

    // Resident signs in & completes force-change-password
    resUserDb.password = 'ResidentTemp@123';
    await resUserDb.save();

    const resLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: resEmail,
        password: 'ResidentTemp@123',
      }),
    });
    const resLoginData = await resLoginRes.json();
    assert(resLoginData.success && resLoginData.requiresOtp, 'Resident login requested 2FA');

    const resUserReload = await User.findOne({ email: resEmail });
    resUserReload.loginOtpHash = hashOtp('778899');
    resUserReload.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await resUserReload.save();

    const resLoginVerifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: resLoginData.verificationToken,
        otp: '778899',
      }),
    });
    const resLoginVerifyData = await resLoginVerifyRes.json();
    assert(resLoginVerifyData.success && resLoginVerifyData.user.mustChangePassword === true, 'Resident 2FA returns mustChangePassword = true');

    const resForcePassRes = await fetch(`${API_BASE}/auth/force-change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resLoginVerifyData.token}`,
      },
      body: JSON.stringify({
        newPassword: 'ResidentPersonalPassword@2026',
      }),
    });
    const resForcePassData = await resForcePassRes.json();
    assert(resForcePassData.success && resForcePassData.user.mustChangePassword === false, 'Resident updated password and mustChangePassword is false');

  } catch (error) {
    console.error('Test error:', error);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log(`\n========================================`);
    console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
