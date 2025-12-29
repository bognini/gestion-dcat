import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await prisma.categorie.findMany({
      where: {
        produits: {
          some: {
            isPublished: true,
            quantite: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        nom: true,
        _count: {
          select: {
            produits: {
              where: {
                isPublished: true,
                quantite: { gt: 0 },
              },
            },
          },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
