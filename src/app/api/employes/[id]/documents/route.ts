import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateDocumentUpload, sanitizeFilename } from '@/lib/upload-security';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const documents = await prisma.documentEmploye.findMany({
      where: { employeId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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

    // Verify employee exists
    const employe = await prisma.employe.findUnique({ where: { id } });
    if (!employe) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'autre';
    const notes = formData.get('notes') as string;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    // Validate file type and size
    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'employes', id);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(sanitizeFilename(file.name));
    const timestamp = Date.now();
    const filename = `${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database
    const document = await prisma.documentEmploye.create({
      data: {
        employeId: id,
        nom: file.name,
        type,
        fichier: `/uploads/employes/${id}/${filename}`,
        mimeType: file.type,
        taille: file.size,
        notes: notes || null,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
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

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID requis' }, { status: 400 });
    }

    await prisma.documentEmploye.delete({ where: { id: documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
