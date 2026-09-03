import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextReference, pad } from '@/lib/sequence';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';

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

    const denied = requirePermission(user, 'technique', 'write');
    if (denied) return denied;

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
    const reference = await nextReference(
      'projet',
      (n) => `PRJ-${pad(n)}`,
      async (ref) => !!(await prisma.projet.findUnique({ where: { reference: ref }, select: { id: true } }))
    );

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
