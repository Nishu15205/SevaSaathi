import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Razorpay from 'razorpay';
import { getRazorpayKeyId, getRazorpayKeySecret, getPlatformFeePercent } from '@/lib/config';

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
        { error: parsed.error.issues.map((e) => e.message).join(', ') },
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
    const feePercent = await getPlatformFeePercent();
    const platformFeePaise = Math.round(amountPaise * (feePercent / 100));
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

    // Fee breakdown for frontend display (amounts in INR, not paise)
    const feeBreakdown = {
      feePercent,
      totalINR: amount,
      platformFeeINR: Math.round(platformFeePaise / 100),
      caregiverPayoutINR: Math.round(caregiverPayoutPaise / 100),
    };

    // If Razorpay keys are configured (from DB config or env), create a real Razorpay order
    const rzpKeyId = await getRazorpayKeyId();
    const rzpKeySecret = await getRazorpayKeySecret();
    if (rzpKeyId && rzpKeySecret) {
      const razorpay = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });
      const rzpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { bookingId, patientName: booking.patient?.name, caregiverName: booking.caregiver?.user?.name },
      });
      return NextResponse.json({
        orderId: rzpOrder.id, amount: amountPaise, currency: 'INR', key: rzpKeyId,
        name: 'SevaSaathi', description: `Care for ${booking.patient?.name} by ${booking.caregiver?.user?.name}`,
        prefill: { name: booking.family?.name, email: booking.family?.email, contact: booking.family?.phone || undefined },
        bookingId, isReal: true, feeBreakdown,
      });
    }

    // Default: UPI direct (no gateway needed)
    return NextResponse.json({
      orderId, amount: amountPaise, currency: 'INR', bookingId,
      name: 'SevaSaathi', description: `Care for ${booking.patient?.name} by ${booking.caregiver?.user?.name}`,
      isReal: false, feeBreakdown,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
