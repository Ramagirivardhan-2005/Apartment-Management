import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { Due } from '../models/Due.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing ALL /api/payments Routes...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Create a resident user
    const ts = Date.now().toString().slice(-4);
    const block = await Block.findOne({ isDeleted: false });

    let resident = await User.create({
      fullName: `Payer Resident ${ts}`,
      email: `payer.${ts}@test.com`,
      mobile: `96${ts}${Math.floor(1000 + Math.random() * 9000)}`,
      password: 'Password@123',
      role: 'resident',
      assignedBlock: block._id,
      status: 'active',
      isEmailVerified: true,
    });

    const room = await Room.create({
      roomNumber: `PAY-${ts}`,
      block: block._id,
      floor: 1,
      roomType: 'Deluxe',
      monthlyRent: 12000,
      status: 'OCCUPIED',
      currentResident: resident._id,
    });

    const due = await Due.create({
      user: resident._id,
      room: room._id,
      block: block._id,
      month: '2026-08',
      rentAmount: 12000,
      amountDue: 12000,
      amountPaid: 0,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalOutstanding: 12000,
      status: 'unpaid',
    });

    // Resident Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resident.email, password: 'Password@123' }),
    });
    const loginData = await loginRes.json();

    resident = await User.findById(resident._id);
    resident.loginOtpHash = hashOtp('123456');
    resident.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await resident.save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;

    // Test GET /api/payments
    const getRes = await fetch(`${API_BASE}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData = await getRes.json();
    console.log('GET /api/payments Status:', getRes.status, 'Count:', getData.count);
    if (getRes.status !== 200) throw new Error('GET /api/payments failed');

    // Test POST /api/payments (Resident paying due)
    const postRes = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        dueId: due._id,
        amount: 12000,
        paymentMethod: 'UPI',
        transactionId: `TXN-ONLINE-${ts}`,
      }),
    });
    const postData = await postRes.json();
    console.log('POST /api/payments Status:', postRes.status, postData.message);
    if (postRes.status !== 201) throw new Error(`POST /api/payments failed: ${postData.message}`);

    const paymentId = postData.data._id;

    // Test GET /api/payments/:id
    const getSingleRes = await fetch(`${API_BASE}/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getSingleData = await getSingleRes.json();
    console.log('GET /api/payments/:id Status:', getSingleRes.status, 'Receipt:', getSingleData.data?.receiptNumber);
    if (getSingleRes.status !== 200) throw new Error('GET /api/payments/:id failed');

    // Test GET /api/payments/revenue (Super Admin)
    let admin = await User.findOne({ role: 'super_admin', isDeleted: false });
    admin.password = 'Password@123';
    admin.status = 'active';
    admin.isEmailVerified = true;
    await admin.save();

    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'Password@123' }),
    });
    const adminLoginData = await adminLoginRes.json();

    admin = await User.findById(admin._id);
    admin.loginOtpHash = hashOtp('123456');
    admin.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await admin.save();

    const adminVerifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: adminLoginData.verificationToken, otp: '123456' }),
    });
    const adminVerifyData = await adminVerifyRes.json();
    const adminToken = adminVerifyData.token;

    const revRes = await fetch(`${API_BASE}/payments/revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('GET /api/payments/revenue Status:', revRes.status);
    if (revRes.status !== 200) throw new Error('GET /api/payments/revenue failed');

    // Test GET /api/payments/overdue-dashboard (Super Admin)
    const overdueRes = await fetch(`${API_BASE}/payments/overdue-dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('GET /api/payments/overdue-dashboard Status:', overdueRes.status);
    if (overdueRes.status !== 200) throw new Error('GET /api/payments/overdue-dashboard failed');

    console.log('\n🎉 ALL /api/payments ROUTES TESTED & PASSED (100%)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTest();
