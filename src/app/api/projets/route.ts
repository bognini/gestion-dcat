import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const etat = request.nextUrl.searchParams.get('etat');
    const categorie = request.nextUrl.searchParams.get('categorie');

    const where: Record<string, unknown> = {};
    if (etat && etat !== 'all') where.etat = etat;
    if (categorie && categorie !== 'all') where.categorie = categorie;

    const projets = await prisma.projet.findMany({
      where,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
        _count: {
          select: { operations: true, mouvements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projets);
  } catch (error) {
    console.error('Error fetching projets:', error);
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

    // Validate required fields
    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom du projet est requis' }, { status: 400 });
    }
    if (!data.partenaireId) {
      return NextResponse.json({ error: 'Le partenaire est requis' }, { status: 400 });
    }
    if (!data.categorie) {
      return NextResponse.json({ error: 'La catégorie est requise' }, { status: 400 });
    }
    if (!data.type) {
      return NextResponse.json({ error: 'Le type est requis' }, { status: 400 });
    }

    // Generate reference
    const count = await prisma.projet.count();
    const reference = `PRJ-${String(count + 1).padStart(4, '0')}`;

    const projet = await prisma.projet.create({
      data: {
        nom: data.nom.trim(),
        reference,
        partenaireId: data.partenaireId,
        categorie: data.categorie,
        type: data.type,
        devisEstimatif: data.devisEstimatif ? parseFloat(data.devisEstimatif) : null,
        dureeJours: data.dureeJours ? parseInt(data.dureeJours) : null,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
        dateFinEstimative: data.dateFinEstimative ? new Date(data.dateFinEstimative) : null,
        lieu: data.lieu?.trim() || null,
        responsableId: data.responsableId || null,
        description: data.description?.trim() || null,
        priorite: data.priorite || 'moyenne',
        etat: data.etat || 'planifie',
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(projet);
  } catch (error) {
    console.error('Error creating projet:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
