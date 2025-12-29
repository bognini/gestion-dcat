import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');

    const partenaires = await prisma.partenaire.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          } : {},
          type ? { type } : {},
        ],
      },
      orderBy: { nom: 'asc' },
    });

    return NextResponse.json(partenaires);
  } catch (error) {
    console.error('Error fetching partenaires:', error);
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

    const partenaire = await prisma.partenaire.create({
      data: {
        nom: data.nom,
        type: data.type || 'client',
        secteur: data.secteur,
        adresse: data.adresse,
        ville: data.ville,
        pays: data.pays,
        email: data.email,
        telephone1: data.telephone1,
        telephone2: data.telephone2,
        siteWeb: data.siteWeb,
        notes: data.notes,
      },
    });

    return NextResponse.json(partenaire);
  } catch (error) {
    console.error('Error creating partenaire:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
