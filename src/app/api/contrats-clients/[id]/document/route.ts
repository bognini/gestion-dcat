import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'contrats-clients');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `contrat-${id}-${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update contrat with document info
    const contrat = await prisma.contratClient.update({
      where: { id },
      data: {
        documentPath: `/uploads/contrats-clients/${filename}`,
        documentName: file.name,
      },
    });

    return NextResponse.json(contrat);
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
    const { id } = await params;

    const contrat = await prisma.contratClient.findUnique({
      where: { id },
      select: { documentPath: true },
    });

    if (contrat?.documentPath) {
      const filepath = path.join(process.cwd(), 'public', contrat.documentPath);
      try {
        await unlink(filepath);
      } catch {
        // File may not exist, continue
      }
    }

    const updated = await prisma.contratClient.update({
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
