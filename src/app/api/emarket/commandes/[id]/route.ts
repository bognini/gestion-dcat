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

    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
          },
        },
        lignes: {
          include: {
            produit: {
              select: {
                id: true,
                nom: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    return NextResponse.json(commande);
  } catch (error) {
    console.error('Error fetching commande:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
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

    const commande = await prisma.commande.update({
      where: { id },
      data: {
        statut: data.statut,
        modePaiement: data.modePaiement,
        adresseLivraison: data.adresseLivraison,
        notes: data.notes,
      },
    });

    return NextResponse.json(commande);
  } catch (error) {
    console.error('Error updating commande:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
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

    // CommandeLigne has onDelete: Cascade, so just delete commande
    await prisma.commande.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting commande:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
