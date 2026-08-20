import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['stripe', 'upi', 'bank_transfer', 'cash']).default('upi'),
  upiId: z.string().optional(),
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
    const { bookingId, amount, paymentMethod, upiId } = parsed.data;

    // Verify booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        patient: { select: { name: true } },
        caregiver: { select: { user: { select: { name: true } }, hourlyRate: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.familyId !== userId) {
      return NextResponse.json({ error: 'This booking does not belong to you' }, { status: 403 });
    }

    const amountPaise = Math.round(amount * 100);
    const platformFeePaise = Math.round(amountPaise * 0.10); // 10% platform fee
    const caregiverPayoutPaise = amountPaise - platformFeePaise;

    const transactionId = `ss_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Upsert payment
    const existingPayment = await db.payment.findUnique({ where: { bookingId } });

    if (existingPayment) {
      await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: amountPaise,
          platformFee: platformFeePaise,
          caregiverPayout: caregiverPayoutPaise,
          status: 'PENDING',
          paymentMethod,
          transactionId,
          upiId: upiId || null,
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
          paymentMethod,
          transactionId,
          upiId: upiId || null,
        },
      });
    }

    const patientName = booking.patient?.name ?? 'Patient';
    const caregiverName = booking.caregiver?.user?.name ?? 'Caregiver';

    // For UPI: return payment details to show to user
    if (paymentMethod === 'upi') {
      return NextResponse.json({
        orderId: transactionId,
        amount: amountPaise,
        currency: 'INR',
        paymentMethod: 'upi',
        upiId: 'sevasaathi@paytm', // In production, your business UPI ID
        bookingId,
        name: 'SevaSaathi',
        description: `Care for ${patientName} by ${caregiverName}`,
      });
    }

    // For cash/manual: mark as pending confirmation
    if (paymentMethod === 'cash') {
      return NextResponse.json({
        orderId: transactionId,
        amount: amountPaise,
        currency: 'INR',
        paymentMethod: 'cash',
        bookingId,
        name: 'SevaSaathi',
        description: `Care for ${patientName} by ${caregiverName}`,
        message: 'Pay cash to the caregiver. Payment will be confirmed after verification.',
      });
    }

    // Default: simulated payment (for demo/development)
    return NextResponse.json({
      orderId: transactionId,
      amount: amountPaise,
      currency: 'INR',
      paymentMethod,
      bookingId,
      name: 'SevaSaathi',
      description: `Care for ${patientName} by ${caregiverName}`,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
