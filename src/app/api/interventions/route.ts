import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const statut = request.nextUrl.searchParams.get('statut');
    const type = request.nextUrl.searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (statut && statut !== 'all') where.statut = statut;
    if (type && type !== 'all') where.typeMaintenance = type;

    const interventions = await prisma.intervention.findMany({
      where,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
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
    if (!data.partenaireId) {
      return NextResponse.json({ error: 'Le partenaire est requis' }, { status: 400 });
    }
    if (!data.date) {
      return NextResponse.json({ error: 'La date est requise' }, { status: 400 });
    }
    if (!data.problemeSignale?.trim()) {
      return NextResponse.json({ error: 'Le problème signalé est requis' }, { status: 400 });
    }
    if (!data.typeMaintenance) {
      return NextResponse.json({ error: 'Le type de maintenance est requis' }, { status: 400 });
    }

    // Generate reference with year format: YYYY-XXXX
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const count = await prisma.intervention.count({
      where: {
        createdAt: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });
    const reference = `${year}-${String(count + 1).padStart(4, '0')}`;

    const intervention = await prisma.intervention.create({
      data: {
        reference,
        date: new Date(data.date),
        partenaireId: data.partenaireId,
        problemeSignale: data.problemeSignale.trim(),
        typeMaintenance: data.typeMaintenance,
        typeDefaillance: data.typeDefaillance || null,
        causeDefaillance: data.causeDefaillance || null,
        modeIntervention: data.modeIntervention || null,
        lieu: data.lieu?.trim() || null,
        dureeMinutes: data.dureeMinutes ? parseInt(data.dureeMinutes) : null,
        rapport: data.rapport?.trim() || null,
        recommandations: data.recommandations?.trim() || null,
        statut: data.statut || 'a_faire',
        intervenants: data.intervenantIds?.length > 0 ? {
          create: data.intervenantIds.map((userId: string) => ({
            userId,
          })),
        } : undefined,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
      },
    });

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
