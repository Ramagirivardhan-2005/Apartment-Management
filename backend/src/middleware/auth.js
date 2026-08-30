import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'blocked' || user.status === 'inactive' || user.isDeleted) {
      return res.status(403).json({ success: false, message: 'Account is deactivated or blocked. Contact Administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user ? req.user.role : 'none'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

/**
 * Strict Block-Level Authorization Middleware (Section 3, 6, 8, 17, 18)
 * Enforces that Block Admins and Receptionists can ONLY query/mutate resources for their assigned block.
 */
export const checkBlockAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Super Admin has global master access
  if (req.user.role === 'super_admin') {
    return next();
  }

  const requestedBlockId = req.params.blockId || req.body.block || req.query.blockId || req.body.assignedBlock || req.params.id;

  // Block Admin or Receptionist can ONLY access their assigned block
  if (req.user.role === 'block_admin' || req.user.role === 'receptionist') {
    if (!req.user.assignedBlock) {
      return res.status(403).json({ success: false, message: 'Staff member has no assigned block.' });
    }

    if (requestedBlockId && requestedBlockId.toString() !== req.user.assignedBlock.toString()) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized: ${req.user.role === 'block_admin' ? 'Block Admin' : 'Receptionist'} cannot access or manage another block.`,
      });
    }
  }

  next();
};
