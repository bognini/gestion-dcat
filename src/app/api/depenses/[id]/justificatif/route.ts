import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateDocumentUpload, sanitizeFilename } from '@/lib/upload-security';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Check if depense exists
    const depense = await prisma.depense.findUnique({
      where: { id },
    });

    if (!depense) {
      return NextResponse.json({ error: 'Dépense non trouvée' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('justificatif') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'justificatifs');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(sanitizeFilename(file.name));
    const filename = `depense-${id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update depense with justificatif path
    const publicPath = `/uploads/justificatifs/${filename}`;
    await prisma.depense.update({
      where: { id },
      data: { justificatif: publicPath },
    });

    return NextResponse.json({ justificatif: publicPath });
  } catch (error) {
    console.error('Error uploading justificatif:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
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

    await prisma.depense.update({
      where: { id },
      data: { justificatif: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing justificatif:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
