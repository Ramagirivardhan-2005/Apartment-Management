import crypto from 'crypto';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';
import { generate6DigitOtp, hashOtp } from '../utils/otpUtils.js';
import { generateEmployeeId } from '../utils/idGenerator.js';

// @desc Get all receptionists (Super Admin sees all, Block Admin sees only for assigned block)
// @route GET /api/receptionists
export const getReceptionists = async (req, res, next) => {
  try {
    let query = { role: 'receptionist', isDeleted: false };

    if (req.user.role === 'block_admin') {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.assignedBlock = req.user.assignedBlock;
    } else if (req.query.blockId) {
      query.assignedBlock = req.query.blockId;
    }

    const receptionists = await User.find(query)
      .populate('assignedBlock', 'name code')
      .select('-password -emailOtpHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: receptionists.length,
      data: receptionists,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create Receptionist for assigned block (Section 6 & 7: 1-2 Receptionists max)
// @route POST /api/receptionists
export const createReceptionist = async (req, res, next) => {
  try {
    const { fullName, email, mobile, employeeId, blockId } = req.body;

    // Determine target block
    const targetBlockId = req.user.role === 'block_admin' ? req.user.assignedBlock : (blockId || req.body.assignedBlock);

    if (!targetBlockId) {
      return res.status(400).json({ success: false, message: 'Assigned block is required' });
    }

    if (!fullName || !email || !mobile) {
      return res.status(400).json({ success: false, message: 'Full name, email, and mobile are required' });
    }

    const block = await Block.findById(targetBlockId);
    if (!block || block.isDeleted) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    // Enforce maximum 2 receptionists per block (Section 6)
    const activeReceptionistsCount = await User.countDocuments({
      role: 'receptionist',
      assignedBlock: targetBlockId,
      isDeleted: false,
      status: { $in: ['active', 'pending_verification'] },
    });

    if (activeReceptionistsCount >= 2) {
      return res.status(400).json({
        success: false,
        message: `Block '${block.name}' already has the maximum permitted number of active receptionists (2). Please deactivate an existing receptionist before adding a new one.`,
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobile.trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
      isDeleted: false,
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or mobile is already registered in the system.' });
    }

    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);
    const tempPassword = 'Rec@' + Math.floor(1000 + Math.random() * 9000) + '!';
    const generatedEmployeeId = employeeId?.trim() || generateEmployeeId('receptionist');

    const receptionist = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: tempPassword,
      role: 'receptionist',
      assignedBlock: targetBlockId,
      employeeId: generatedEmployeeId,
      status: 'pending_verification',
      mustChangePassword: false,
      isEmailVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      emailOtpAttempts: 0,
      emailOtpCooldownUntil: new Date(Date.now() + 60 * 1000), // 60s
    });

    // Update block receptionists array
    await Block.findByIdAndUpdate(targetBlockId, {
      $addToSet: { receptionists: receptionist._id },
    });

    // Dispatch Professional OTP Email
    console.log(`\n====================================================\n🔑 [RECEPTIONIST ONBOARDING OTP] For ${receptionist.email}: ${rawOtp}\n🔑 [RECEPTIONIST PASSWORD]: ${tempPassword}\n====================================================\n`);

    await sendNotification({
      user: receptionist,
      title: 'Verify Your Receptionist Account',
      message: `Your Receptionist account for ${block.name} has been created. Your verification OTP is: ${rawOtp}. Valid for 10 minutes.`,
      type: 'system',
      emailSubject: 'Verify Your Receptionist Account - Apartment Management',
      emailHtml: EmailTemplates.receptionistOtpVerification(
        receptionist.fullName,
        block.name,
        receptionist.employeeId,
        rawOtp,
        receptionist.email
      ),
    });

    await logAudit({
      user: req.user,
      action: 'RECEPTIONIST_CREATED',
      blockId: targetBlockId,
      entityType: 'User',
      entityId: receptionist._id,
      newValue: {
        fullName: receptionist.fullName,
        email: receptionist.email,
        employeeId: receptionist.employeeId,
        block: block.name,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Receptionist '${receptionist.fullName}' created in Pending Verification state. 6-digit OTP dispatched to ${receptionist.email}.`,
      data: {
        _id: receptionist._id,
        fullName: receptionist.fullName,
        email: receptionist.email,
        mobile: receptionist.mobile,
        employeeId: receptionist.employeeId,
        assignedBlock: receptionist.assignedBlock,
        status: receptionist.status,
        isEmailVerified: receptionist.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Deactivate / Remove Receptionist
// @route DELETE /api/receptionists/:id
export const deleteReceptionist = async (req, res, next) => {
  try {
    const receptionist = await User.findById(req.params.id);
    if (!receptionist || receptionist.role !== 'receptionist' || receptionist.isDeleted) {
      return res.status(404).json({ success: false, message: 'Receptionist not found' });
    }

    if (req.user.role === 'block_admin' && receptionist.assignedBlock?.toString() !== req.user.assignedBlock?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot manage receptionists from another block' });
    }

    receptionist.isDeleted = true;
    receptionist.status = 'inactive';
    await receptionist.save();

    await Block.findByIdAndUpdate(receptionist.assignedBlock, {
      $pull: { receptionists: receptionist._id },
    });

    await logAudit({
      user: req.user,
      action: 'RECEPTIONIST_DEACTIVATED',
      blockId: receptionist.assignedBlock,
      entityType: 'User',
      entityId: receptionist._id,
      req,
    });

    res.json({
      success: true,
      message: 'Receptionist removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
