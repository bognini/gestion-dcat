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

    const facture = await prisma.facture.findUnique({
      where: { id },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
          include: {
            produit: {
              select: { id: true, nom: true, sku: true },
            },
          },
        },
        partenaire: {
          select: { id: true, nom: true },
        },
        devis: {
          select: { id: true, reference: true },
        },
        paiements: {
          orderBy: { date: 'desc' },
        },
        createdBy: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    return NextResponse.json(facture);
  } catch (error) {
    console.error('Error fetching facture:', error);
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

    const facture = await prisma.facture.update({
      where: { id },
      data: {
        clientNom: data.clientNom,
        clientAdresse: data.clientAdresse,
        clientVille: data.clientVille,
        clientPays: data.clientPays,
        clientEmail: data.clientEmail,
        clientTelephone: data.clientTelephone,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        objet: data.objet,
        statut: data.statut,
        notes: data.notes,
        totalHT: data.totalHT,
        totalTTC: data.totalTTC || data.totalHT,
      },
    });

    // Update lignes if provided
    if (data.lignes) {
      await prisma.factureLigne.deleteMany({ where: { factureId: id } });
      await prisma.factureLigne.createMany({
        data: data.lignes.map((l: {
          ordre: number;
          produitId?: string;
          reference: string;
          designation: string;
          details?: string;
          quantite: number;
          unite: string;
          prixUnitaire: number;
          montant: number;
        }) => ({
          factureId: id,
          ordre: l.ordre,
          produitId: l.produitId || null,
          reference: l.reference,
          designation: l.designation,
          details: l.details || null,
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaire: l.prixUnitaire,
          montant: l.montant,
        })),
      });
    }

    return NextResponse.json(facture);
  } catch (error) {
    console.error('Error updating facture:', error);
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

    await prisma.facture.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting facture:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
