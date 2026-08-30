import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing POST /api/users/block-admin endpoint...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Get Super Admin Token
    let superAdmin = await User.findOne({ role: 'super_admin', isDeleted: false });
    superAdmin.password = 'Password@123';
    await superAdmin.save();

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: superAdmin.email, password: 'Password@123' }),
    });
    const loginData = await loginRes.json();

    superAdmin.loginOtpHash = hashOtp('123456');
    superAdmin.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await superAdmin.save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;

    // 2. Create Block first
    const testTs = Date.now();
    const block = await Block.create({
      name: `Block Direct ${testTs.toString().slice(-4)}`,
      code: `BD${testTs.toString().slice(-3)}`,
      floors: 3,
      totalRooms: 0,
    });

    // 3. Call POST /api/users/block-admin
    const res = await fetch(`${API_BASE}/users/block-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: 'Direct Block Admin',
        email: `direct.ba.${testTs}@test.com`,
        mobile: `95${testTs.toString().slice(-8)}`,
        assignedBlock: block._id,
      }),
    });

    const data = await res.json();
    console.log('Response Status:', res.status, 'Body:', data);

    if (data.success && data.data?._id) {
      console.log('✅ PASS: POST /api/users/block-admin works successfully!');
      process.exit(0);
    } else {
      console.error('❌ FAIL:', data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

runTest();
