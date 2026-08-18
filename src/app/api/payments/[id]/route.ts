import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SS${timestamp}${random}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            patient: { select: { id: true, name: true, age: true, gender: true } },
            caregiver: {
              select: {
                id: true,
                user: { select: { name: true, phone: true } },
                hourlyRate: true,
              },
            },
          },
        },
        family: { select: { id: true, name: true, email: true, phone: true } },
        caregiver: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await db.payment.findUnique({ where: { id } });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment is already completed' },
        { status: 400 }
      );
    }

    if (payment.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Payment has been refunded' },
        { status: 400 }
      );
    }

    const transactionId = generateTransactionId();

    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        transactionId,
        paidAt: new Date(),
      },
      include: {
        booking: {
          include: {
            patient: { select: { id: true, name: true } },
            caregiver: {
              select: {
                id: true,
                user: { select: { name: true } },
              },
            },
          },
        },
        family: { select: { id: true, name: true } },
        caregiver: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    await db.notification.create({
      data: {
        userId: updatedPayment.familyId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Successful',
        message: `Payment of ₹${(updatedPayment.amount / 100).toLocaleString('en-IN')} for your booking has been completed.`,
        data: JSON.stringify({
          paymentId: updatedPayment.id,
          bookingId: updatedPayment.bookingId,
          transactionId,
        }),
      },
    });

    return NextResponse.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Complete payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
