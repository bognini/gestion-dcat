import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextReference, pad } from '@/lib/sequence';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';

async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  return nextReference(
    `fiche-mission:${year}`,
    (n) => `FM-${year}-${pad(n)}`,
    async (ref) => !!(await prisma.ficheMission.findUnique({ where: { reference: ref }, select: { id: true } }))
  );
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

    const denied = requirePermission(user, ['administration', 'technique'], 'write');
    if (denied) return denied;

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

    // Generate unique reference
    let reference = await generateReference();
    let exists = await prisma.ficheMission.findUnique({ where: { reference } });
    while (exists) {
      reference = await generateReference();
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
        participants: data.participantIds?.length > 0 ? {
          create: data.participantIds.map((userId: string) => ({
            utilisateurId: userId,
          })),
        } : undefined,
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
