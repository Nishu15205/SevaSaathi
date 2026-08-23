import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Razorpay from 'razorpay';

const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }
    const { bookingId, amount } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        patient: { select: { name: true } },
        caregiver: { select: { user: { select: { name: true } } } },
        family: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.familyId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const amountPaise = Math.round(amount * 100);
    const platformFeePaise = Math.round(amountPaise * 0.10);
    const caregiverPayoutPaise = amountPaise - platformFeePaise;
    const orderId = `ss_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Upsert payment
    const existing = await db.payment.findUnique({ where: { bookingId } });
    const data = {
      amount: amountPaise,
      platformFee: platformFeePaise,
      caregiverPayout: caregiverPayoutPaise,
      status: 'PENDING' as const,
      paymentMethod: 'upi',
      transactionId: orderId,
    };
    if (existing) {
      await db.payment.update({ where: { id: existing.id }, data });
    } else {
      await db.payment.create({ data: { bookingId: booking.id, familyId: booking.familyId, caregiverId: booking.caregiverId, ...data } });
    }

    // If Razorpay keys are configured, create a real Razorpay order
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const rzpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { bookingId, patientName: booking.patient?.name, caregiverName: booking.caregiver?.user?.name },
      });
      return NextResponse.json({
        orderId: rzpOrder.id, amount: amountPaise, currency: 'INR', key: process.env.RAZORPAY_KEY_ID,
        name: 'SevaSaathi', description: `Care for ${booking.patient?.name} by ${booking.caregiver?.user?.name}`,
        prefill: { name: booking.family?.name, email: booking.family?.email, contact: booking.family?.phone || undefined },
        bookingId, isReal: true,
      });
    }

    // Default: UPI direct (no gateway needed)
    return NextResponse.json({
      orderId, amount: amountPaise, currency: 'INR', bookingId,
      name: 'SevaSaathi', description: `Care for ${booking.patient?.name} by ${booking.caregiver?.user?.name}`,
      isReal: false,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
