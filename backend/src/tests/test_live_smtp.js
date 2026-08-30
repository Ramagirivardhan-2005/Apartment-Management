import dotenv from 'dotenv';
dotenv.config();

import { sendEmail, EmailTemplates } from '../services/emailService.js';

const testSmtp = async () => {
  console.log('Testing live Gmail SMTP dispatch...');
  const result = await sendEmail({
    to: 'vardhan8400@gmail.com',
    subject: 'Verification Test: Gmail SMTP Connected - Apartment Management System',
    html: EmailTemplates.baseOtpTemplate({
      name: 'Ramagiri Vardhan',
      otp: '782910',
      purpose: 'Live Email Verification Test',
      expiryMinutes: 10,
    }),
  });

  console.log('Send result:', result);
  process.exit(result.success && !result.mocked ? 0 : 1);
};

testSmtp();
