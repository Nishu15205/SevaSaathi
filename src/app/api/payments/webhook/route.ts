import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emitToUser } from '@/lib/socket';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { getRazorpayKeySecret } from '@/lib/config';
import crypto from 'crypto';

/**
 * Razorpay Webhook Handler
 * 
 * Setup in Razorpay Dashboard:
 * Settings → Webhooks → Add Endpoint
 * URL: https://yourdomain.com/api/payments/webhook
 * Events: payment.captured, payment.failed
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Raw body for signature verification
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const keySecret = await getRazorpayKeySecret();
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(`[Webhook] Event: ${event.event}`);

    // Handle payment.captured (successful payment)
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Find payment by transaction ID (we stored Razorpay order ID as transactionId)
      const payment = await db.payment.findFirst({
        where: { transactionId: razorpayOrderId },
      });

      if (!payment) {
        console.error(`[Webhook] Payment not found for order ${razorpayOrderId}`);
        return NextResponse.json({ received: true });
      }

      if (payment.status === 'COMPLETED') {
        console.log(`[Webhook] Payment already confirmed: ${razorpayPaymentId}`);
        return NextResponse.json({ received: true });
      }

      // Update payment
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          paymentMethod: 'razorpay',
          transactionId: razorpayPaymentId,
        },
      });

      // Update booking
      const booking = await db.booking.findUnique({
        where: { id: payment.bookingId },
        include: { patient: true, caregiver: { include: { user: true } }, family: true },
      });

      if (booking) {
        const newStatus = booking.status === 'PENDING' ? 'CONFIRMED' : booking.status;
        await db.booking.update({
          where: { id: payment.bookingId },
          data: { status: newStatus, totalAmount: payment.amount },
        });

        // Notifications
        await db.notification.create({
          data: {
            userId: booking.familyId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Confirmed',
            message: `Payment of ₹${payment.amount / 100} for ${booking.patient?.name || 'patient'} confirmed.`,
            data: JSON.stringify({ bookingId: payment.bookingId, paymentId: payment.id }),
          },
        });

        await db.notification.create({
          data: {
            userId: booking.caregiverId,
            type: 'BOOKING_CONFIRMED',
            title: 'New Booking Confirmed',
            message: `Booking for ${booking.patient?.name || 'patient'} confirmed via Razorpay.`,
            data: JSON.stringify({ bookingId: payment.bookingId }),
          },
        });

        // Real-time
        emitToUser(booking.familyId, 'payment:update', { bookingId: payment.bookingId, status: 'COMPLETED' });
        emitToUser(booking.caregiverId, 'booking:update', { bookingId: payment.bookingId, status: newStatus });

        // Email
        await sendBookingConfirmationEmail({ ...booking, totalAmount: payment.amount });

        console.log(`[Webhook] Booking ${payment.bookingId} confirmed via Razorpay`);
      }
    }

    // Handle payment.failed
    if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;

      const payment = await db.payment.findFirst({
        where: { transactionId: razorpayOrderId },
      });

      if (payment) {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        console.log(`[Webhook] Payment failed for booking ${payment.bookingId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
