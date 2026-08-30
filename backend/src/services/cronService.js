import cron from 'node-cron';
import { Due } from '../models/Due.js';
import { Room } from '../models/Room.js';
import { BookingQueue } from '../models/BookingQueue.js';
import { sendNotification, EmailTemplates } from './notificationService.js';

export const runDueAndOverdueEngine = async () => {
  try {
    console.log('[Cron Engine] Running daily Due & Overdue calculation...');
    const dues = await Due.find({ status: { $in: ['unpaid', 'partially_paid'] } })
      .populate('user', 'fullName email mobile')
      .populate('room', 'roomNumber block')
      .populate('block', 'name code');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const due of dues) {
      const prevTier = due.tier;
      due.recalculate();
      await due.save();

      if (!due.user) continue;

      const roomNo = due.room ? due.room.roomNumber : 'N/A';
      const lastReminded = due.lastReminderSentAt ? new Date(due.lastReminderSentAt) : null;
      const isAlreadyRemindedToday = lastReminded && lastReminded.toDateString() === today.toDateString();

      if (isAlreadyRemindedToday) continue;

      // 1. Due Today reminder
      if (due.tier === 'due_today') {
        await sendNotification({
          user: due.user,
          title: 'Apartment Payment Due Today',
          message: `Your payment of ₹${due.totalOutstanding.toLocaleString()} for Room ${roomNo} is due today.`,
          type: 'payment_due',
          link: '/resident/payments',
          emailSubject: `Reminder: Payment Due Today for Room ${roomNo}`,
        });
        due.lastReminderSentAt = new Date();
        due.reminderCount = (due.reminderCount || 0) + 1;
        await due.save();
      }

      // 2. Overdue 1 to 10 days
      else if (due.tier === 'overdue_1_10') {
        await sendNotification({
          user: due.user,
          title: 'Payment Overdue Alert',
          message: `Your payment for Room ${roomNo} is overdue by ${due.overdueDays} days. A late fee of ₹${due.lateFee.toLocaleString()} has been applied. Total outstanding: ₹${due.totalOutstanding.toLocaleString()}.`,
          type: 'payment_overdue',
          link: '/resident/payments',
          emailSubject: `Overdue Payment Notice: Room ${roomNo} (${due.overdueDays} Days Overdue)`,
          emailHtml: EmailTemplates.overdueWarning(
            due.user.fullName,
            roomNo,
            due.overdueDays,
            due.amountDue,
            due.lateFee,
            false
          ),
        });
        due.lastReminderSentAt = new Date();
        due.reminderCount = (due.reminderCount || 0) + 1;
        await due.save();
      }

      // 3. Seriously Overdue > 10 days or Critical
      else if (due.tier === 'overdue_10_plus' || due.tier === 'critical') {
        await sendNotification({
          user: due.user,
          title: 'CRITICAL: Payment Overdue > 10 Days',
          message: `Strong Warning: Your payment for Room ${roomNo} has been overdue for ${due.overdueDays} days. Please pay ₹${due.totalOutstanding.toLocaleString()} immediately.`,
          type: 'payment_overdue_10days',
          link: '/resident/payments',
          emailSubject: `CRITICAL ACTION REQUIRED: Overdue Payment Notice for Room ${roomNo}`,
          emailHtml: EmailTemplates.overdueWarning(
            due.user.fullName,
            roomNo,
            due.overdueDays,
            due.amountDue,
            due.lateFee,
            true
          ),
        });
        due.lastWarningSentAt = new Date();
        due.lastReminderSentAt = new Date();
        due.reminderCount = (due.reminderCount || 0) + 1;
        await due.save();
      }
    }
    console.log(`[Cron Engine] Processed ${dues.length} dues successfully.`);
  } catch (error) {
    console.error('[Cron Engine Error]', error.message);
  }
};

export const checkBookingQueueEngine = async () => {
  try {
    const waitingList = await BookingQueue.find({ status: 'waiting' })
      .sort({ queuePosition: 1, createdAt: 1 })
      .populate('user', 'fullName email mobile')
      .populate('requestedBlock', 'name code');

    for (const queueItem of waitingList) {
      const query = {
        block: queueItem.requestedBlock._id,
        status: 'available',
        isDeleted: false,
      };
      if (queueItem.roomType && queueItem.roomType !== 'Any') {
        query.roomType = queueItem.roomType;
      }
      if (queueItem.ac !== undefined) {
        query.ac = queueItem.ac;
      }

      const availableCount = await Room.countDocuments(query);

      if (availableCount >= queueItem.numberOfRooms) {
        queueItem.status = 'room_available';
        queueItem.notifiedAt = new Date();
        await queueItem.save();

        if (queueItem.user) {
          await sendNotification({
            user: queueItem.user,
            title: 'Room Available from Waitlist!',
            message: `A matching room has become available in ${queueItem.requestedBlock.name}. Please proceed to book within 24 hours.`,
            type: 'booking_queue_available',
            link: '/resident/book-room',
            emailSubject: 'Good news! Your waitlisted room is now available',
          });
        }
      }
    }
  } catch (error) {
    console.error('[Booking Queue Cron Error]', error.message);
  }
};

export const initCronJobs = () => {
  // Run every midnight (00:05 AM)
  cron.schedule('5 0 * * *', async () => {
    await runDueAndOverdueEngine();
    await checkBookingQueueEngine();
  });

  // Run initial check on server startup (after 10 seconds)
  setTimeout(async () => {
    await runDueAndOverdueEngine();
    await checkBookingQueueEngine();
  }, 10000);

  console.log('[Cron Service] Scheduled tasks initialized.');
};
