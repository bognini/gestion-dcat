import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const produit = await prisma.produit.findUnique({
      where: { id, isPublished: true },
      select: {
        id: true,
        nom: true,
        description: true,
        sku: true,
        prixVente: true,
        prixVenteMin: true,
        promoPrice: true,
        promoStart: true,
        promoEnd: true,
        quantite: true,
        poids: true,
        couleur: true,
        isFeatured: true,
        categorie: {
          select: { id: true, nom: true },
        },
        marque: {
          select: { id: true, nom: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        },
      },
    });

    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Add image URLs
    const produitWithImages = {
      ...produit,
      imageUrls: produit.images.map(img => `/api/produits/${produit.id}/images/${img.id}`),
      images: undefined,
    };

    return NextResponse.json(produitWithImages);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
