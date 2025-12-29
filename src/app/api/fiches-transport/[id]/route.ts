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

    const fiche = await prisma.ficheTransport.findUnique({
      where: { id },
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

    if (!fiche) {
      return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 });
    }

    return NextResponse.json(fiche);
  } catch (error) {
    console.error('Error fetching fiche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

interface LigneData {
  depart: string;
  arrivee: string;
  typeClient: string;
  partenaireId?: string | null;
  particulierNom?: string | null;
  cout: number;
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

    // If only updating status (comptable action)
    if (data.statut && !data.lignes) {
      const fiche = await prisma.ficheTransport.update({
        where: { id },
        data: {
          statut: data.statut,
          commentaire: data.commentaire || null,
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
    }

    // Full update (employee editing their own fiche)
    if (data.lignes) {
      const totalCout = data.lignes.reduce((sum: number, ligne: { cout: number }) => sum + (ligne.cout || 0), 0);

      // Delete existing lignes and recreate
      await prisma.ligneTransport.deleteMany({ where: { ficheId: id } });

      const fiche = await prisma.ficheTransport.update({
        where: { id },
        data: {
          date: data.date ? new Date(data.date) : undefined,
          totalCout,
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
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  } catch (error) {
    console.error('Error updating fiche:', error);
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

    await prisma.ficheTransport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fiche:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
