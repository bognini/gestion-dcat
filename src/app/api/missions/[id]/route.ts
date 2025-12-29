import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const mission = await prisma.ficheMission.findUnique({
      where: { id },
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

    if (!mission) {
      return NextResponse.json({ error: 'Non trouvée' }, { status: 404 });
    }

    return NextResponse.json(mission);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    if (data.participantIds) {
      await prisma.missionParticipant.deleteMany({ where: { missionId: id } });

      if (data.participantIds.length > 0) {
        await prisma.missionParticipant.createMany({
          data: data.participantIds.map((userId: string) => ({
            missionId: id,
            utilisateurId: userId,
          })),
        });
      }
    }

    const mission = await prisma.ficheMission.update({
      where: { id },
      data: {
        titre: data.titre,
        description: data.description || null,
        projetId: data.projetId || null,
        destination: data.destination,
        dateDepart: data.dateDepart ? new Date(data.dateDepart) : undefined,
        dateRetour: data.dateRetour ? new Date(data.dateRetour) : null,
        statut: data.statut,
        budget: data.budget || null,
        depensesReelles: data.depensesReelles || null,
        objectifs: data.objectifs || null,
        notes: data.notes || null,
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
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.ficheMission.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
