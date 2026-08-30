import 'dotenv/config';
import nodemailer from 'nodemailer';

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || 'vardhanramagiri84@gmail.com';
  const smtpPass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'ygxueosmpjsxryxi').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Universal email dispatcher (Guaranteed Non-Blocking)
 * @param {Object} options - { to, subject, html, text }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const fromName = process.env.SMTP_FROM_NAME || 'Vijaya Laxmi Complex';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'vardhanramagiri84@gmail.com';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || subject,
    };

    const transporter = getTransporter();
    
    // Dispatch in background without holding HTTP response
    transporter.sendMail(mailOptions)
      .then((info) => {
        console.log(`\n====================================================\n✅ [SMTP Email Delivered Successfully]\nTo: ${to}\nSubject: ${subject}\nMessageId: ${info.messageId}\n====================================================\n`);
      })
      .catch((err) => {
        console.warn(`\n⚠️ [SMTP Email Delivery Warning] To: ${to} | Error: ${err.message}\n`);
      });

    return { success: true };
  } catch (error) {
    console.error(`\n❌ [SMTP Setup Warning] To: ${to} | Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
};

/**
 * Professional HTML Email Templates (Section 17 & 22)
 */
export const EmailTemplates = {
  // Generic OTP Template formatted according to Section 17
  baseOtpTemplate: ({ name, otp, purpose, expiryMinutes = 10 }) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 11px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase;">Apartment Management System</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px; font-weight: 800;">Your Verification OTP</h2>
      </div>

      <div style="padding: 24px 0; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${name || 'User'}</strong>,</p>
        <p>Your verification OTP is:</p>

        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 14px; padding: 16px 40px;">
            <span style="font-family: monospace, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 10px;">⏰ This OTP is valid for ${expiryMinutes} minutes.</p>
        </div>

        <div style="background-color: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #475569;">
            <strong>Purpose:</strong> <span style="color: #0f172a; font-weight: 600;">${purpose}</span>
          </p>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b; font-size: 12px;">
            <strong>🔒 Security Warning:</strong> If you did not request this verification, please ignore this email and contact the system administrator immediately. Do not share this OTP with anyone.
          </p>
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Regards,<br><strong>Apartment Management System</strong></p>
      </div>
    </div>
  `,

  // 1. Login 2FA OTP (Section 2, 3, 4, 5, 17)
  loginOtp: (name, otp, expiryMinutes = 10) => EmailTemplates.baseOtpTemplate({
    name,
    otp,
    purpose: 'Secure Login Verification',
    expiryMinutes,
  }),

  // 2. Account Email Verification / Activation OTP (Section 6, 17, 21)
  accountActivationOtp: (name, roleTitle, blockName, otp, expiryMinutes = 10) => EmailTemplates.baseOtpTemplate({
    name,
    otp,
    purpose: `Account Email Verification (${roleTitle}${blockName ? ` - ${blockName}` : ''})`,
    expiryMinutes,
  }),

  // 3. Password Reset OTP (Section 7, 17, 20)
  forgotPasswordOtp: (name, otp, expiryMinutes = 10) => EmailTemplates.baseOtpTemplate({
    name,
    otp,
    purpose: 'Password Reset Verification',
    expiryMinutes,
  }),

  // 4. Email Change OTP (Section 8, 17)
  emailChangeOtp: (name, newEmail, otp, expiryMinutes = 10) => EmailTemplates.baseOtpTemplate({
    name,
    otp,
    purpose: `Email Change Verification (New Email: ${newEmail})`,
    expiryMinutes,
  }),

  // 5. Successful Login Security Alert (Section 22)
  loginSecurityAlert: (name, ipAddress, userAgent, timestamp = new Date()) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px;">🔔 Security Alert: Successful Login</h2>
      </div>

      <div style="padding: 20px 0; font-size: 13px; line-height: 1.6; color: #334155;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account was successfully signed into via 2-Factor Authentication with the following details:</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Time:</strong></td><td style="padding: 4px 0; font-weight: 600;">${new Date(timestamp).toLocaleString()}</td></tr>
            ${ipAddress ? `<tr><td style="padding: 4px 0; color: #64748b;"><strong>IP Address:</strong></td><td style="padding: 4px 0; font-family: monospace;">${ipAddress}</td></tr>` : ''}
            ${userAgent ? `<tr><td style="padding: 4px 0; color: #64748b;"><strong>Client:</strong></td><td style="padding: 4px 0; font-size: 11px;">${userAgent}</td></tr>` : ''}
          </table>
        </div>

        <p style="color: #64748b; font-size: 12px;">If you performed this login, no further action is required.</p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-top: 14px;">
          <p style="margin: 0; color: #991b1b; font-size: 11px;"><strong>If you did not perform this login</strong>, please change your password immediately and notify management.</p>
        </div>
      </div>
    </div>
  `,

  // 6. Password Changed Notification (Section 22)
  passwordChangedAlert: (name, timestamp = new Date()) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px;">🔒 Password Changed Successfully</h2>
      </div>

      <div style="padding: 20px 0; font-size: 13px; line-height: 1.6; color: #334155;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your account password was updated on <strong>${new Date(timestamp).toLocaleString()}</strong>.</p>
        <p>All previous sessions have been invalidated for your security.</p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-top: 16px;">
          <p style="margin: 0; color: #991b1b; font-size: 11px;">If you did not perform this change, contact the system administrator immediately.</p>
        </div>
      </div>
    </div>
  `,

  // 7. Account Credentials & First-Time Login Email
  accountCredentialsEmail: ({ name, roleTitle, email, tempPassword, assignedId, blockName, loginUrl }) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 24px; border-radius: 14px; text-align: center; color: #ffffff;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd; font-weight: 800;">Apartment Complex Portal</span>
        <h2 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 800;">Welcome to the Management System</h2>
      </div>

      <div style="padding: 24px 0; font-size: 13px; line-height: 1.6; color: #334155;">
        <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p>Your <strong>${roleTitle}</strong> account has been created${blockName ? ` for <strong>${blockName}</strong>` : ''}. Below are your official sign-in credentials:</p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px; margin: 18px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Assigned ID:</strong></td>
              <td style="padding: 6px 0; font-family: monospace, Courier, monospace; font-weight: 700; color: #1e3a8a;">${assignedId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Registered Email:</strong></td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Temporary Password:</strong></td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 4px 10px; font-family: monospace, Courier, monospace; font-weight: 800; font-size: 14px; color: #92400e; letter-spacing: 1px;">
                  ${tempPassword}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Assigned Role:</strong></td>
              <td style="padding: 6px 0; font-weight: 600; text-transform: uppercase; color: #2563eb; font-size: 11px;">${roleTitle}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; margin: 18px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 12px;">
            <strong>🔒 First-Time Security Requirement:</strong> For your protection, you will be prompted to choose a new personal password immediately upon your first sign-in.
          </p>
        </div>

        <div style="text-align: center; margin: 26px 0;">
          <a href="${loginUrl || (process.env.CLIENT_URL || 'http://localhost:5173') + '/login'}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
            Sign In to Portal &rarr;
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Apartment Management System. All rights reserved.</p>
      </div>
    </div>
  `,

  // 8. Booking Confirmation Template
  bookingConfirmation: ({ name, bookingId, roomNumbers, advancePaid, moveInDate, receiptNumber }) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 24px; border-radius: 14px; text-align: center; color: #ffffff;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a7f3d0; font-weight: 800;">Apartment Complex Portal</span>
        <h2 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 800;">Booking Confirmed!</h2>
      </div>

      <div style="padding: 24px 0; font-size: 13px; line-height: 1.6; color: #334155;">
        <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p>Your room booking has been successfully confirmed. Below are your booking and payment details:</p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px; margin: 18px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Booking ID:</strong></td>
              <td style="padding: 6px 0; font-weight: 700; color: #047857;">${bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Room(s):</strong></td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${roomNumbers}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Advance Paid:</strong></td>
              <td style="padding: 6px 0; font-weight: 700; color: #059669;">₹${advancePaid?.toLocaleString?.() || advancePaid}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Move-in Date:</strong></td>
              <td style="padding: 6px 0; font-weight: 600;">${new Date(moveInDate).toLocaleDateString()}</td>
            </tr>
            ${receiptNumber ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Receipt Number:</strong></td>
              <td style="padding: 6px 0; font-mono font-bold;">${receiptNumber}</td>
            </tr>` : ''}
          </table>
        </div>
      </div>
    </div>
  `,
};
