import express from 'express';
import {
  createRoomBookingOrder,
  verifyAndConfirmBooking,
  recordManualPayment,
  processResidentPayment,
  getPayments,
  getPaymentById,
  getRevenueStats,
  getOverdueDashboard,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/razorpay/create-order', createRoomBookingOrder);
router.post('/razorpay/verify-payment', verifyAndConfirmBooking);
router.post('/manual', authorize('super_admin', 'block_admin', 'receptionist'), recordManualPayment);
router.post('/', processResidentPayment);

router.get('/revenue', authorize('super_admin', 'block_admin', 'receptionist'), getRevenueStats);
router.get('/overdue-dashboard', authorize('super_admin', 'block_admin', 'receptionist'), getOverdueDashboard);
router.get('/', getPayments);
router.get('/:id', getPaymentById);

export default router;
