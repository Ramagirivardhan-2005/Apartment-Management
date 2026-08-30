import express from 'express';
import {
  getSystemOverview,
  getAuditLogs,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/system-overview', authorize('super_admin', 'block_admin', 'receptionist'), getSystemOverview);
router.get('/audit-logs', authorize('super_admin'), getAuditLogs);

export default router;
