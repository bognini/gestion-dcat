import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const categories = await prisma.categorie.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { produits: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    // Check if category already exists
    const existing = await prisma.categorie.findFirst({
      where: { nom: { equals: data.nom, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 });
    }

    const categorie = await prisma.categorie.create({
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
      },
    });

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Error creating categorie:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
