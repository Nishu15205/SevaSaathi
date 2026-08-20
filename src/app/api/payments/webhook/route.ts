import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Razorpay-Signature') ?? '';

    // --- Verify webhook signature ---
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && razorpaySecret !== 'your_razorpay_key_secret_here') {
      const valid = verifyWebhookSignature(rawBody, signature);
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 },
        );
      }
    }
    // If no real secret configured, skip verification (demo mode)

    const event = JSON.parse(rawBody);
    const eventType = event.event as string;
    const entity = event.payload?.payment?.entity;

    if (!entity) {
      return NextResponse.json({ received: true });
    }

    const razorpayPaymentId: string = entity.id ?? '';
    const razorpayOrderId: string = entity.order_id ?? '';

    // --- payment.captured ---
    if (eventType === 'payment.captured') {
      const payment = await db.payment.findFirst({
        where: { transactionId: razorpayOrderId },
      });

      if (payment && payment.status !== 'COMPLETED') {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            transactionId: razorpayPaymentId,
            paidAt: new Date(),
          },
        });

        await db.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });

        await db.notification.create({
          data: {
            userId: payment.familyId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Successful',
            message: `Payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} has been received. Transaction ID: ${razorpayPaymentId}`,
            data: JSON.stringify({
              paymentId: payment.id,
              bookingId: payment.bookingId,
              transactionId: razorpayPaymentId,
            }),
          },
        });
      }
    }

    // --- payment.failed ---
    if (eventType === 'payment.failed') {
      const payment = await db.payment.findFirst({
        where: { transactionId: razorpayOrderId },
      });

      if (payment && payment.status === 'PENDING') {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    // --- refund.processed ---
    if (eventType === 'refund.processed') {
      const payment = await db.payment.findFirst({
        where: { transactionId: razorpayPaymentId },
      });

      if (payment && payment.status === 'COMPLETED') {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED',
            refundedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
