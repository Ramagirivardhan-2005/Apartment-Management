import crypto from 'crypto';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { ParkingAllocation } from '../models/ParkingAllocation.js';
import { Due } from '../models/Due.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';
import { generate6DigitOtp, hashOtp } from '../utils/otpUtils.js';
import { generateRegistrationId, generateEmployeeId } from '../utils/idGenerator.js';

// @desc Get users with filters (Scoped to block for Block Admin and Receptionist)
// @route GET /api/users
export const getUsers = async (req, res, next) => {
  try {
    const { role, blockId, status, search } = req.query;
    let query = { isDeleted: false };

    if (req.user.role === 'block_admin' || req.user.role === 'receptionist') {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.assignedBlock = req.user.assignedBlock;
    } else if (blockId) {
      query.assignedBlock = blockId;
    }

    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { fullName: s },
        { email: s },
        { mobile: s },
        { registrationId: s },
        { employeeId: s },
      ];
    }

    const users = await User.find(query)
      .populate('assignedBlock', 'name code')
      .select('-password -emailOtpHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Search users by query (Mobile, Email, Registration ID, Name)
// @route GET /api/users/search
export const searchUsers = async (req, res, next) => {
  try {
    const { query, mobile, email, name, registrationId } = req.query;
    const searchTerm = query || mobile || email || name || registrationId;

    if (!searchTerm) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };

    let mongoQuery = {
      isDeleted: false,
      $or: [
        { mobile: searchRegex },
        { email: searchRegex },
        { fullName: searchRegex },
        { registrationId: searchRegex },
      ],
    };

    if (req.user.role === 'block_admin' || req.user.role === 'receptionist') {
      if (req.user.assignedBlock) {
        mongoQuery.assignedBlock = req.user.assignedBlock;
      }
    }

    const users = await User.find(mongoQuery)
      .populate('assignedBlock', 'name code')
      .select('-password -emailOtpHash');

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single user by ID with full room stay, booking, allocation, and due records
// @route GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedBlock', 'name code address')
      .select('-password -emailOtpHash')
      .lean();

    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role check: Block admin or Receptionist can only access users in their assigned block
    if (
      (req.user.role === 'block_admin' || req.user.role === 'receptionist') &&
      user.assignedBlock &&
      req.user.assignedBlock &&
      user.assignedBlock._id?.toString() !== req.user.assignedBlock?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot access resident of another block',
      });
    }

    // Fetch Room Allocations (Active & Past)
    const roomAllocations = await RoomAllocation.find({
      resident: user._id,
    })
      .populate({
        path: 'room',
        populate: { path: 'block', select: 'name code address' },
      })
      .populate('block', 'name code address')
      .populate('booking')
      .sort({ createdAt: -1 })
      .lean();

    // Map room.ac for backward compatibility
    roomAllocations.forEach((alloc) => {
      if (alloc.room) {
        alloc.room.ac = alloc.room.isAirConditioned ?? alloc.room.ac ?? true;
      }
    });

    // Find Active Room Allocation or active Room assignment
    const activeAllocation = roomAllocations.find((a) => a.status === 'active');
    let currentRoom = activeAllocation?.room || null;

    if (!currentRoom) {
      const activeRoomDoc = await Room.findOne({
        currentResident: user._id,
        isDeleted: false,
      })
        .populate('block', 'name code address')
        .lean();
      if (activeRoomDoc) {
        activeRoomDoc.ac = activeRoomDoc.isAirConditioned ?? activeRoomDoc.ac ?? true;
        currentRoom = activeRoomDoc;
      }
    }

    // Fetch Parking Allocations
    const parkingAllocations = await ParkingAllocation.find({
      resident: user._id,
    })
      .populate('slot')
      .populate('block', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch Dues
    const dues = await Due.find({ user: user._id })
      .populate('room', 'roomNumber floor roomType')
      .populate('block', 'name code')
      .sort({ month: -1 })
      .lean();

    // Fetch Bookings
    const bookings = await Booking.find({ user: user._id })
      .populate('block', 'name code address')
      .populate('rooms.room')
      .populate('allocatedParkingSlots')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch Payments
    const payments = await Payment.find({ user: user._id })
      .populate('room', 'roomNumber floor roomType')
      .populate('block', 'name code')
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    user.currentRoom = currentRoom;
    user.roomAllocations = roomAllocations;
    user.parkingAllocations = parkingAllocations;
    user.dues = dues;
    user.bookings = bookings;
    user.payments = payments;

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Register resident by Receptionist (Section 9: Generates Unique REG-YYYY-XXXXXX)
// @route POST /api/users/resident
export const registerResidentByReceptionist = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      mobile,
      dob,
      gender,
      address,
      emergencyContact,
      identityProofs,
    } = req.body;

    if (!fullName || !email || !mobile) {
      return res.status(400).json({ success: false, message: 'Full name, email, and mobile are required' });
    }

    const targetBlockId = req.user.role === 'receptionist' || req.user.role === 'block_admin'
      ? req.user.assignedBlock
      : req.body.assignedBlock;

    if (!targetBlockId) {
      return res.status(400).json({ success: false, message: 'Assigned block is required for resident registration' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile.trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
      isDeleted: false,
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Resident email or mobile is already registered' });
    }

    const registrationId = generateRegistrationId();
    const tempPassword = 'Res@' + Math.floor(1000 + Math.random() * 9000) + '!';

    const resident = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: tempPassword,
      role: 'resident',
      registrationId,
      assignedBlock: targetBlockId,
      dob,
      gender,
      address,
      emergencyContact,
      identityProofs: identityProofs || [],
      status: 'active',
      mustChangePassword: true,
      isEmailVerified: true, // Verified by receptionist in person
      emailVerifiedAt: new Date(),
    });

    const block = await Block.findById(targetBlockId);

    // Send Registration Email with Unique REG ID & Login Credentials
    console.log(`\n====================================================\n🔑 [RESIDENT REGISTERED CREDENTIALS] For ${resident.email}: ${tempPassword}\n====================================================\n`);

    await sendNotification({
      user: resident,
      title: 'Your Apartment Resident Login Credentials',
      message: `Your resident profile has been created with Registration ID: ${registrationId}. Temporary password: ${tempPassword}. Please sign in and change your password on first login.`,
      type: 'account_activated',
      emailSubject: 'Welcome to the Apartment Complex - Login Credentials & Registration ID',
      emailHtml: EmailTemplates.accountCredentialsEmail({
        name: resident.fullName,
        roleTitle: 'Resident',
        email: cleanEmail,
        tempPassword,
        assignedId: registrationId,
        blockName: block?.name,
      }),
    });

    await logAudit({
      user: req.user,
      action: 'RESIDENT_REGISTERED_BY_RECEPTIONIST',
      blockId: targetBlockId,
      entityType: 'User',
      entityId: resident._id,
      newValue: {
        registrationId,
        fullName: resident.fullName,
        email: resident.email,
        registeredBy: req.user.fullName,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Resident ${resident.fullName} registered successfully with Registration ID ${registrationId}`,
      data: {
        _id: resident._id,
        fullName: resident.fullName,
        email: resident.email,
        mobile: resident.mobile,
        registrationId: resident.registrationId,
        role: resident.role,
        assignedBlock: resident.assignedBlock,
        status: resident.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Super Admin Create Block Admin directly (Section 16)
// @route POST /api/users/block-admin
export const createBlockAdmin = async (req, res, next) => {
  try {
    const { fullName, email, mobile, assignedBlock, employeeId } = req.body;

    if (!fullName || !email || !mobile || !assignedBlock) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, mobile, and assigned block are required',
      });
    }

    const block = await Block.findById(assignedBlock);
    if (!block || block.isDeleted) {
      return res.status(404).json({ success: false, message: 'Assigned block not found' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile.trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
      isDeleted: false,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile number is already registered in the system',
      });
    }

    // Generate 6-digit OTP & temporary credentials for first login
    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);
    const tempPassword = 'Admin@' + Math.floor(1000 + Math.random() * 9000) + '!';
    const generatedEmployeeId = employeeId?.trim() || generateEmployeeId('block_admin');

    const createdAdmin = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: tempPassword,
      role: 'block_admin',
      assignedBlock: block._id,
      employeeId: generatedEmployeeId,
      status: 'pending_verification',
      mustChangePassword: false,
      isEmailVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      emailOtpAttempts: 0,
      emailOtpCooldownUntil: new Date(Date.now() + 60 * 1000), // 60s cooldown
    });

    // Associate Admin with Block
    block.admin = createdAdmin._id;
    await block.save();

    // Dispatch Mandatory Verification Email with OTP
    console.log(`\n====================================================\n🔑 [BLOCK ADMIN ONBOARDING OTP] For ${createdAdmin.email}: ${rawOtp}\n🔑 [BLOCK ADMIN PASSWORD]: ${tempPassword}\n====================================================\n`);

    await sendNotification({
      user: createdAdmin,
      title: 'Verify Your Block Administrator Account',
      message: `Your account has been created for ${block.name}. Your verification OTP is: ${rawOtp}. Valid for 10 minutes.`,
      type: 'system',
      emailSubject: 'Verify Your Block Administrator Account - Apartment Management',
      emailHtml: EmailTemplates.adminOtpVerification(createdAdmin.fullName, block.name, rawOtp, createdAdmin.email),
    });

    await logAudit({
      user: req.user,
      action: 'BLOCK_ADMIN_CREATED_BY_SUPER_ADMIN',
      blockId: block._id,
      entityType: 'User',
      entityId: createdAdmin._id,
      newValue: {
        fullName: createdAdmin.fullName,
        email: createdAdmin.email,
        employeeId: createdAdmin.employeeId,
        block: block.name,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Block Admin '${createdAdmin.fullName}' created for ${block.name}. Verification OTP and login credentials sent to ${createdAdmin.email}.`,
      data: {
        _id: createdAdmin._id,
        fullName: createdAdmin.fullName,
        email: createdAdmin.email,
        mobile: createdAdmin.mobile,
        employeeId: createdAdmin.employeeId,
        assignedBlock: { _id: block._id, name: block.name, code: block.code },
        status: createdAdmin.status,
        isEmailVerified: createdAdmin.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all Block Admins (Super Admin only - Section 16)
// @route GET /api/users/block-admins
export const getBlockAdmins = async (req, res, next) => {
  try {
    const { status, verification, search } = req.query;
    let query = { role: 'block_admin', isDeleted: false };

    if (status && status !== 'all') query.status = status;
    if (verification === 'verified') query.isEmailVerified = true;
    else if (verification === 'pending') query.isEmailVerified = false;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ fullName: s }, { email: s }, { mobile: s }, { employeeId: s }];
    }

    const blockAdmins = await User.find(query)
      .populate('assignedBlock', 'name code address totalRooms')
      .select('-password -emailOtpHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: blockAdmins.length,
      data: blockAdmins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Super Admin Resend OTP to Block Admin (Section 16)
// @route POST /api/users/block-admin/:id/resend-otp
export const resendBlockAdminOtp = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id).populate('assignedBlock', 'name code');
    if (!admin || admin.role !== 'block_admin' || admin.isDeleted) {
      return res.status(404).json({ success: false, message: 'Block Admin not found' });
    }

    if (admin.isEmailVerified && admin.status === 'active') {
      return res.status(400).json({ success: false, message: 'Administrator email is already verified' });
    }

    if (admin.emailOtpCooldownUntil && admin.emailOtpCooldownUntil > new Date()) {
      const remainingSeconds = Math.ceil((new Date(admin.emailOtpCooldownUntil) - new Date()) / 1000);
      return res.status(429).json({
        success: false,
        cooldownRemaining: remainingSeconds,
        message: `Please wait ${remainingSeconds}s before requesting a new OTP.`,
      });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    admin.emailOtpHash = otpHash;
    admin.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    admin.emailOtpAttempts = 0;
    admin.emailOtpCooldownUntil = new Date(Date.now() + 60 * 1000);
    await admin.save();

    const blockName = admin.assignedBlock ? admin.assignedBlock.name : 'Assigned Block';

    await sendNotification({
      user: admin,
      title: 'Verify Your Block Administrator Account',
      message: `Your email verification OTP is: ${rawOtp}. Valid for 10 minutes.`,
      type: 'system',
      emailSubject: 'Verify Your Block Administrator Account - Apartment Management',
      emailHtml: EmailTemplates.adminOtpVerification(admin.fullName, blockName, rawOtp),
    });

    await logAudit({
      user: req.user,
      action: 'BLOCK_ADMIN_OTP_RESENT_BY_SUPER_ADMIN',
      entityType: 'User',
      entityId: admin._id,
      newValue: { targetEmail: admin.email },
      req,
    });

    res.json({
      success: true,
      message: `New 6-digit OTP dispatched to ${admin.email}.`,
      cooldownSeconds: 60,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Super Admin Change Block Admin Email (Section 16)
// @route PUT /api/users/block-admin/:id/email
export const updateBlockAdminEmail = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'New email address is required' });
    }

    const cleanNewEmail = newEmail.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanNewEmail, isDeleted: false });
    if (existing && existing._id.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'This email address is already in use' });
    }

    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'block_admin' || admin.isDeleted) {
      return res.status(404).json({ success: false, message: 'Block Admin not found' });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    admin.pendingEmail = cleanNewEmail;
    admin.pendingEmailOtpHash = otpHash;
    admin.pendingEmailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    admin.pendingEmailOtpAttempts = 0;
    await admin.save();

    await sendNotification({
      user: { email: cleanNewEmail, fullName: admin.fullName },
      title: 'Confirm Your New Block Admin Email',
      message: `Your OTP to confirm your new email is: ${rawOtp}. Valid for 10 minutes.`,
      type: 'system',
      emailSubject: 'Confirm Your New Email Address - Apartment Management',
      emailHtml: EmailTemplates.newEmailOtpVerification(admin.fullName, cleanNewEmail, rawOtp),
    });

    await logAudit({
      user: req.user,
      action: 'ADMIN_EMAIL_CHANGE_REQUESTED',
      entityType: 'User',
      entityId: admin._id,
      newValue: { currentEmail: admin.email, requestedNewEmail: cleanNewEmail },
      req,
    });

    res.json({
      success: true,
      message: `Verification OTP dispatched to new email: ${cleanNewEmail}. Current email (${admin.email}) remains active until verified.`,
      pendingEmail: cleanNewEmail,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify or reject uploaded identity document (Section 10)
// @route POST /api/users/:id/verify-document
export const verifyUserDocument = async (req, res, next) => {
  try {
    const { proofId, status, rejectionReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const proof = user.identityProofs.id(proofId);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Document proof not found' });
    }

    proof.verificationStatus = status || 'verified';
    proof.verifiedBy = req.user._id;
    proof.verifiedAt = new Date();
    if (rejectionReason) proof.rejectionReason = rejectionReason;

    // Check if all proofs are verified
    const allVerified =
      user.identityProofs.length > 0 &&
      user.identityProofs.every((p) => p.verificationStatus === 'verified');
    user.isDocumentVerified = allVerified;

    await user.save();

    await logAudit({
      user: req.user,
      action: 'USER_DOCUMENT_VERIFICATION_UPDATED',
      entityType: 'User',
      entityId: user._id,
      newValue: {
        proofId,
        status: proof.verificationStatus,
        isDocumentVerified: user.isDocumentVerified,
      },
      req,
    });

    res.json({
      success: true,
      message: `Document ${proof.verificationStatus === 'verified' ? 'verified' : 'rejected'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
