import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/caregiver/upload-document
 * Upload Aadhaar card / ID card image for verification.
 * Accepts multipart/form-data with: caregiverId, docType (AADHAAR | ID_CARD), file
 *
 * Storage strategy:
 * - Local dev / VPS with persistent disk → file system (public/upload/docs/)
 * - Cloud (Koyeb, Render free) → base64 data URI stored in DB docUrl field
 *   Auto-detected via TURSO_STORAGE env var or libsql:// DATABASE_URL
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const caregiverId = formData.get('caregiverId') as string;
    const docType = formData.get('docType') as string;
    const docNumber = (formData.get('docNumber') as string) || '';
    const file = formData.get('file') as File | null;

    if (!caregiverId || !docType) {
      return NextResponse.json({ error: 'caregiverId and docType required' }, { status: 400 });
    }

    if (!['AADHAAR', 'ID_CARD'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid docType. Use AADHAAR or ID_CARD' }, { status: 400 });
    }

    // Verify caregiver exists
    const caregiver = await db.caregiver.findUnique({ where: { id: caregiverId } });
    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    let docUrl = '';

    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Only JPG, PNG, or WebP images allowed' }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Detect if running in cloud (Turso/ephemeral) or local (persistent disk)
      const dbUrl = process.env.DATABASE_URL || '';
      const isCloud = dbUrl.startsWith('libsql://') || process.env.STORAGE_MODE === 'db';

      if (isCloud) {
        // Cloud: store as base64 data URI in DB (works in <img src> directly)
        const base64 = buffer.toString('base64');
        const mime = file.type || 'image/jpeg';
        docUrl = `data:${mime};base64,${base64}`;
      } else {
        // Local / VPS: store as file on disk
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${caregiverId}-${docType}-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'upload', 'docs');
        await mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);
        docUrl = `/upload/docs/${filename}`;
      }
    }

    // Upsert verification record
    const verification = await db.verification.upsert({
      where: {
        caregiverId_docType: { caregiverId, docType: docType as any },
      },
      update: {
        docNumber: docNumber || undefined,
        docUrl: docUrl || undefined,
        status: 'PENDING',
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      create: {
        caregiverId,
        docType: docType as any,
        docNumber: docNumber || '',
        docUrl,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      verification: {
        id: verification.id,
        docType: verification.docType,
        docUrl: verification.docUrl,
        status: verification.status,
      },
      message: `${docType === 'AADHAAR' ? 'Aadhaar card' : 'ID card'} uploaded successfully`,
    });
  } catch (err: any) {
    console.error('Upload document error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
