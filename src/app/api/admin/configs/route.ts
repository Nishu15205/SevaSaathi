import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAllConfigs, bulkUpsert, seedConfigsFromEnv } from '@/lib/config';

/**
 * GET /api/admin/configs — List all configs grouped by section
 * GET /api/admin/configs?action=seed — Seed from .env values
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action');

    if (action === 'seed') {
      const count = await seedConfigsFromEnv();
      return NextResponse.json({ message: `Seeded ${count} config(s) from environment`, seeded: count });
    }

    const configs = await getAllConfigs();
    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('Get configs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get configs' }, { status: 500 });
  }
}

/**
 * POST /api/admin/configs — Bulk upsert configs
 * Body: { configs: [{ section, key, value, label?, isSecret? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configs: items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'configs array is required' }, { status: 400 });
    }

    await bulkUpsert(items);
    return NextResponse.json({ message: `${items.length} config(s) updated` });
  } catch (error: any) {
    console.error('Update configs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update configs' }, { status: 500 });
  }
}
