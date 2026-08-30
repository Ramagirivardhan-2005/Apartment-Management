import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const checkUsers = async () => {
  await mongoose.connect(process.env.DATABASE_URL);
  
  // Ensure default receptionist exists
  let rec = await User.findOne({ email: 'receptionist@apartment.com' });
  if (!rec) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Password123!', salt);
    rec = await User.create({
      fullName: 'Priya Sharma',
      email: 'receptionist@apartment.com',
      mobile: '9876543214',
      password: hash,
      role: 'receptionist',
      employeeId: 'EMP-REC01',
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
    });
    console.log('Created receptionist@apartment.com');
  }

  const allRecs = await User.find({ role: 'receptionist' }).select('fullName email mobile employeeId status');
  console.log('Receptionist Accounts:', JSON.stringify(allRecs, null, 2));

  process.exit(0);
};

checkUsers();
