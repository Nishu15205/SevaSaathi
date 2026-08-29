import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPlatformFeePercent } from '@/lib/config';

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SS${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, paymentMethod, userId } = body;

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { error: 'bookingId and paymentMethod are required' },
        { status: 400 }
      );
    }

    const validMethods = ['upi', 'card', 'netbanking'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Use upi, card, or netbanking' },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        family: { select: { id: true, name: true } },
        caregiver: { select: { id: true, user: { select: { name: true } } } },
        patient: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (userId && booking.familyId !== userId) {
      return NextResponse.json(
        { error: 'This booking does not belong to you' },
        { status: 403 }
      );
    }

    const existingPayment = await db.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this booking' },
        { status: 409 }
      );
    }

    const totalAmountINR = booking.totalAmount;
    const feePercent = await getPlatformFeePercent();
    const platformFeeINR = Math.round(totalAmountINR * (feePercent / 100));
    const caregiverPayoutINR = totalAmountINR - platformFeeINR;

    const payment = await db.payment.create({
      data: {
        bookingId: booking.id,
        familyId: booking.familyId,
        caregiverId: booking.caregiverId,
        amount: totalAmountINR * 100,
        platformFee: platformFeeINR * 100,
        caregiverPayout: caregiverPayoutINR * 100,
        status: 'PENDING',
        paymentMethod,
      },
      include: {
        booking: {
          include: {
            patient: { select: { id: true, name: true } },
            caregiver: { select: { id: true, user: { select: { name: true } }, hourlyRate: true } },
          },
        },
        family: { select: { id: true, name: true, email: true } },
        caregiver: { select: { id: true, user: { select: { name: true } } } },
      },
    });

    // Simulate payment completion after 2 seconds
    setTimeout(async () => {
      try {
        const txnId = generateTransactionId();
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            transactionId: txnId,
            paidAt: new Date(),
          },
        });

        await db.notification.create({
          data: {
            userId: booking.familyId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Successful',
            message: `Payment of ₹${totalAmountINR.toLocaleString('en-IN')} for booking has been completed. Transaction ID: ${txnId}`,
            data: JSON.stringify({ paymentId: payment.id, bookingId: booking.id, transactionId: txnId }),
          },
        });

        console.log(`[Payment] Auto-completed payment ${payment.id} with txn ${txnId}`);
      } catch (err) {
        console.error('[Payment] Auto-complete failed:', err);
      }
    }, 2000);

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'FAMILY' && role !== 'CAREGIVER') {
      return NextResponse.json(
        { error: 'role must be FAMILY or CAREGIVER' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> =
      role === 'FAMILY' ? { familyId: userId } : { caregiverId: userId };

    const payments = await db.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            patient: { select: { id: true, name: true } },
          },
        },
        family: role === 'CAREGIVER' ? { select: { id: true, name: true } } : false,
        caregiver: role === 'FAMILY' ? { select: { id: true, user: { select: { name: true } } } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('List payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
