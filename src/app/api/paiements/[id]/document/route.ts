import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateDocumentUpload, sanitizeFilename } from '@/lib/upload-security';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'paiements');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
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
    const filename = `paiement-${id}-${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const paiement = await prisma.paiement.update({
      where: { id },
      data: {
        documentPath: `/uploads/paiements/${filename}`,
        documentName: file.name,
      },
    });

    return NextResponse.json(paiement);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const paiement = await prisma.paiement.findUnique({
      where: { id },
      select: { documentPath: true },
    });

    if (paiement?.documentPath) {
      const filepath = path.join(process.cwd(), 'public', paiement.documentPath);
      try {
        await unlink(filepath);
      } catch {
        // File may not exist
      }
    }

    const updated = await prisma.paiement.update({
      where: { id },
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
