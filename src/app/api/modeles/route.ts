import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const marqueId = request.nextUrl.searchParams.get('marqueId');
    const familleId = request.nextUrl.searchParams.get('familleId');

    const where: { marqueId?: string; familleId?: string } = {};
    if (marqueId) where.marqueId = marqueId;
    if (familleId) where.familleId = familleId;

    const modeles = await prisma.modele.findMany({
      where,
      orderBy: { nom: 'asc' },
      include: {
        marque: { select: { id: true, nom: true } },
        famille: { 
          select: { 
            id: true, 
            nom: true, 
            categorieId: true,
            categorie: { select: { id: true, nom: true } } 
          } 
        },
        _count: { select: { produits: true } },
      },
    });

    return NextResponse.json(modeles);
  } catch (error) {
    console.error('Error fetching modeles:', error);
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
    if (!data.marqueId) {
      return NextResponse.json({ error: 'La marque est requise' }, { status: 400 });
    }
    if (!data.familleId) {
      return NextResponse.json({ error: 'La famille est requise' }, { status: 400 });
    }

    const existing = await prisma.modele.findFirst({
      where: {
        nom: { equals: data.nom, mode: 'insensitive' },
        marqueId: data.marqueId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ce modèle existe déjà pour cette marque' }, { status: 400 });
    }

    const modele = await prisma.modele.create({
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        marqueId: data.marqueId,
        familleId: data.familleId,
      },
      include: {
        marque: { select: { id: true, nom: true } },
        famille: { 
          select: { 
            id: true, 
            nom: true,
            categorieId: true,
            categorie: { select: { id: true, nom: true } } 
          } 
        },
      },
    });

    return NextResponse.json(modele);
  } catch (error) {
    console.error('Error creating modele:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
