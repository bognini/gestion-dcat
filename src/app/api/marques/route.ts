import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const marques = await prisma.marque.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { produits: true, modeles: true } },
      },
    });

    return NextResponse.json(marques);
  } catch (error) {
    console.error('Error fetching marques:', error);
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

    const existing = await prisma.marque.findFirst({
      where: { nom: { equals: data.nom, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cette marque existe déjà' }, { status: 400 });
    }

    const marque = await prisma.marque.create({
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
      },
    });

    return NextResponse.json(marque);
  } catch (error) {
    console.error('Error creating marque:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
