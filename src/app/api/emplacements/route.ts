import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const emplacements = await prisma.emplacement.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { produits: true } },
      },
    });

    return NextResponse.json(emplacements);
  } catch (error) {
    console.error('Error fetching emplacements:', error);
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

    const existing = await prisma.emplacement.findFirst({
      where: { nom: { equals: data.nom, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cet emplacement existe déjà' }, { status: 400 });
    }

    const emplacement = await prisma.emplacement.create({
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        bureau: data.bureau || null,
        armoire: data.armoire || null,
        aile: data.aile || null,
        etagere: data.etagere || null,
      },
    });

    return NextResponse.json(emplacement);
  } catch (error) {
    console.error('Error creating emplacement:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
