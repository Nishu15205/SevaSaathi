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

    // Verify booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        patient: { select: { name: true } },
        caregiver: { select: { user: { select: { name: true, email: true } }, hourlyRate: true } },
        family: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.familyId !== userId) {
      return NextResponse.json({ error: 'This booking does not belong to you' }, { status: 403 });
    }

    const amountPaise = Math.round(amount * 100);
    const platformFeePaise = Math.round(amountPaise * 0.10);
    const caregiverPayoutPaise = amountPaise - platformFeePaise;

    const razorpayOrderId = `ss_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Upsert payment in DB
    const existingPayment = await db.payment.findUnique({ where: { bookingId } });
    const paymentData = {
      amount: amountPaise,
      platformFee: platformFeePaise,
      caregiverPayout: caregiverPayoutPaise,
      status: 'PENDING' as const,
      paymentMethod: 'razorpay',
      transactionId: razorpayOrderId,
    };

    if (existingPayment) {
      await db.payment.update({ where: { id: existingPayment.id }, data: paymentData });
    } else {
      await db.payment.create({
        data: {
          bookingId: booking.id,
          familyId: booking.familyId,
          caregiverId: booking.caregiverId,
          ...paymentData,
        },
      });
    }

    // Check if Razorpay is configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      // REAL Razorpay order
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: razorpayOrderId,
        notes: {
          bookingId,
          patientName: booking.patient?.name,
          caregiverName: booking.caregiver?.user?.name,
        },
      });

      console.log(`[Razorpay] Order created: ${razorpayOrder.id} for ${amountPaise / 100}`);

      return NextResponse.json({
        orderId: razorpayOrder.id,
        amount: amountPaise,
        currency: 'INR',
        key: keyId,
        name: 'SevaSaathi',
        description: `Care for ${booking.patient?.name} by ${booking.caregiver?.user?.name}`,
        prefill: {
          name: booking.family?.name,
          email: booking.family?.email,
          contact: booking.family?.phone || undefined,
        },
        bookingId,
        isReal: true,
      });
    }

    // FALLBACK: Test mode (no Razorpay keys)
    console.log(`[Payment] Test order created: ${razorpayOrderId} for ${amountPaise / 100} (no Razorpay keys)`);
    return NextResponse.json({
      orderId: razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      key: 'test_key',
      name: 'SevaSaathi',
      description: `Care for ${booking.patient?.name} by ${booking.caregiver?.user?.name}`,
      bookingId,
      isReal: false,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
