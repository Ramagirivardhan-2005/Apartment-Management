import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing POST /api/users endpoint...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Get Receptionist Token
    let rec = await User.findOne({ role: 'receptionist', isDeleted: false });
    if (!rec) {
      let block = await Block.findOne({ isDeleted: false });
      rec = await User.create({
        fullName: 'Test Rec',
        email: `rec.${Date.now()}@test.com`,
        mobile: `93${Date.now().toString().slice(-8)}`,
        password: 'Password@123',
        role: 'receptionist',
        assignedBlock: block._id,
        status: 'active',
        isEmailVerified: true,
      });
    } else {
      rec.password = 'Password@123';
      rec.status = 'active';
      rec.isEmailVerified = true;
      await rec.save();
    }

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: rec.email, password: 'Password@123' }),
    });
    const loginData = await loginRes.json();

    rec.loginOtpHash = hashOtp('123456');
    rec.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await rec.save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;

    // 2. Test POST /api/users (used by UserSearchAndRegister.jsx)
    const testTs = Date.now();
    const postRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: 'New Registered Resident',
        email: `resident.post.${testTs}@test.com`,
        mobile: `92${testTs.toString().slice(-8)}`,
      }),
    });
    const postData = await postRes.json();
    console.log('POST /api/users status:', postRes.status, 'Body:', postData);

    if (postRes.status === 201 && postData.success && postData.data?._id) {
      console.log('✅ PASS: POST /api/users works cleanly!');
      process.exit(0);
    } else {
      console.error('❌ FAIL: POST /api/users returned', postRes.status, postData);
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

runTest();
