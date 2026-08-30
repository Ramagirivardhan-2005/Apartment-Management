import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing /api/users routes...');

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

    // 2. Test GET /api/users
    const getRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData = await getRes.json();
    console.log('GET /api/users status:', getRes.status, 'Count:', getData.count);

    if (getRes.status === 200 && getData.success) {
      console.log('✅ PASS: GET /api/users works cleanly!');
      process.exit(0);
    } else {
      console.error('❌ FAIL: GET /api/users returned', getRes.status, getData);
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

runTest();
