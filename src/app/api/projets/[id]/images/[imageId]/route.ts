import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { imageId } = await params;

    const image = await prisma.projetImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
    }

    return new NextResponse(image.fichier, {
      headers: {
        'Content-Type': image.mime,
        'Content-Disposition': `inline; filename="${image.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { imageId } = await params;

    await prisma.projetImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
