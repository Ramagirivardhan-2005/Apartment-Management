import { Complaint } from '../models/Complaint.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';

// @desc Create new complaint
// @route POST /api/complaints
export const createComplaint = async (req, res, next) => {
  try {
    const {
      roomId,
      blockId,
      parkingSlotId,
      category,
      description,
      vehicleNumber,
      photos = [],
      priority = 'Medium',
    } = req.body;

    const user = req.user;

    let targetBlockId = blockId;
    let targetRoomId = roomId;

    if (!targetRoomId) {
      const activeRoom = await Room.findOne({ currentResident: user._id, isDeleted: false });
      if (activeRoom) {
        targetRoomId = activeRoom._id;
        if (!targetBlockId) targetBlockId = activeRoom.block;
      }
    }

    if (!targetBlockId) {
      const room = await Room.findById(targetRoomId);
      if (room) targetBlockId = room.block;
    }

    const complaintId = `CMP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const complaint = await Complaint.create({
      complaintId,
      resident: user._id,
      room: targetRoomId || null,
      block: targetBlockId,
      parkingSlot: parkingSlotId || null,
      category,
      description,
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : undefined,
      photos,
      priority,
      status: 'NEW',
      updates: [
        {
          status: 'NEW',
          updatedBy: user._id,
          updatedByName: user.fullName,
          note: 'Complaint submitted by resident.',
          timestamp: new Date(),
        },
      ],
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('resident', 'fullName email mobile')
      .populate('room', 'roomNumber floor')
      .populate('block', 'name code admin')
      .populate('parkingSlot', 'slotNumber');

    // Notify Block Admin
    if (populatedComplaint.block?.admin) {
      const blockAdmin = await User.findById(populatedComplaint.block.admin);
      if (blockAdmin) {
        await sendNotification({
          user: blockAdmin,
          title: `New Complaint: ${complaintId} (${category})`,
          message: `Resident ${user.fullName} raised a complaint: "${description.slice(0, 100)}..."`,
          type: 'parking_complaint',
          link: '/block-admin/complaints',
        });
      }
    }

    await logAudit({
      req,
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: complaint._id,
      newValue: { complaintId, category, resident: user.fullName },
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: populatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get complaints with role-based filtering
// @route GET /api/complaints
export const getComplaints = async (req, res, next) => {
  try {
    const { blockId, status, category, search } = req.query;
    let query = {};

    if (req.user.role === 'resident') {
      query.resident = req.user._id;
    } else if (req.user.role === 'block_admin') {
      query.block = req.user.assignedBlock;
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) query.status = status;
    if (category) query.category = category;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ complaintId: s }, { description: s }, { vehicleNumber: s }];
    }

    const complaints = await Complaint.find(query)
      .populate('resident', 'fullName email mobile avatar')
      .populate('room', 'roomNumber floor')
      .populate('block', 'name code')
      .populate('parkingSlot', 'slotNumber floorLocation')
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single complaint by ID
// @route GET /api/complaints/:id
export const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('resident', 'fullName email mobile address')
      .populate('room', 'roomNumber floor')
      .populate('block', 'name code')
      .populate('parkingSlot', 'slotNumber floorLocation')
      .populate('assignedTo', 'fullName email mobile')
      .populate('updates.updatedBy', 'fullName role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'resident' && complaint.resident._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update complaint status (Workflow: NEW -> ACKNOWLEDGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED)
// @route PUT /api/complaints/:id/status
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note, assignedTo, resolutionNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id)
      .populate('resident', 'fullName email mobile')
      .populate('block', 'name code');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (assignedTo) {
      complaint.assignedTo = assignedTo;
      const assignedUser = await User.findById(assignedTo);
      if (assignedUser) complaint.assignedToName = assignedUser.fullName;
    }

    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED') complaint.resolvedAt = new Date();
    if (status === 'CLOSED') complaint.closedAt = new Date();

    complaint.updates.push({
      status,
      updatedBy: req.user._id,
      updatedByName: req.user.fullName,
      note: note || `Status changed to ${status}`,
      timestamp: new Date(),
    });

    await complaint.save();

    // Send email and in-app notification to resident
    if (complaint.resident) {
      await sendNotification({
        user: complaint.resident,
        title: `Complaint ${complaint.complaintId} Updated`,
        message: `Status of your complaint (${complaint.category}) has been updated to: ${status}. ${note || ''}`,
        type: 'complaint_status_update',
        link: '/resident/complaints',
        emailSubject: `Update on Complaint ${complaint.complaintId}: ${status}`,
        emailHtml: EmailTemplates.parkingComplaintUpdate(
          complaint.complaintId,
          status,
          complaint.resident.fullName,
          note
        ),
      });
    }

    await logAudit({
      req,
      action: 'COMPLAINT_STATUS_UPDATED',
      entityType: 'Complaint',
      entityId: complaint._id,
      previousValue: { status: previousStatus },
      newValue: { status, note, assignedTo },
    });

    res.json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};
