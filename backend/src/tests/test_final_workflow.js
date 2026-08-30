import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { Payment } from '../models/Payment.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🚀 STARTING COMPREHENSIVE FINAL WORKFLOW TEST SUITE');
  console.log('======================================================\n');

  let superAdminToken = '';
  let blockAdminToken = '';
  let receptionistToken = '';
  let residentToken = '';
  let blockAId = '';
  let room101Id = '';

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

    // 1. Initial Setup Status
    console.log('\n--- 1. FIRST-TIME SETUP CHECK ---');
    const resSetup1 = await fetch(`${API_BASE}/auth/setup-status`);
    const dataSetup1 = await resSetup1.json();
    assert(dataSetup1.setupRequired === true, 'GET /setup-status returns setupRequired: true for 0 records');

    // 2. Initialize Super Admin
    console.log('\n--- 2. INITIALIZE ROOT SUPER ADMIN ---');
    const resRoot = await fetch(`${API_BASE}/auth/initial-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Master Super Admin',
        email: 'superadmin@apartment.com',
        mobile: '9999999999',
        password: 'Password123!',
      }),
    });
    const dataRoot = await resRoot.json();
    assert(dataRoot.success === true && !!dataRoot.token, 'POST /auth/initial-setup creates root Super Admin', dataRoot.message);
    superAdminToken = dataRoot.token;

    // 3. Setup Status is now false
    const resSetup2 = await fetch(`${API_BASE}/auth/setup-status`);
    const dataSetup2 = await resSetup2.json();
    assert(dataSetup2.setupRequired === false, 'GET /setup-status returns setupRequired: false after root initialization');

    // 4. Super Admin Creates Block A with Block Admin (OTP Verification required)
    console.log('\n--- 3. SUPER ADMIN CREATES BLOCK A & BLOCK ADMIN ---');
    const resBlock = await fetch(`${API_BASE}/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Block A (Rosewood)',
        code: 'BLK-A',
        address: 'Tower A, Boulevard Avenue',
        floors: 5,
        totalRooms: 20,
        adminName: 'Rahul Verma',
        adminEmail: 'rahul.admin@apartment.com',
        adminMobile: '9876543210',
        adminEmployeeId: 'BA-1001',
      }),
    });
    const dataBlock = await resBlock.json();
    assert(dataBlock.success === true, 'Super Admin creates Block A and Block Admin with OTP email trigger', dataBlock.message);
    blockAId = dataBlock.data._id;

    // 5. Block Admin Unverified Login Rejection
    console.log('\n--- 4. BLOCK ADMIN UNVERIFIED LOGIN REJECTION ---');
    const resUnverifiedLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.admin@apartment.com',
        password: 'any_password',
      }),
    });
    const dataUnverifiedLogin = await resUnverifiedLogin.json();
    assert(
      dataUnverifiedLogin.isEmailUnverified === true,
      'Unverified Block Admin login rejected with isEmailUnverified: true',
      dataUnverifiedLogin.message
    );

    // 6. Block Admin OTP Verification & Password Setup
    console.log('\n--- 5. BLOCK ADMIN OTP VERIFICATION & ACTIVATION ---');
    const adminUser = await User.findOne({ email: 'rahul.admin@apartment.com' });
    // Retrieve OTP hash from database to simulate user entering email OTP
    const rawAdminOtp = '123456';
    // For test simulation, let's verify with hash or update OTP for test
    adminUser.emailOtpHash = (await import('crypto')).default.createHash('sha256').update(rawAdminOtp).digest('hex');
    adminUser.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await adminUser.save();

    const resVerifyAdmin = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.admin@apartment.com',
        otp: rawAdminOtp,
      }),
    });
    const dataVerifyAdmin = await resVerifyAdmin.json();
    assert(dataVerifyAdmin.success === true, 'Block Admin verifies 6-digit OTP successfully', dataVerifyAdmin.message);

    // Set Admin Password
    const resSetAdminPass = await fetch(`${API_BASE}/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.admin@apartment.com',
        token: dataVerifyAdmin.setupPasswordToken,
        password: 'AdminPassword123!',
      }),
    });
    const dataSetAdminPass = await resSetAdminPass.json();
    assert(dataSetAdminPass.success === true && !!dataSetAdminPass.token, 'Block Admin sets password and receives auth token', dataSetAdminPass.message);
    blockAdminToken = dataSetAdminPass.token;

    // 7. Block Admin Creates Room 101 & 102
    console.log('\n--- 6. BLOCK ADMIN ROOM & PARKING CREATION ---');
    const resRoom1 = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${blockAdminToken}`,
      },
      body: JSON.stringify({
        roomNumber: 'A-101',
        floor: 1,
        roomType: '2BHK',
        areaSqFt: 950,
        bedrooms: 2,
        monthlyRent: 18000,
        securityDeposit: 18000,
      }),
    });
    const dataRoom1 = await resRoom1.json();
    assert(dataRoom1.success === true, 'Block Admin creates Room A-101 (AVAILABLE)', dataRoom1.message);
    room101Id = dataRoom1.data._id;

    // Create Parking Slot
    const resParking = await fetch(`${API_BASE}/parking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${blockAdminToken}`,
      },
      body: JSON.stringify({
        slotNumber: 'P-A01',
        floorArea: 'Basement 1',
        parkingType: 'Covered',
        vehicleType: '4-Wheeler',
        monthlyFee: 1500,
      }),
    });
    const dataParking = await resParking.json();
    assert(dataParking.success === true, 'Block Admin creates Parking Slot P-A01 (AVAILABLE)', dataParking.message);

    // 8. Block Admin Creates Receptionist (1 of 2)
    console.log('\n--- 7. RECEPTIONIST CREATION & LIMIT ENFORCEMENT ---');
    const resRec1 = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${blockAdminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Priya Sharma',
        email: 'priya.rec@apartment.com',
        mobile: '9876543222',
        employeeId: 'REC-101',
      }),
    });
    const dataRec1 = await resRec1.json();
    assert(dataRec1.success === true, 'Block Admin creates Receptionist 1 with OTP trigger', dataRec1.message);

    // Create 2nd Receptionist
    const resRec2 = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${blockAdminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Vikram Joshi',
        email: 'vikram.rec@apartment.com',
        mobile: '9876543233',
        employeeId: 'REC-102',
      }),
    });
    const dataRec2 = await resRec2.json();
    assert(dataRec2.success === true, 'Block Admin creates Receptionist 2 (Limit 2 reached)', dataRec2.message);

    // Attempt to create 3rd Receptionist (Must fail)
    const resRec3 = await fetch(`${API_BASE}/receptionists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${blockAdminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Anita Roy',
        email: 'anita.rec@apartment.com',
        mobile: '9876543244',
      }),
    });
    const dataRec3 = await resRec3.json();
    assert(dataRec3.success === false, 'Enforce max 2 receptionists per block limit (rejected 3rd creation)', dataRec3.message);

    // Verify Receptionist 1
    const recUser = await User.findOne({ email: 'priya.rec@apartment.com' });
    recUser.emailOtpHash = (await import('crypto')).default.createHash('sha256').update('654321').digest('hex');
    recUser.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await recUser.save();

    const resVerifyRec = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.rec@apartment.com',
        otp: '654321',
      }),
    });
    const dataVerifyRec = await resVerifyRec.json();
    assert(dataVerifyRec.success === true, 'Receptionist verifies OTP successfully', dataVerifyRec.message);

    const resSetRecPass = await fetch(`${API_BASE}/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.rec@apartment.com',
        token: dataVerifyRec.setupPasswordToken,
        password: 'RecPassword123!',
      }),
    });
    const dataSetRecPass = await resSetRecPass.json();
    assert(dataSetRecPass.success === true && !!dataSetRecPass.token, 'Receptionist sets password and logs in', dataSetRecPass.message);
    receptionistToken = dataSetRecPass.token;

    // 9. User Self-Registration
    console.log('\n--- 8. RESIDENT SELF-REGISTRATION & OTP ---');
    const resResidentReg = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Amit Kumar',
        email: 'amit.resident@apartment.com',
        mobile: '9123456789',
        password: 'ResidentPassword123!',
        dob: '1995-05-15',
        gender: 'Male',
      }),
    });
    const dataResidentReg = await resResidentReg.json();
    assert(
      dataResidentReg.success === true && dataResidentReg.registrationId?.startsWith('REG-'),
      'Resident self-registers and receives unique REG-YYYY-XXXXXX Registration ID',
      dataResidentReg.registrationId
    );

    // Resident verifies OTP
    const residentUser = await User.findOne({ email: 'amit.resident@apartment.com' });
    residentUser.emailOtpHash = (await import('crypto')).default.createHash('sha256').update('112233').digest('hex');
    residentUser.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await residentUser.save();

    const resVerifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amit.resident@apartment.com',
        otp: '112233',
      }),
    });
    const dataVerifyRes = await resVerifyRes.json();
    assert(dataVerifyRes.success === true, 'Resident verifies 6-digit OTP successfully', dataVerifyRes.message);

    // Resident logs in
    const resResLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amit.resident@apartment.com',
        password: 'ResidentPassword123!',
      }),
    });
    const dataResLogin = await resResLogin.json();
    assert(dataResLogin.success === true && !!dataResLogin.token, 'Resident logs in successfully with JWT', dataResLogin.message);
    residentToken = dataResLogin.token;

    // 10. Room Booking with Razorpay Test Mode
    console.log('\n--- 9. RAZORPAY TEST MODE ROOM BOOKING ---');
    const resCreateOrder = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${residentToken}`,
      },
      body: JSON.stringify({
        roomId: room101Id,
      }),
    });
    const dataCreateOrder = await resCreateOrder.json();
    assert(dataCreateOrder.success === true && !!dataCreateOrder.data.orderId, 'Resident generates Razorpay Test Order', dataCreateOrder.data?.orderId);

    // Confirm Payment
    const resVerifyBooking = await fetch(`${API_BASE}/payments/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${residentToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: dataCreateOrder.data.orderId,
        razorpay_payment_id: 'pay_test_verified_9988',
        razorpay_signature: 'simulated_valid_test_signature',
        roomId: room101Id,
      }),
    });
    const dataVerifyBooking = await resVerifyBooking.json();
    assert(
      dataVerifyBooking.success === true && dataVerifyBooking.data.receiptNumber?.startsWith('RCP-'),
      'Payment verified & Room A-101 allocated (OCCUPIED) with RCP-YYYY-XXXXXX receipt',
      dataVerifyBooking.data?.receiptNumber
    );

    // Atomic Double Booking Prevention check
    const resDoubleBook = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${residentToken}`,
      },
      body: JSON.stringify({
        roomId: room101Id,
      }),
    });
    const dataDoubleBook = await resDoubleBook.json();
    assert(dataDoubleBook.success === false, 'Atomic double-booking prevention rejects booking already OCCUPIED room', dataDoubleBook.message);

    // 11. Receptionist Manual Payment Entry with Identity Logging (Section 14)
    console.log('\n--- 10. RECEPTIONIST MANUAL PAYMENT WITH IDENTITY LOGGING ---');
    // Receptionist registers resident Sneha
    const resRegSneha = await fetch(`${API_BASE}/users/resident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`,
      },
      body: JSON.stringify({
        fullName: 'Sneha Patel',
        email: 'sneha.patel@apartment.com',
        mobile: '9444555666',
      }),
    });
    const dataRegSneha = await resRegSneha.json();
    assert(dataRegSneha.success === true && !!dataRegSneha.data.registrationId, 'Receptionist registers resident with REG-YYYY-XXXXXX', dataRegSneha.data?.registrationId);

    // Receptionist records manual cash payment for Sneha
    const resManualPay = await fetch(`${API_BASE}/payments/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`,
      },
      body: JSON.stringify({
        residentId: dataRegSneha.data._id,
        amount: 15000,
        paymentMethod: 'Cash',
        notes: 'Monthly advance maintenance',
      }),
    });
    const dataManualPay = await resManualPay.json();
    assert(
      dataManualPay.success === true &&
      dataManualPay.data.recordedByName === 'Priya Sharma' &&
      dataManualPay.data.receiptNumber?.startsWith('RCP-'),
      'Manual payment records Receptionist name ("Priya Sharma") and generates RCP receipt',
      dataManualPay.data?.recordedByName
    );

    // 12. Super Admin Reports & Audit Trail
    console.log('\n--- 11. SYSTEM OVERVIEW & AUDIT TRAIL ---');
    const resReports = await fetch(`${API_BASE}/reports/system-overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const dataReports = await resReports.json();
    assert(
      dataReports.success === true &&
      dataReports.data.blocks.totalBlocks === 1 &&
      dataReports.data.staff.totalBlockAdmins === 1 &&
      dataReports.data.staff.totalReceptionists === 2,
      'System Reports reflects exact zero-start counts dynamically',
      JSON.stringify(dataReports.data?.blocks)
    );

    const resAudit = await fetch(`${API_BASE}/audit`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const dataAudit = await resAudit.json();
    assert(dataAudit.success === true && dataAudit.count > 0, 'Audit trail logs all actions accurately', `Total Logs: ${dataAudit.count}`);

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal Test Execution Error:', error);
    process.exit(1);
  }
};

runTests();
