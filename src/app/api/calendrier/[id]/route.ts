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

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            userId: true,
            utilisateur: {
              select: { prenom: true, nom: true },
            },
          },
        },
        createdBy: {
          select: { prenom: true, nom: true },
        },
      },
    });

    if (!evenement) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    return NextResponse.json(evenement);
  } catch (error) {
    console.error('Error fetching event:', error);
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

    const existing = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    const titre = typeof data.titre === 'string' ? data.titre.trim() : existing.titre;
    const type = typeof data.type === 'string' ? data.type.trim() : existing.type;
    const dateDebut = data.dateDebut ? new Date(data.dateDebut) : existing.dateDebut;
    const dateFin = data.dateFin ? new Date(data.dateFin) : existing.dateFin;

    if (!titre) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }

    if (dateFin < dateDebut) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    const participantIds = Array.isArray(data.participantIds)
      ? data.participantIds.filter((pid: unknown) => typeof pid === 'string' && pid.trim()).map((pid: string) => pid.trim())
      : null;

    // Update event
    const evenement = await prisma.evenement.update({
      where: { id },
      data: {
        titre,
        type,
        description: typeof data.description === 'string' ? data.description.trim() || null : existing.description,
        dateDebut,
        dateFin,
        journeeEntiere: typeof data.journeeEntiere === 'boolean' ? data.journeeEntiere : existing.journeeEntiere,
        lieu: typeof data.lieu === 'string' ? data.lieu.trim() || null : existing.lieu,
        couleur: typeof data.couleur === 'string' ? data.couleur.trim() || null : existing.couleur,
        rappel: typeof data.rappel === 'boolean' ? data.rappel : existing.rappel,
        rappelDelai: typeof data.rappelDelai === 'number' ? data.rappelDelai : existing.rappelDelai,
      },
    });

    // Update participants if provided
    if (participantIds !== null) {
      // Delete existing participants
      await prisma.evenementParticipant.deleteMany({
        where: { evenementId: id },
      });

      // Create new participants
      if (participantIds.length > 0) {
        await prisma.evenementParticipant.createMany({
          data: participantIds.map((userId: string) => ({
            evenementId: id,
            userId,
          })),
        });
      }
    }

    return NextResponse.json(evenement);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
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

    const existing = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    // Delete participants first
    await prisma.evenementParticipant.deleteMany({
      where: { evenementId: id },
    });

    // Delete the event
    await prisma.evenement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
