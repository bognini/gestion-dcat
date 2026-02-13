import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateDocumentUpload } from '@/lib/upload-security';

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

    // Verify movement exists
    const mouvement = await prisma.mouvementStock.findUnique({ where: { id } });
    if (!mouvement) {
      return NextResponse.json({ error: 'Mouvement non trouvé' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await prisma.mouvementStock.update({
      where: { id },
      data: {
        justificatifFilename: file.name,
        justificatifMime: file.type,
        justificatifData: buffer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading justificatif:', error);
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}

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

    const mouvement = await prisma.mouvementStock.findUnique({
      where: { id },
      select: {
        justificatifFilename: true,
        justificatifMime: true,
        justificatifData: true,
      },
    });

    if (!mouvement || !mouvement.justificatifData) {
      return NextResponse.json({ error: 'Aucun justificatif' }, { status: 404 });
    }

    return new NextResponse(mouvement.justificatifData, {
      headers: {
        'Content-Type': mouvement.justificatifMime || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${mouvement.justificatifFilename}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching justificatif:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
