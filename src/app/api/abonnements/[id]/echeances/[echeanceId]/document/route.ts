import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateDocumentUpload, sanitizeFilename } from '@/lib/upload-security';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'abonnements');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; echeanceId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { echeanceId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(sanitizeFilename(file.name));
    const filename = `echeance-${echeanceId}-${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const echeance = await prisma.echeanceAbonnement.update({
      where: { id: echeanceId },
      data: {
        documentPath: `/uploads/abonnements/${filename}`,
        documentName: file.name,
      },
    });

    return NextResponse.json(echeance);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; echeanceId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { echeanceId } = await params;

    const echeance = await prisma.echeanceAbonnement.findUnique({
      where: { id: echeanceId },
      select: { documentPath: true },
    });

    if (echeance?.documentPath) {
      const filepath = path.join(process.cwd(), 'public', echeance.documentPath);
      try {
        await unlink(filepath);
      } catch {
        // File may not exist
      }
    }

    const updated = await prisma.echeanceAbonnement.update({
      where: { id: echeanceId },
      data: {
        documentPath: null,
        documentName: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
