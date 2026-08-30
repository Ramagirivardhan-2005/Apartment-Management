import { Announcement } from '../models/Announcement.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Block } from '../models/Block.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';

// @desc Create announcement with audience targeting
// @route POST /api/announcements
export const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      content,
      category = 'general',
      targetAudience = 'all_residents',
      targetBlockId,
      targetRoomId,
      targetResidentId,
      priority = 'Normal',
      attachments = [],
      expiresAt,
    } = req.body;

    const user = req.user;

    const announcement = await Announcement.create({
      title,
      content,
      category,
      targetAudience,
      targetBlock: targetBlockId || (user.role === 'block_admin' ? user.assignedBlock : null),
      targetRoom: targetRoomId || null,
      targetResident: targetResidentId || null,
      priority,
      createdBy: user._id,
      createdByName: user.fullName,
      attachments,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    // Determine target users to send notifications and emails
    let targetUsers = [];
    if (targetAudience === 'all_residents') {
      targetUsers = await User.find({ role: 'resident', status: 'active', isDeleted: false });
    } else if (targetAudience === 'block' && (targetBlockId || user.assignedBlock)) {
      const bId = targetBlockId || user.assignedBlock;
      const occupiedRooms = await Room.find({ block: bId, status: 'occupied', isDeleted: false });
      const residentIds = occupiedRooms.map((r) => r.currentResident).filter(Boolean);
      targetUsers = await User.find({ _id: { $in: residentIds } });
    } else if (targetAudience === 'room' && targetRoomId) {
      const room = await Room.findById(targetRoomId);
      if (room && room.currentResident) {
        const resUser = await User.findById(room.currentResident);
        if (resUser) targetUsers = [resUser];
      }
    } else if (targetAudience === 'resident' && targetResidentId) {
      const resUser = await User.findById(targetResidentId);
      if (resUser) targetUsers = [resUser];
    }

    // Broadcast email & in-app notification
    for (const u of targetUsers) {
      await sendNotification({
        user: u,
        title: `Announcement: ${title}`,
        message: content,
        type: 'parking_announcement',
        link: '/resident/announcements',
        emailSubject: `Apartment Notice: ${title}`,
        emailHtml: EmailTemplates.parkingAnnouncement(title, content, priority),
      });
    }

    await logAudit({
      req,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'Announcement',
      entityId: announcement._id,
      newValue: { title, targetAudience, priority, recipientCount: targetUsers.length },
    });

    res.status(201).json({
      success: true,
      message: `Announcement published and broadcasted to ${targetUsers.length} resident(s).`,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get active announcements for current user feed
// @route GET /api/announcements
export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, priority } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (req.user.role === 'resident') {
      const activeRoom = await Room.findOne({ currentResident: req.user._id, isDeleted: false });
      query.$or = [
        { targetAudience: 'all_residents' },
        ...(activeRoom ? [{ targetAudience: 'block', targetBlock: activeRoom.block }] : []),
        ...(activeRoom ? [{ targetAudience: 'room', targetRoom: activeRoom._id }] : []),
        { targetAudience: 'resident', targetResident: req.user._id },
      ];
    } else if (req.user.role === 'block_admin' && req.user.assignedBlock) {
      query.$or = [
        { targetAudience: 'all_residents' },
        { targetBlock: req.user.assignedBlock },
        { createdBy: req.user._id },
      ];
    }

    const announcements = await Announcement.find(query)
      .populate('targetBlock', 'name code')
      .populate('targetRoom', 'roomNumber')
      .populate('targetResident', 'fullName')
      .populate('createdBy', 'fullName role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete / Deactivate announcement
// @route DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcement.isActive = false;
    await announcement.save();

    await logAudit({
      req,
      action: 'ANNOUNCEMENT_DELETED',
      entityType: 'Announcement',
      entityId: announcement._id,
    });

    res.json({
      success: true,
      message: 'Announcement removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
