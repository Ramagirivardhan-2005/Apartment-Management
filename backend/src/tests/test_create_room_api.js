import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing POST /api/rooms API with Block Admin...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Get or Create Block
    let block = await Block.findOne({ isDeleted: false });
    if (!block) {
      block = await Block.create({ name: 'Alpha Block', code: 'AB', floors: 5, totalRooms: 0 });
    }

    // 2. Get or Create Block Admin
    let admin = await User.findOne({ role: 'block_admin', assignedBlock: block._id, isDeleted: false });
    if (!admin) {
      admin = await User.create({
        fullName: 'Test Block Admin',
        email: `blockadmin.${Date.now()}@test.com`,
        mobile: `98${Date.now().toString().slice(-8)}`,
        password: 'Password@123',
        role: 'block_admin',
        assignedBlock: block._id,
        status: 'active',
        isEmailVerified: true,
      });
    } else {
      admin.password = 'Password@123';
      admin.status = 'active';
      admin.isEmailVerified = true;
      await admin.save();
    }

    // 3. Login Block Admin
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'Password@123' }),
    });
    const loginData = await loginRes.json();

    admin.loginOtpHash = hashOtp('123456');
    admin.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await admin.save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;

    // 4. Create Room via API
    const testRoomNum = `R-${Date.now().toString().slice(-4)}`;
    const createRes = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomNumber: testRoomNum,
        floor: 2,
        roomType: 'Four sharing',
        ac: true,
        maxOccupants: 4,
        monthlyRent: 8000,
        securityDeposit: 16000,
      }),
    });

    const createData = await createRes.json();
    console.log('Create Room Response:', createRes.status, createData);

    if (createRes.status === 201 && createData.success && createData.data?._id) {
      console.log('✅ PASS: Room created successfully via API!');
      process.exit(0);
    } else {
      console.error('❌ FAIL:', createData.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

runTest();
