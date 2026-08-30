import crypto from 'crypto';
import { Block } from '../models/Block.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { Payment } from '../models/Payment.js';
import { Complaint } from '../models/Complaint.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';
import { generate6DigitOtp, hashOtp } from '../utils/otpUtils.js';
import { generateEmployeeId } from '../utils/idGenerator.js';

// @desc Get all blocks (Super Admin sees all, Block Admin / Receptionist sees only assigned block)
// @route GET /api/blocks
export const getBlocks = async (req, res, next) => {
  try {
    let query = { isDeleted: false };

    // Scoped restriction (Section 3 & 8)
    if (req.user.role === 'block_admin' || req.user.role === 'receptionist') {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query._id = req.user.assignedBlock;
    }

    const blocks = await Block.find(query)
      .populate('admin', 'fullName email mobile employeeId status isEmailVerified')
      .populate('receptionists', 'fullName email mobile employeeId status isEmailVerified')
      .sort({ name: 1 });

    // Dynamic stats
    const blockData = await Promise.all(
      blocks.map(async (b) => {
        const roomCount = await Room.countDocuments({ block: b._id, isDeleted: false });
        const availableRooms = await Room.countDocuments({ block: b._id, status: 'AVAILABLE', isDeleted: false });
        const occupiedRooms = await Room.countDocuments({ block: b._id, status: { $in: ['OCCUPIED', 'ALLOCATED'] }, isDeleted: false });
        const parkingCount = await ParkingSlot.countDocuments({ block: b._id, isDeleted: false });
        const availableParking = await ParkingSlot.countDocuments({ block: b._id, status: 'AVAILABLE', isDeleted: false });

        return {
          ...b.toObject(),
          totalRooms: roomCount || b.totalRooms,
          availableRooms,
          occupiedRooms,
          totalParkingSlots: parkingCount,
          availableParkingSlots: availableParking,
        };
      })
    );

    res.json({
      success: true,
      count: blockData.length,
      data: blockData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single block with detailed statistics
// @route GET /api/blocks/:id
export const getBlockById = async (req, res, next) => {
  try {
    const block = await Block.findOne({ _id: req.params.id, isDeleted: false })
      .populate('admin', 'fullName email mobile employeeId status isEmailVerified')
      .populate('receptionists', 'fullName email mobile employeeId status isEmailVerified');

    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    // Role check: Block admin or Receptionist can only view assigned block (Section 3 & 8)
    if ((req.user.role === 'block_admin' || req.user.role === 'receptionist') &&
        req.user.assignedBlock?.toString() !== block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this block' });
    }

    const totalRooms = await Room.countDocuments({ block: block._id, isDeleted: false });
    const availableRooms = await Room.countDocuments({ block: block._id, status: 'AVAILABLE', isDeleted: false });
    const occupiedRooms = await Room.countDocuments({ block: block._id, status: { $in: ['OCCUPIED', 'ALLOCATED'] }, isDeleted: false });
    const maintenanceRooms = await Room.countDocuments({ block: block._id, status: 'MAINTENANCE', isDeleted: false });

    const totalParking = await ParkingSlot.countDocuments({ block: block._id, isDeleted: false });
    const availableParking = await ParkingSlot.countDocuments({ block: block._id, status: 'AVAILABLE', isDeleted: false });
    const occupiedParking = await ParkingSlot.countDocuments({ block: block._id, status: 'OCCUPIED', isDeleted: false });

    res.json({
      success: true,
      data: {
        ...block.toObject(),
        stats: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          maintenanceRooms,
          totalParking,
          availableParking,
          occupiedParking,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new Block & Assign Block Admin with Mandatory 6-Digit Email OTP (Section 2)
// @route POST /api/blocks
export const createBlock = async (req, res, next) => {
  try {
    const {
      name,
      code,
      address,
      floors,
      totalRooms,
      adminName,
      adminEmail,
      adminMobile,
      adminEmployeeId,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Block name and unique block code are required' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existingCode = await Block.findOne({ code: cleanCode, isDeleted: false });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Block code '${cleanCode}' already exists.` });
    }

    // 1. Create Block Record
    const block = await Block.create({
      name: name.trim(),
      code: cleanCode,
      address: address?.trim(),
      floors: floors || 4,
      totalRooms: totalRooms || 0,
      admin: null,
      receptionists: [],
    });

    let createdAdmin = null;

    // 2. If Block Admin details are provided (Section 2: While creating block, Super Admin enters admin details)
    if (adminEmail && adminName && adminMobile) {
      const cleanAdminEmail = adminEmail.toLowerCase().trim();
      const cleanAdminMobile = adminMobile.trim();

      const existingUser = await User.findOne({
        $or: [{ email: cleanAdminEmail }, { mobile: cleanAdminMobile }],
        isDeleted: false,
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Admin email or mobile is already registered in the system.',
        });
      }

      // Generate 6-digit OTP & temporary credentials for first login
      const rawOtp = generate6DigitOtp();
      const otpHash = hashOtp(rawOtp);
      const tempPassword = 'Admin@' + Math.floor(1000 + Math.random() * 9000) + '!';

      createdAdmin = await User.create({
        fullName: adminName.trim(),
        email: cleanAdminEmail,
        mobile: cleanAdminMobile,
        password: tempPassword,
        role: 'block_admin',
        assignedBlock: block._id,
        employeeId: adminEmployeeId?.trim() || generateEmployeeId('block_admin'),
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
    }

    await logAudit({
      user: req.user,
      action: 'BLOCK_CREATED',
      blockId: block._id,
      entityType: 'Block',
      entityId: block._id,
      newValue: { name: block.name, code: block.code, admin: createdAdmin?.email },
      req,
    });

    res.status(201).json({
      success: true,
      message: createdAdmin
        ? `Block '${block.name}' created and Block Admin '${createdAdmin.fullName}' onboarded with 6-digit OTP verification.`
        : `Block '${block.name}' created successfully.`,
      data: {
        ...block.toObject(),
        admin: createdAdmin
          ? {
              _id: createdAdmin._id,
              fullName: createdAdmin.fullName,
              email: createdAdmin.email,
              mobile: createdAdmin.mobile,
              employeeId: createdAdmin.employeeId,
              status: createdAdmin.status,
              isEmailVerified: createdAdmin.isEmailVerified,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update block
// @route PUT /api/blocks/:id
export const updateBlock = async (req, res, next) => {
  try {
    const { name, address, floors, totalRooms, status, admin } = req.body;
    const block = await Block.findById(req.params.id);

    if (!block || block.isDeleted) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    const previousValue = block.toObject();

    if (name) block.name = name.trim();
    if (address) block.address = address.trim();
    if (floors) block.floors = floors;
    if (totalRooms !== undefined) block.totalRooms = totalRooms;
    if (status) block.status = status;

    if (admin !== undefined) {
      if (block.admin && block.admin.toString() !== admin?.toString()) {
        await User.findByIdAndUpdate(block.admin, { assignedBlock: null });
      }
      block.admin = admin || null;
      if (admin) {
        await User.findByIdAndUpdate(admin, { assignedBlock: block._id, role: 'block_admin' });
      }
    }

    await block.save();

    await logAudit({
      user: req.user,
      action: 'BLOCK_UPDATED',
      blockId: block._id,
      entityType: 'Block',
      entityId: block._id,
      previousValue,
      newValue: block.toObject(),
      req,
    });

    res.json({
      success: true,
      message: 'Block updated successfully',
      data: block,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete / Deactivate Block
// @route DELETE /api/blocks/:id
export const deleteBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block || block.isDeleted) {
      return res.status(404).json({ success: false, message: 'Block not found' });
    }

    block.isDeleted = true;
    block.status = 'inactive';
    await block.save();

    // Release admin
    if (block.admin) {
      await User.findByIdAndUpdate(block.admin, { assignedBlock: null });
    }

    await logAudit({
      user: req.user,
      action: 'BLOCK_DELETED',
      blockId: block._id,
      entityType: 'Block',
      entityId: block._id,
      req,
    });

    res.json({
      success: true,
      message: 'Block deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
