import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { documentId } = await params;

    const document = await prisma.interventionDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    return new NextResponse(document.fichier, {
      headers: {
        'Content-Type': document.mime,
        'Content-Disposition': `attachment; filename="${document.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { documentId } = await params;

    await prisma.interventionDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
