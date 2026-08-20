import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getRazorpayInstance } from '@/lib/razorpay';

const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
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
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 },
      );
    }
    const { bookingId, amount } = parsed.data;

    // --- Verify booking ---
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        patient: { select: { name: true } },
        caregiver: {
          select: {
            user: { select: { name: true } },
            hourlyRate: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 },
      );
    }

    if (booking.familyId !== userId) {
      return NextResponse.json(
        { error: 'This booking does not belong to you' },
        { status: 403 },
      );
    }

    // Amount in paise
    const amountPaise = Math.round(amount * 100);
    const platformFeePaise = Math.round(amountPaise * 0.15);
    const caregiverPayoutPaise = amountPaise - platformFeePaise;

    const razorpay = getRazorpayInstance();
    let razorpayOrderId: string;

    if (razorpay) {
      // --- Real Razorpay order ---
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: bookingId,
        notes: {
          bookingId,
          familyId: userId,
          caregiverId: booking.caregiverId,
        },
      });
      razorpayOrderId = order.id;
    } else {
      // --- Simulated order for demo ---
      razorpayOrderId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    // --- Upsert Payment record ---
    const existingPayment = await db.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: amountPaise,
          platformFee: platformFeePaise,
          caregiverPayout: caregiverPayoutPaise,
          status: 'PENDING',
          paymentMethod: 'razorpay',
          transactionId: razorpayOrderId,
        },
      });
    } else {
      await db.payment.create({
        data: {
          bookingId: booking.id,
          familyId: booking.familyId,
          caregiverId: booking.caregiverId,
          amount: amountPaise,
          platformFee: platformFeePaise,
          caregiverPayout: caregiverPayoutPaise,
          status: 'PENDING',
          paymentMethod: 'razorpay',
          transactionId: razorpayOrderId,
        },
      });
    }

    const patientName = booking.patient?.name ?? 'Patient';
    const caregiverName =
        booking.caregiver?.user?.name ?? 'Caregiver';

    return NextResponse.json({
      orderId: razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID ?? '',
      bookingId,
      name: 'SevaSaathi',
      description: `Care for ${patientName} by ${caregiverName}`,
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
