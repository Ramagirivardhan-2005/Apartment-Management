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
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const getTokenForRole = async (role) => {
  let user = await User.findOne({ role, isDeleted: false });
  if (!user) {
    const block = await Block.findOne({ isDeleted: false });
    const ts = Date.now().toString().slice(-4);
    user = await User.create({
      fullName: `Test ${role} ${ts}`,
      email: `${role}.${ts}@test.com`,
      mobile: `97${ts}${Math.floor(1000 + Math.random() * 9000)}`,
      password: 'Password@123',
      role,
      assignedBlock: block?._id,
      status: 'active',
      isEmailVerified: true,
    });
  }

  user.password = 'Password@123';
  user.status = 'active';
  user.isEmailVerified = true;
  await user.save();

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'Password@123' }),
  });
  const loginData = await loginRes.json();

  user = await User.findById(user._id);
  user.loginOtpHash = hashOtp('123456');
  user.loginOtpExpiresAt = new Date(Date.now() + 600000);
  await user.save();

  const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
  });
  const verifyData = await verifyRes.json();
  return { token: verifyData.token, user };
};

const runTest = async () => {
  console.log('Testing All 5 Role Dashboards Endpoints...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Super Admin Dashboard Test
    console.log('\n1. Testing Super Admin Dashboard...');
    const superAdmin = await getTokenForRole('super_admin');
    const saOverview = await fetch(`${API_BASE}/reports/system-overview`, {
      headers: { Authorization: `Bearer ${superAdmin.token}` },
    });
    const saRevenue = await fetch(`${API_BASE}/payments/revenue`, {
      headers: { Authorization: `Bearer ${superAdmin.token}` },
    });
    console.log('Super Admin system-overview:', saOverview.status);
    console.log('Super Admin revenue:', saRevenue.status);
    if (saOverview.status !== 200 || saRevenue.status !== 200) {
      throw new Error('Super Admin dashboard endpoints failed');
    }
    console.log('✅ Super Admin Dashboard OK');

    // 2. Block Admin Dashboard Test
    console.log('\n2. Testing Block Admin Dashboard...');
    const blockAdmin = await getTokenForRole('block_admin');
    const block = await Block.findOne({ isDeleted: false });
    const baBlock = await fetch(`${API_BASE}/blocks/${block._id}`, {
      headers: { Authorization: `Bearer ${blockAdmin.token}` },
    });
    const baRevenue = await fetch(`${API_BASE}/payments/revenue?blockId=${block._id}`, {
      headers: { Authorization: `Bearer ${blockAdmin.token}` },
    });
    console.log('Block Admin block details:', baBlock.status);
    console.log('Block Admin revenue:', baRevenue.status);
    if (baBlock.status !== 200 || baRevenue.status !== 200) {
      throw new Error('Block Admin dashboard endpoints failed');
    }
    console.log('✅ Block Admin Dashboard OK');

    // 3. Receptionist Dashboard Test
    console.log('\n3. Testing Receptionist Dashboard...');
    const rec = await getTokenForRole('receptionist');
    const recOverview = await fetch(`${API_BASE}/reports/system-overview`, {
      headers: { Authorization: `Bearer ${rec.token}` },
    });
    console.log('Receptionist system-overview:', recOverview.status);
    if (recOverview.status !== 200) {
      throw new Error('Receptionist dashboard endpoint failed');
    }
    console.log('✅ Receptionist Dashboard OK');

    // 4. Security Dashboard Test
    console.log('\n4. Testing Security Dashboard...');
    const sec = await getTokenForRole('security');
    const secStats = await fetch(`${API_BASE}/security/stats`, {
      headers: { Authorization: `Bearer ${sec.token}` },
    });
    const secVisitors = await fetch(`${API_BASE}/visitors?status=inside`, {
      headers: { Authorization: `Bearer ${sec.token}` },
    });
    console.log('Security stats:', secStats.status);
    console.log('Security visitors:', secVisitors.status);
    if (secStats.status !== 200 || secVisitors.status !== 200) {
      throw new Error('Security dashboard endpoints failed');
    }
    console.log('✅ Security Dashboard OK');

    // 5. Resident Dashboard Test
    console.log('\n5. Testing Resident Dashboard...');
    const resi = await getTokenForRole('resident');
    const resProfile = await fetch(`${API_BASE}/users/${resi.user._id}`, {
      headers: { Authorization: `Bearer ${resi.token}` },
    });
    const resAnnounce = await fetch(`${API_BASE}/announcements`, {
      headers: { Authorization: `Bearer ${resi.token}` },
    });
    console.log('Resident profile:', resProfile.status);
    console.log('Resident announcements:', resAnnounce.status);
    if (resProfile.status !== 200 || resAnnounce.status !== 200) {
      throw new Error('Resident dashboard endpoints failed');
    }
    console.log('✅ Resident Dashboard OK');

    console.log('\n🎉 ALL DASHBOARD ENDPOINTS ARE FUNCTIONING PERFECTLY (200 OK)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTest();
