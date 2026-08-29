import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitToUser } from '@/lib/socket';
import { sendBookingConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';
import { getRazorpayKeySecret, getPlatformFeePercent, getAdminBankName, getAdminAccountNumber, getAdminIfscCode, getAdminAccountHolder } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentMethod } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // If Razorpay credentials are set (from DB config or env), verify signature
    const keySecret = await getRazorpayKeySecret();
    if (keySecret && razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        console.error('[Razorpay] Signature verification failed');
        return NextResponse.json({ error: 'Payment verification failed', success: false }, { status: 400 });
      }
      console.log(`[Razorpay] Signature verified for payment ${razorpayPaymentId}`);
    }

    // Mark as completed
    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        paymentMethod: 'razorpay',
        transactionId: razorpayPaymentId || payment.transactionId,
      },
    });

    // Update booking status
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { patient: true, caregiver: { include: { user: true } }, family: true },
    });

    if (booking) {
      const newStatus = booking.status === 'PENDING' ? 'CONFIRMED' : booking.status;
      await db.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      });

      // Notifications
      await db.notification.create({
        data: {
          userId: booking.familyId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Confirmed',
          message: `Payment of ₹${payment.amount / 100} for ${booking.patient?.name || 'patient'} has been confirmed.`,
          data: JSON.stringify({ bookingId, paymentId: payment.id }),
        },
      });

      await db.notification.create({
        data: {
          userId: booking.caregiverId,
          type: 'BOOKING_CONFIRMED',
          title: 'New Booking Confirmed',
          message: `A new booking for ${booking.patient?.name || 'patient'} has been confirmed.`,
          data: JSON.stringify({ bookingId }),
        },
      });

      // Notify admin about platform fee received
      const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: 'PAYMENT_RECEIVED',
            title: 'Platform Fee Received',
            message: `₹${payment.platformFee / 100} platform fee received from booking for ${booking.patient?.name || 'patient'}. Caregiver payout: ₹${payment.caregiverPayout / 100}.`,
            data: JSON.stringify({ bookingId, paymentId: payment.id, platformFee: payment.platformFee, caregiverPayout: payment.caregiverPayout }),
          },
        });
      }

      // Notify caregiver about earnings
      await db.notification.create({
        data: {
          userId: booking.caregiverId,
          type: 'PAYMENT_RECEIVED',
          title: 'Earning Credited',
          message: `₹${payment.caregiverPayout / 100} has been credited from booking for ${booking.patient?.name || 'patient'}. Platform fee: ₹${payment.platformFee / 100}. Withdraw from Earnings tab.`,
          data: JSON.stringify({ bookingId, paymentId: payment.id, amount: payment.caregiverPayout }),
        },
      });

      // Real-time
      emitToUser(booking.familyId, 'payment:update', { bookingId, status: 'COMPLETED' });
      emitToUser(booking.caregiverId, 'booking:update', { bookingId, status: newStatus });

      // Email
      await sendBookingConfirmationEmail(booking);
    }

    return NextResponse.json({ success: true, message: 'Payment verified', paymentId: payment.id, payment: updated });
  } catch (err: any) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
