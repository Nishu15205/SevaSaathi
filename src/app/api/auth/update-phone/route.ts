import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

/**
 * PUT /api/auth/update-phone
 * Update the logged-in user's phone number.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { phone } = await req.json();
    const cleanPhone = (phone || '').replace(/[\s-]/g, '');

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit Indian phone number' }, { status: 400 });
    }

    const formattedPhone = '+91' + cleanPhone;

    // Check if phone is already used by another user
    const existing = await db.user.findFirst({ where: { phone: formattedPhone } });
    if (existing) {
      return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409 });
    }

    await db.user.update({
      where: { email: session.user.email },
      data: { phone: formattedPhone, phoneVerified: false },
    });

    return NextResponse.json({ phone: formattedPhone, message: 'Phone number updated' });
  } catch (err: any) {
    console.error('Update phone error:', err);
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
  }
}
