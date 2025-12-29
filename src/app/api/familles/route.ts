import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categorieId = searchParams.get('categorieId');

    const where = categorieId ? { categorieId } : {};

    const familles = await prisma.famille.findMany({
      where,
      orderBy: { nom: 'asc' },
      include: {
        categorie: {
          select: { id: true, nom: true },
        },
        _count: {
          select: { produits: true },
        },
      },
    });

    return NextResponse.json(familles);
  } catch (error) {
    console.error('Error fetching familles:', error);
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
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    if (!data.categorieId) {
      return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 });
    }

    // Check if famille already exists in this category
    const existing = await prisma.famille.findFirst({
      where: {
        nom: data.nom.trim(),
        categorieId: data.categorieId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cette famille existe déjà dans cette catégorie' }, { status: 400 });
    }

    const famille = await prisma.famille.create({
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        categorieId: data.categorieId,
      },
      include: {
        categorie: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(famille);
  } catch (error) {
    console.error('Error creating famille:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
