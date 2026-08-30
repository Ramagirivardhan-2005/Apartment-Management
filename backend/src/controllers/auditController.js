import { AuditLog } from '../models/AuditLog.js';

// @desc Get audit logs (Super Admin sees all, Block Admin sees block logs)
// @route GET /api/audit
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, blockId, limit = 100 } = req.query;
    let query = {};

    if (req.user.role === 'block_admin') {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.blockId = req.user.assignedBlock;
    } else if (blockId) {
      query.blockId = blockId;
    }

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const logs = await AuditLog.find(query)
      .populate('user', 'fullName email role employeeId')
      .populate('blockId', 'name code')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
