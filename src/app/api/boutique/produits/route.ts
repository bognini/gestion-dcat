import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const categorieId = searchParams.get('categorie');
    const marqueId = searchParams.get('marque');
    const featured = searchParams.get('featured') === 'true';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isPublished: true,
      quantite: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categorieId) {
      where.categorieId = categorieId;
    }

    if (marqueId) {
      where.marqueId = marqueId;
    }

    if (featured) {
      // "Promotions" page - only show products with active promo price
      where.promoPrice = { gt: 0 };
    }

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
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
          isFeatured: true,
          categorie: {
            select: { id: true, nom: true },
          },
          marque: {
            select: { id: true, nom: true },
          },
          images: {
            take: 6,
            orderBy: { sortOrder: 'asc' },
            select: { id: true },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.produit.count({ where }),
    ]);

    // Add image URL to each product
    let produitsWithImages = produits.map((p) => {
      const imageUrls = p.images.map((img) => `/api/produits/${p.id}/images/${img.id}`);
      return {
        ...p,
        imageUrl: imageUrls[0] || null,
        images: imageUrls,
      };
    });

    // If featured (promotions page), filter to only show products with valid promo
    // (promoPrice must be less than base price AND dates must be valid)
    if (featured) {
      produitsWithImages = produitsWithImages.filter((p) => {
        const basePrice = p.prixVenteMin || p.prixVente || 0;
        const now = new Date();
        const start = p.promoStart ? new Date(p.promoStart) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = p.promoEnd ? new Date(p.promoEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);
        const validDates = (!start || start <= now) && (!end || end >= now);
        
        return p.promoPrice && 
               p.promoPrice > 0 && 
               basePrice > 0 && 
               p.promoPrice < basePrice && 
               validDates;
      });
    }

    return NextResponse.json(produitsWithImages, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Limit': limit.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
