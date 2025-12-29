import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get('search') || '';

    const fournisseurs = await prisma.fournisseur.findMany({
      where: search ? {
        OR: [
          { nom: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { mouvements: true } },
      },
    });

    return NextResponse.json(fournisseurs);
  } catch (error) {
    console.error('Error fetching fournisseurs:', error);
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

    const existing = await prisma.fournisseur.findFirst({
      where: { nom: { equals: data.nom, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ce fournisseur existe déjà' }, { status: 400 });
    }

    const fournisseur = await prisma.fournisseur.create({
      data: {
        nom: data.nom.trim(),
        contact: data.contact?.trim() || null,
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        adresse: data.adresse?.trim() || null,
      },
    });

    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('Error creating fournisseur:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
