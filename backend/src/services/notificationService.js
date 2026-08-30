import { Notification } from '../models/Notification.js';
import { sendEmail, EmailTemplates as BaseEmailTemplates } from './emailService.js';

export const sendNotification = async ({
  user,
  title,
  message,
  type = 'system',
  link = '',
  metadata = {},
  emailSubject,
  emailHtml,
}) => {
  try {
    // 1. Create In-App Notification
    if (user && user._id) {
      await Notification.create({
        user: user._id,
        title,
        message,
        type,
        link,
        metadata,
      });
    }

    // 2. Send Email if recipient exists
    const recipientEmail = user ? (user.email || (typeof user === 'string' ? user : null)) : null;
    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: emailSubject || title,
        html: emailHtml || `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="background-color: #1e3a8a; padding: 15px; border-radius: 6px; text-align: center; color: white;">
              <h2 style="margin: 0;">Apartment Complex Portal</h2>
            </div>
            <div style="padding: 20px 0;">
              <h3 style="color: #1e293b;">${title}</h3>
              <p style="color: #475569; line-height: 1.6; font-size: 15px;">${message}</p>
              ${link ? `<div style="text-align: center; margin: 25px 0;"><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Portal</a></div>` : ''}
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Apartment Management System. All rights reserved.</p>
            </div>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error(`[Notification Dispatch Error] ${error.message}`);
  }
};

// Specialized Email Templates
export const EmailTemplates = {
  ...BaseEmailTemplates,
  adminOtpVerification: (name, blockName, otp, email = '') => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 12px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase;">Apartment Management System</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px;">Verify Your Block Administrator Account</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p>Your Block Administrator account has been created for <strong>${blockName || 'your assigned Block'}</strong>.</p>
        <p>Please enter the 6-digit verification OTP below (or click the button) to verify your account and proceed directly to advance payment and portal activation. <em>You do not need to create or enter a new password during verification.</em></p>

        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 16px 36px;">
            <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 10px;">⏰ This OTP is valid for 10 minutes.</p>
        </div>

        ${email ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-otp?email=${encodeURIComponent(email)}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
            Verify Account & Proceed to Portal
          </a>
        </div>
        ` : ''}

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px;"><strong>🔒 Security Note:</strong> Administrative staff will never ask for your verification code. Keep your account secure.</p>
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Regards,<br><strong>Apartment Management System</strong></p>
      </div>
    </div>
  `,

  receptionistOtpVerification: (name, blockName, receptionistId, otp, email = '') => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 12px; font-weight: 800; color: #059669; letter-spacing: 1.5px; text-transform: uppercase;">Reception Desk Portal</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px;">Verify Your Receptionist Account</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p>You have been assigned as Receptionist for <strong>${blockName}</strong> (Receptionist ID: <span style="font-family: monospace; font-weight: bold; color: #059669;">${receptionistId}</span>).</p>
        <p>Please enter the 6-digit OTP below (or click the button) to verify your account and proceed to the advance payment flow. <em>You do not need to create or enter a new password during verification.</em></p>

        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 16px 36px;">
            <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #065f46;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 10px;">⏰ Valid for 10 minutes.</p>
        </div>

        ${email ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-otp?email=${encodeURIComponent(email)}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
            Verify Account & Proceed to Advance Payment
          </a>
        </div>
        ` : ''}

        <p style="font-size: 13px; color: #475569;">Once verified, you will be taken to your Reception Desk portal to manage resident check-ins, advance payment receipts, and allocations.</p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Regards,<br><strong>Apartment Management System</strong></p>
      </div>
    </div>
  `,

  userRegistrationEmail: (name, registrationId, otp, email = '') => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 12px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase;">Resident Portal</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px;">Welcome to the Apartment Complex!</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your resident profile has been created with unique Registration ID:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; text-align: center; margin: 16px 0;">
          <span style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">Registration ID</span>
          <span style="font-family: monospace; font-size: 20px; font-weight: 800; color: #1e3a8a;">${registrationId}</span>
        </div>

        ${otp ? `
          <p>Please enter your verification OTP to activate your account and proceed to advance payment / room booking:</p>
          <div style="margin: 20px 0; text-align: center;">
            <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 12px 30px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a;">${otp}</span>
            </div>
            <p style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 8px;">⏰ Valid for 10 minutes.</p>
          </div>

          ${email ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-otp?email=${encodeURIComponent(email)}" style="background-color: #2563eb; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 13px;">
              Verify & Proceed to Advance Payment
            </a>
          </div>
          ` : ''}
        ` : '<p>You can now log in and browse available rooms for booking.</p>'}
      </div>
    </div>
  `,

  roomBookingSuccessEmail: (name, registrationId, roomNumber, blockName, amount, receiptNumber, razorpayPaymentId) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">🎉 Room Booking Confirmed!</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #d1fae5;">Receipt: ${receiptNumber}</p>
      </div>

      <div style="padding: 20px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your payment has been verified and your room is officially confirmed:</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Registration ID:</strong></td><td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #1e3a8a;">${registrationId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Block:</strong></td><td style="padding: 6px 0; font-weight: bold;">${blockName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Room / Flat:</strong></td><td style="padding: 6px 0; font-weight: bold; color: #059669;">${roomNumber}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Amount Paid:</strong></td><td style="padding: 6px 0; font-weight: bold;">₹${amount.toLocaleString()}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Payment Mode:</strong></td><td style="padding: 6px 0;">Razorpay Online (Test Mode)</td></tr>
            ${razorpayPaymentId ? `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Razorpay Payment ID:</strong></td><td style="padding: 6px 0; font-family: monospace;">${razorpayPaymentId}</td></tr>` : ''}
          </table>
        </div>

        <p>You can access your resident dashboard to download your digital receipt and manage your stay.</p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Apartment Management System. All rights reserved.</p>
      </div>
    </div>
  `,

  paymentReceipt: (receiptNo, name, regId, blockName, roomNo, amount, method, txId, recordedBy) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #0f172a; padding: 20px; color: white; border-radius: 12px; text-align: center;">
        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Official Payment Receipt</span>
        <h2 style="margin: 6px 0 0 0; font-size: 20px; font-family: monospace;">${receiptNo}</h2>
      </div>

      <div style="padding: 20px 0; color: #334155; font-size: 13px;">
        <p>Dear <strong>${name}</strong> (ID: <span style="font-family: monospace;">${regId || 'N/A'}</span>),</p>
        <p>We have successfully recorded your payment:</p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Amount Paid:</strong></td><td style="padding: 6px 0; font-size: 16px; font-weight: bold; color: #059669;">₹${amount.toLocaleString()}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Payment Mode:</strong></td><td style="padding: 6px 0; font-weight: bold;">${method}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Property:</strong></td><td style="padding: 6px 0;">${blockName} - Room ${roomNo || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Transaction ID:</strong></td><td style="padding: 6px 0; font-family: monospace;">${txId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Date:</strong></td><td style="padding: 6px 0;">${new Date().toLocaleString()}</td></tr>
            ${recordedBy ? `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Recorded By:</strong></td><td style="padding: 6px 0; font-weight: bold; color: #2563eb;">Receptionist: ${recordedBy}</td></tr>` : ''}
          </table>
        </div>
      </div>
    </div>
  `,

  adminWelcomePasswordSetup: (name, adminId, blockName, setupLink) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 24px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">🎉 Email Verified Successfully!</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;">Welcome to the Management Team, ${name}</p>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Your email address has been verified and your administrator account is now activated.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Administrator ID:</strong> <span style="font-family: monospace; color: #1e3a8a;">${adminId}</span></p>
          <p style="margin: 4px 0;"><strong>Assigned Block:</strong> <strong>${blockName || 'Residential Block'}</strong></p>
          <p style="margin: 4px 0;"><strong>Account Status:</strong> <span style="color: #16a34a; font-weight: 700;">Active</span></p>
        </div>

        <p>Please click the button below to set up your personal password and log in to your dashboard:</p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${setupLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">Set Your Password &amp; Login</a>
        </div>

        <p style="color: #64748b; font-size: 12px;">Link: ${setupLink}</p>
      </div>
    </div>
  `,

  newEmailOtpVerification: (name, newEmail, otp) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 12px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase;">Email Change Request</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px;">Confirm Your New Email Address</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Please enter the OTP below to verify your new email address: <strong>${newEmail}</strong>:</p>

        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 16px 36px;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 10px;">⏰ Valid for 10 minutes.</p>
        </div>
      </div>
    </div>
  `,

  forgotPasswordOtp: (name, otp) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 12px; font-weight: 800; color: #dc2626; letter-spacing: 1.5px; text-transform: uppercase;">Password Reset Request</span>
        <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 22px;">Reset Your Account Password</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Please use the verification OTP below to authorize this password change:</p>

        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 16px 36px;">
            <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #991b1b;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 10px;">⏰ This OTP is valid for 10 minutes.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px;"><strong>🔒 Security Note:</strong> If you did not request a password reset, please ignore this email or contact security immediately. Your account remains secure.</p>
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Apartment Complex Management System</p>
      </div>
    </div>
  `,

  passwordResetSuccess: (name) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">🔒 Password Changed Successfully</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your account password was successfully reset on <strong>${new Date().toLocaleString()}</strong>.</p>
        <p>You can now sign in with your new password.</p>
      </div>
    </div>
  `,

  overdueWarning: (name, roomNumber, overdueDays, amountDue, lateFee, isCritical = false) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid ${isCritical ? '#f87171' : '#fde047'}; border-radius: 16px; background-color: #ffffff;">
      <div style="background: ${isCritical ? '#991b1b' : '#c2410c'}; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">⚠️ ${isCritical ? 'CRITICAL PAYMENT OVERDUE NOTICE' : 'Apartment Payment Reminder'}</h2>
      </div>

      <div style="padding: 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>This is an automated notification regarding your dues for <strong>Room ${roomNumber}</strong>, which are currently overdue by <strong>${overdueDays} days</strong>.</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Rent Amount:</span>
            <strong>₹${Number(amountDue || 0).toLocaleString()}</strong>
          </div>
          ${lateFee > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #dc2626;">
            <span>Late Fee:</span>
            <strong>+ ₹${Number(lateFee).toLocaleString()}</strong>
          </div>` : ''}
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; color: #0f172a;">
            <span>Total Outstanding:</span>
            <span style="color: #dc2626;">₹${Number((amountDue || 0) + (lateFee || 0)).toLocaleString()}</span>
          </div>
        </div>

        <p style="text-align: center; margin-top: 24px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/resident/payments" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Pay Online via Razorpay
          </a>
        </p>
      </div>
    </div>
  `,
};
