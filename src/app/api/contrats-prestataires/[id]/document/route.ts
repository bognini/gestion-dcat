import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateDocumentUpload, sanitizeFilename } from '@/lib/upload-security';
import { writeFile, mkdir, unlink } from 'fs/promises';
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

    const contrat = await prisma.contratPrestataire.findUnique({ where: { id } });
    if (!contrat) {
      return NextResponse.json({ error: 'Contrat non trouvé' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('document') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contrats-prestataires');
    await mkdir(uploadDir, { recursive: true });

    // Delete old file if exists
    if (contrat.documentPath) {
      const oldFilePath = path.join(process.cwd(), 'public', contrat.documentPath);
      try {
        await unlink(oldFilePath);
      } catch {
        // File might not exist, ignore
      }
    }

    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate unique filename
    const ext = path.extname(sanitizeFilename(file.name));
    const filename = `${id}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Update contract with document info
    const updatedContrat = await prisma.contratPrestataire.update({
      where: { id },
      data: {
        documentPath: `/uploads/contrats-prestataires/${filename}`,
        documentName: file.name,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(updatedContrat);
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

    const { id } = await params;

    const contrat = await prisma.contratPrestataire.findUnique({ where: { id } });
    if (!contrat) {
      return NextResponse.json({ error: 'Contrat non trouvé' }, { status: 404 });
    }

    if (contrat.documentPath) {
      const filePath = path.join(process.cwd(), 'public', contrat.documentPath);
      try {
        await unlink(filePath);
      } catch {
        // File might not exist
      }
    }

    const updatedContrat = await prisma.contratPrestataire.update({
      where: { id },
      data: {
        documentPath: null,
        documentName: null,
      },
    });

    return NextResponse.json(updatedContrat);
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
