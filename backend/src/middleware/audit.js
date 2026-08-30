import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  user,
  action,
  entityType,
  entityId,
  previousValue = null,
  newValue = null,
}) => {
  try {
    const actor = user || (req ? req.user : null);
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] : 'System Server';

    await AuditLog.create({
      user: actor ? actor._id : null,
      userName: actor ? (actor.fullName || actor.email) : 'System Engine',
      role: actor ? actor.role : 'system',
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      previousValue,
      newValue,
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Audit Log Error]', error.message);
  }
};
