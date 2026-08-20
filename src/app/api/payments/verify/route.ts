import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitToUser } from '@/lib/socket';
import { sendBookingConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, paymentMethod } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({ where: { bookingId } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Mark as completed
    const updated = await db.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', paidAt: new Date(), paymentMethod: paymentMethod || payment.paymentMethod },
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
        data: { status: newStatus, totalAmount: payment.amount },
      });

      // Create notifications
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

      // Real-time notifications
      emitToUser(booking.familyId, 'payment:update', { bookingId, status: 'COMPLETED' });
      emitToUser(booking.caregiverId, 'booking:update', { bookingId, status: newStatus });

      // Email
      await sendBookingConfirmationEmail({ ...booking, totalAmount: payment.amount });
    }

    return NextResponse.json({ success: true, message: 'Payment verified and confirmed', payment: updated });
  } catch (err: any) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
