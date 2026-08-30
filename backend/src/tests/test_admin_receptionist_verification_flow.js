import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { hashOtp } from '../utils/otpUtils.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const runVerificationFlowTests = async () => {
  console.log('\n====================================================');
  console.log('🧪 TESTING ADMIN & RECEPTIONIST VERIFICATION & ADVANCE PAYMENT FLOW');
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

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Setup Root Super Admin if not present
    let superAdmin = await User.findOne({ role: 'super_admin', isDeleted: false });
    if (!superAdmin) {
      superAdmin = await User.create({
        fullName: 'Super Administrator',
        email: `superadmin.${Date.now()}@apartment.com`,
        mobile: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'AdminPassword123!',
        role: 'super_admin',
        employeeId: 'ROOT-001',
        status: 'active',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });
    } else {
      superAdmin.password = 'AdminPassword123!';
      await superAdmin.save();
    }

    // Login as Super Admin to get token
    const saLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: superAdmin.email, password: 'AdminPassword123!' }),
    });
    const saLoginData = await saLoginRes.json();

    let saToken = '';
    if (saLoginData.requiresOtp) {
      // Set test OTP in DB
      const dbSA = await User.findById(superAdmin._id);
      const testOtp = '123456';
      dbSA.loginOtpHash = hashOtp(testOtp);
      await dbSA.save();

      const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken: saLoginData.verificationToken,
          otp: testOtp,
        }),
      });
      const verifyData = await verifyRes.json();
      saToken = verifyData.token;
    } else {
      saToken = saLoginData.token;
    }

    assert(!!saToken, 'Super Admin logged in successfully');

    // 2. Create a Dedicated Test Block
    const block = await Block.create({
      name: `Block Test ${Date.now()}`,
      code: `BLK-${Math.floor(1000 + Math.random() * 9000)}`,
      floors: 4,
      totalRooms: 10,
      totalParkingSlots: 5,
      status: 'active',
    });
    assert(!!block, 'Dedicated Target Block created');

    // 3. Create Block Admin for the First Time
    console.log('\n--- 1. Testing Block Admin Creation & Verification ---');
    const adminEmail = `blockadmin.${Date.now()}@apartment.com`;
    const createAdminRes = await fetch(`${API_BASE}/users/block-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${saToken}`,
      },
      body: JSON.stringify({
        fullName: 'Marcus Admin',
        email: adminEmail,
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        assignedBlock: block._id,
      }),
    });
    const createAdminData = await createAdminRes.json();
    assert(createAdminRes.status === 201, 'Block Admin created successfully (201)');

    const dbAdmin = await User.findOne({ email: adminEmail });
    assert(dbAdmin.status === 'pending_verification', 'Block Admin status is pending_verification');
    assert(dbAdmin.isEmailVerified === false, 'Block Admin isEmailVerified is false');
    assert(dbAdmin.mustChangePassword === false, 'mustChangePassword is false (no new password required)');
    assert(!!dbAdmin.emailOtpHash, 'Verification email OTP hash generated in database');

    // 4. Verify Block Admin Account via OTP without password setup
    const testAdminOtp = '987654';
    dbAdmin.emailOtpHash = hashOtp(testAdminOtp);
    await dbAdmin.save();

    const verifyAdminRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        otp: testAdminOtp,
      }),
    });
    const verifyAdminData = await verifyAdminRes.json();
    assert(verifyAdminRes.status === 200, 'Block Admin verified via OTP successfully');
    assert(verifyAdminData.success === true, 'Verification returns success: true');
    assert(!!verifyAdminData.token, 'Verification returns valid JWT authentication token immediately');
    assert(verifyAdminData.user.status === 'active', 'Verified user status is active');

    // 5. Create Receptionist for the First Time
    console.log('\n--- 2. Testing Receptionist Creation & Verification ---');
    const recEmail = `receptionist.${Date.now()}@apartment.com`;
    const createRecRes = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifyAdminData.token}`, // Block Admin creates receptionist
      },
      body: JSON.stringify({
        fullName: 'Priya Receptionist',
        email: recEmail,
        mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        assignedBlock: block._id,
      }),
    });
    const createRecData = await createRecRes.json();
    if (createRecRes.status !== 201) {
      console.error('DEBUG createRecData:', createRecRes.status, createRecData);
    }
    assert(createRecRes.status === 201, 'Receptionist created successfully (201)');

    const dbRec = await User.findOne({ email: recEmail });
    assert(dbRec?.status === 'pending_verification', 'Receptionist status is pending_verification');
    assert(dbRec?.isEmailVerified === false, 'Receptionist isEmailVerified is false');
    assert(dbRec?.mustChangePassword === false, 'mustChangePassword is false (no new password required)');
    assert(!!dbRec?.emailOtpHash, 'Verification email OTP hash generated for Receptionist');

    // 6. Verify Receptionist Account via OTP without password setup
    const testRecOtp = '543210';
    dbRec.emailOtpHash = hashOtp(testRecOtp);
    await dbRec.save();

    const verifyRecRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: recEmail,
        otp: testRecOtp,
      }),
    });
    const verifyRecData = await verifyRecRes.json();
    assert(verifyRecRes.status === 200, 'Receptionist verified via OTP successfully');
    assert(verifyRecData.success === true, 'Verification returns success: true');
    assert(!!verifyRecData.token, 'Verification returns JWT token for immediate portal & advance payment access');
    assert(verifyRecData.user.status === 'active', 'Receptionist status is active');

    // 7. Test Direct Link Activation endpoint (/auth/activate-account)
    console.log('\n--- 3. Testing 1-Click Email Activation Endpoint ---');
    const residentEmail = `resident.${Date.now()}@apartment.com`;
    const resident = await User.create({
      fullName: 'Vikram Resident',
      email: residentEmail,
      mobile: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'ResidentPass123!',
      role: 'resident',
      status: 'pending_verification',
      isEmailVerified: false,
    });

    const activateRes = await fetch(`${API_BASE}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: residentEmail }),
    });
    const activateData = await activateRes.json();
    assert(activateRes.status === 200, 'Direct email activation succeeds without password input');
    assert(!!activateData.token, 'Returns JWT token for advance payment flow');

    // 8. Test Advance Payment Access
    console.log('\n--- 4. Testing Advance Payment Flow Access ---');
    const paymentsRes = await fetch(`${API_BASE}/payments`, {
      headers: { Authorization: `Bearer ${activateData.token}` },
    });
    assert(paymentsRes.status === 200, 'Verified user can directly access payments endpoint');

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================\n');

    if (passed === total) {
      console.log('🎉 ALL ADMIN & RECEPTIONIST VERIFICATION FLOW TESTS PASSED (100%)!\n');
      process.exit(0);
    } else {
      console.error('❌ SOME TESTS FAILED!\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test Exception:', err);
    process.exit(1);
  }
};

runVerificationFlowTests();
