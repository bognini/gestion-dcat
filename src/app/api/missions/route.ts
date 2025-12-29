import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

function generateReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `FM-${year}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const projetId = searchParams.get('projetId');
    const utilisateurId = searchParams.get('utilisateurId');

    const where: {
      statut?: string;
      projetId?: string;
      participants?: { some: { utilisateurId: string } };
    } = {};

    if (statut && statut !== 'all') where.statut = statut;
    if (projetId) where.projetId = projetId;
    if (utilisateurId) where.participants = { some: { utilisateurId } };

    const missions = await prisma.ficheMission.findMany({
      where,
      orderBy: { dateDepart: 'desc' },
      include: {
        projet: {
          select: { id: true, nom: true },
        },
        participants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, role: true },
            },
          },
        },
      },
    });

    return NextResponse.json(missions);
  } catch (error) {
    console.error('Error fetching missions:', error);
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

    if (!data.titre?.trim()) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }
    if (!data.destination?.trim()) {
      return NextResponse.json({ error: 'Destination requise' }, { status: 400 });
    }
    if (!data.dateDepart) {
      return NextResponse.json({ error: 'Date de départ requise' }, { status: 400 });
    }

    let reference = generateReference();
    let exists = await prisma.ficheMission.findUnique({ where: { reference } });
    while (exists) {
      reference = generateReference();
      exists = await prisma.ficheMission.findUnique({ where: { reference } });
    }

    const mission = await prisma.ficheMission.create({
      data: {
        reference,
        titre: data.titre.trim(),
        description: data.description?.trim() || null,
        projetId: data.projetId || null,
        destination: data.destination.trim(),
        dateDepart: new Date(data.dateDepart),
        dateRetour: data.dateRetour ? new Date(data.dateRetour) : null,
        statut: 'planifiee',
        budget: data.budget || null,
        objectifs: data.objectifs?.trim() || null,
        notes: data.notes?.trim() || null,
        participants: Array.isArray(data.participantIds) && data.participantIds.length > 0
          ? {
              create: data.participantIds.map((userId: string) => ({
                utilisateurId: userId,
              })),
            }
          : undefined,
      },
      include: {
        projet: {
          select: { id: true, nom: true },
        },
        participants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, role: true },
            },
          },
        },
      },
    });

    return NextResponse.json(mission);
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
