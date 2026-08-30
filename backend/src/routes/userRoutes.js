import express from 'express';
import {
  getUsers,
  searchUsers,
  getUserById,
  registerResidentByReceptionist,
  createBlockAdmin,
  getBlockAdmins,
  resendBlockAdminOtp,
  updateBlockAdminEmail,
  verifyUserDocument,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.post('/', authorize('super_admin', 'block_admin', 'receptionist'), registerResidentByReceptionist);
router.get('/search', searchUsers);
router.get('/block-admins', authorize('super_admin'), getBlockAdmins);
router.post('/block-admin', authorize('super_admin'), createBlockAdmin);
router.post('/block-admin/:id/resend-otp', authorize('super_admin'), resendBlockAdminOtp);
router.put('/block-admin/:id/email', authorize('super_admin'), updateBlockAdminEmail);

router.post('/resident', authorize('super_admin', 'block_admin', 'receptionist'), registerResidentByReceptionist);
router.get('/:id', getUserById);
router.post('/:id/verify-document', authorize('super_admin', 'block_admin'), verifyUserDocument);

export default router;
