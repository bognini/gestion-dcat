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

    const { id: missionId } = await params;

    const taches = await prisma.tacheMission.findMany({
      where: { missionId },
      include: {
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(taches);
  } catch (error) {
    console.error('Error fetching mission taches:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: missionId } = await params;
    const data = await request.json();

    const tache = await prisma.tacheMission.create({
      data: {
        intitule: data.intitule,
        description: data.description || null,
        dureeMinutes: data.dureeMinutes || null,
        missionId,
        responsableId: data.responsableId || null,
      },
      include: {
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(tache);
  } catch (error) {
    console.error('Error creating mission tache:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
