import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeId = searchParams.get('employeId');

    const where = employeId ? { employeId } : {};

    const fiches = await prisma.ficheTransport.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true, poste: true },
        },
        lignes: {
          include: {
            partenaire: {
              select: { id: true, nom: true },
            },
          },
        },
      },
    });

    return NextResponse.json(fiches);
  } catch (error) {
    console.error('Error fetching fiches transport:', error);
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

    if (!data.employeId) {
      return NextResponse.json({ error: 'Employé requis' }, { status: 400 });
    }

    if (!data.lignes || data.lignes.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne requise' }, { status: 400 });
    }

    // Calculate total cost
    const totalCout = data.lignes.reduce((sum: number, ligne: { cout: number }) => sum + (ligne.cout || 0), 0);

    interface LigneData {
      depart: string;
      arrivee: string;
      typeClient: string;
      partenaireId?: string | null;
      particulierNom?: string | null;
      cout: number;
    }

    const fiche = await prisma.ficheTransport.create({
      data: {
        employeId: data.employeId,
        date: data.date ? new Date(data.date) : new Date(),
        totalCout,
        statut: 'impaye',
        lignes: {
          create: data.lignes.map((ligne: LigneData) => ({
            depart: ligne.depart,
            arrivee: ligne.arrivee,
            typeClient: ligne.typeClient,
            partenaireId: ligne.partenaireId || null,
            particulierNom: ligne.particulierNom || null,
            cout: ligne.cout,
          })),
        },
      },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true },
        },
        lignes: {
          include: {
            partenaire: {
              select: { id: true, nom: true },
            },
          },
        },
      },
    });

    return NextResponse.json(fiche);
  } catch (error) {
    console.error('Error creating fiche transport:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
