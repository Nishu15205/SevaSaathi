import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const caregiverId = searchParams.get('caregiverId');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.userId = userId;
    if (caregiverId) where.caregiverId = caregiverId;
    if (status) where.status = status;

    const withdrawals = await db.withdrawal.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        caregiver: { select: { id: true, city: true, hourlyRate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ withdrawals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, caregiverId, amount, method, upiId, bankName, accountNumber, ifscCode, accountHolder } = body;

    if (!userId || !caregiverId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'userId, caregiverId, and amount are required' }, { status: 400 });
    }

    if (method === 'upi' && !upiId) {
      return NextResponse.json({ error: 'UPI ID is required for UPI withdrawal' }, { status: 400 });
    }

    if (method === 'bank_transfer' && (!bankName || !accountNumber || !ifscCode || !accountHolder)) {
      return NextResponse.json({ error: 'Bank details are required for bank transfer' }, { status: 400 });
    }

    // Check available earnings
    const completedPayments = await db.payment.findMany({ where: { caregiverId, status: 'COMPLETED' } });
    const totalEarned = completedPayments.reduce((sum: number, p: any) => sum + (p.caregiverPayout || 0), 0);

    const pendingWithdrawals = await db.withdrawal.findMany({ where: { caregiverId, status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } } });
    const totalPending = pendingWithdrawals.reduce((sum: number, w: any) => sum + w.amount, 0);

    const available = totalEarned - totalPending;
    if (amount > available) {
      return NextResponse.json({ error: `Insufficient balance. Available: ₹${available / 100}` }, { status: 400 });
    }

    const withdrawal = await db.withdrawal.create({
      data: {
        userId, caregiverId, amount: Math.round(amount),
        method: method || 'bank_transfer', upiId, bankName, accountNumber, ifscCode, accountHolder,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ withdrawal, message: 'Withdrawal request submitted' });
  } catch (err: any) {
    console.error('Withdrawal create error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
