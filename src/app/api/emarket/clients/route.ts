import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get('search');
    const includeInactive = request.nextUrl.searchParams.get('all') === 'true';

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        _count: {
          select: { commandes: true },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
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

    if (!data.nom?.trim() && !data.partenaireId) {
      return NextResponse.json({ error: 'Le nom ou un partenaire est requis' }, { status: 400 });
    }
    if (!data.telephone?.trim()) {
      return NextResponse.json({ error: 'Le téléphone est requis' }, { status: 400 });
    }

    // If partenaire selected, get partner name
    let clientNom = data.nom?.trim() || '';
    if (data.partenaireId) {
      const partenaire = await prisma.partenaire.findUnique({
        where: { id: data.partenaireId },
        select: { nom: true },
      });
      if (partenaire) clientNom = partenaire.nom;
    }

    const client = await prisma.client.create({
      data: {
        type: data.partenaireId ? 'partenaire' : 'particulier',
        nom: clientNom,
        prenom: data.prenom?.trim() || null,
        email: data.email?.trim() || null,
        telephone: data.telephone.trim(),
        adresse: data.adresse?.trim() || null,
        ville: data.ville?.trim() || null,
        pays: data.pays?.trim() || "Côte d'Ivoire",
        partenaireId: data.partenaireId || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
