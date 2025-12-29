import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;

    const image = await prisma.produitImage.findUnique({
      where: { id: imageId, produitId: id },
    });

    if (!image || !image.data) {
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
    }

    return new NextResponse(image.data, {
      headers: {
        'Content-Type': image.mime || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
