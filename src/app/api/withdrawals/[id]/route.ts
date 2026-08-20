import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!['APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === 'REJECTED' && rejectionReason) updateData.rejectionReason = rejectionReason;
    if (['PROCESSING', 'COMPLETED'].includes(status)) updateData.processedAt = new Date();

    const withdrawal = await db.withdrawal.update({ where: { id }, data: updateData });
    return NextResponse.json({ withdrawal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
