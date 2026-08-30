import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * PUT /api/auth/update-phone
 * Update user's phone number. Auth via userId in body.
 * Supports international phone numbers with country code.
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId, phone } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Clean the phone number
    let cleanPhone = (phone || '').replace(/[\s\-()]/g, '');

    if (!cleanPhone) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
    }

    // If already has country code (starts with +), use as-is
    let formattedPhone: string;
    if (cleanPhone.startsWith('+')) {
      const digits = cleanPhone.replace(/[^0-9]/g, '');
      if (digits.length < 10 || digits.length > 15) {
        return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
      }
      formattedPhone = '+' + digits;
    } else {
      // No country code — assume Indian (10 digits)
      const digits = cleanPhone.replace(/[^0-9]/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
      }
      // If 10 digits starting with 6-9, assume India
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        formattedPhone = '+91' + digits;
      } else {
        formattedPhone = '+' + digits;
      }
    }

    // Check if phone is already used by another user
    const existing = await db.user.findFirst({ where: { phone: formattedPhone } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409 });
    }

    await db.user.update({
      where: { id: userId },
      data: { phone: formattedPhone, phoneVerified: false },
    });

    return NextResponse.json({ phone: formattedPhone, message: 'Phone number updated' });
  } catch (err: any) {
    console.error('Update phone error:', err);
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
  }
}
