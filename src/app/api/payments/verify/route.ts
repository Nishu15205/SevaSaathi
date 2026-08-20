import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getRazorpayInstance, verifyPaymentSignature } from '@/lib/razorpay';

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  bookingId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // --- Auth check ---
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Validate body ---
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } =
      parsed.data;

    // --- Verify booking ownership ---
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 },
      );
    }
    if (booking.familyId !== userId) {
      return NextResponse.json(
        { success: false, message: 'This booking does not belong to you' },
        { status: 403 },
      );
    }

    const razorpay = getRazorpayInstance();
    let signatureValid = false;

    if (razorpay && !razorpay_order_id.startsWith('demo_')) {
      // --- Real Razorpay verification ---
      try {
        await razorpay.orders.fetch(razorpay_order_id);
        signatureValid = verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        );
      } catch {
        signatureValid = false;
      }
    } else {
      // --- Demo mode: accept any non-empty signature ---
      signatureValid = razorpay_signature.length > 0;
    }

    // --- Find payment record ---
    const payment = await db.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 },
      );
    }

    if (signatureValid) {
      // --- Mark as COMPLETED ---
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: razorpay_payment_id,
          paidAt: new Date(),
        },
      });

      // --- Confirm booking ---
      await db.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // --- Notify family ---
      await db.notification.create({
        data: {
          userId: booking.familyId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Successful',
          message: `Payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} for your booking has been completed. Transaction ID: ${razorpay_payment_id}`,
          data: JSON.stringify({
            paymentId: payment.id,
            bookingId,
            transactionId: razorpay_payment_id,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified and booking confirmed',
      });
    } else {
      // --- Mark as FAILED ---
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json({
        success: false,
        message: 'Payment signature verification failed',
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}
