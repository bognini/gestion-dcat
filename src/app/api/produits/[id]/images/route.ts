import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { validateImageUpload } from '@/lib/upload-security';

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

    const images = await prisma.produitImage.findMany({
      where: { produitId: id },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        filename: true,
        mime: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
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

    // Verify product exists
    const produit = await prisma.produit.findUnique({ where: { id } });
    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const formData = await request.formData();
    const createdImages = [];

    // Get current max sort order
    const maxSortOrder = await prisma.produitImage.aggregate({
      where: { produitId: id },
      _max: { sortOrder: true },
    });
    let sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

    // Process each image
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        const file = value;

        const validation = validateImageUpload(file);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const image = await prisma.produitImage.create({
          data: {
            produitId: id,
            filename: file.name,
            mime: file.type,
            data: buffer,
            sortOrder: sortOrder++,
          },
          select: {
            id: true,
            filename: true,
            mime: true,
            sortOrder: true,
          },
        });

        createdImages.push(image);
      }
    }

    return NextResponse.json(createdImages);
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const { imageOrder } = await request.json();

    // Update sort order for each image
    for (const item of imageOrder) {
      await prisma.produitImage.update({
        where: { id: item.id, produitId: id },
        data: { sortOrder: item.sortOrder },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating image order:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
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
    const { imageId } = await request.json();

    await prisma.produitImage.delete({
      where: { id: imageId, produitId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
