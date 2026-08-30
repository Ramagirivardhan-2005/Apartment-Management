import express from 'express';
import {
  lookupResident,
  logResidentMovement,
  getSecurityLogs,
  getSecurityStats,
} from '../controllers/securityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/lookup-resident', authorize('super_admin', 'block_admin', 'receptionist', 'security'), lookupResident);
router.post('/resident-movement', authorize('super_admin', 'block_admin', 'security'), logResidentMovement);
router.get('/logs', authorize('super_admin', 'block_admin', 'security'), getSecurityLogs);
router.get('/stats', authorize('super_admin', 'block_admin', 'security'), getSecurityStats);

export default router;
