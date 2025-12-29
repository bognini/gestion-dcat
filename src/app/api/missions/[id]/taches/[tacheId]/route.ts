import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tacheId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { tacheId } = await params;
    const data = await request.json();

    const tache = await prisma.tacheMission.update({
      where: { id: tacheId },
      data: {
        intitule: data.intitule,
        description: data.description,
        statut: data.statut,
        dureeMinutes: data.dureeMinutes,
        responsableId: data.responsableId,
      },
      include: {
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(tache);
  } catch (error) {
    console.error('Error updating mission tache:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tacheId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { tacheId } = await params;

    await prisma.tacheMission.delete({
      where: { id: tacheId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mission tache:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
