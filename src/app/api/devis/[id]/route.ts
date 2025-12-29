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

    const devis = await prisma.devis.findUnique({
      where: { id },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
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
        partenaire: {
          select: {
            id: true,
            nom: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
    }

    return NextResponse.json(devis);
  } catch (error) {
    console.error('Error fetching devis:', error);
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

    // Update devis
    const devis = await prisma.devis.update({
      where: { id },
      data: {
        objet: data.objet,
        clientType: data.clientType,
        clientNom: data.clientNom,
        clientAdresse: data.clientAdresse,
        clientVille: data.clientVille,
        clientPays: data.clientPays,
        clientEmail: data.clientEmail,
        clientTelephone: data.clientTelephone,
        partenaireId: data.partenaireId || null,
        delaiLivraison: data.delaiLivraison,
        conditionLivraison: data.conditionLivraison,
        validiteOffre: data.validiteOffre,
        garantie: data.garantie,
        statut: data.statut,
        totalHT: data.totalHT,
        totalTTC: data.totalTTC || data.totalHT,
      },
    });

    // Update lignes if provided
    if (data.lignes) {
      // Delete existing lignes
      await prisma.devisLigne.deleteMany({ where: { devisId: id } });
      
      // Create new lignes
      await prisma.devisLigne.createMany({
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
          devisId: id,
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

    return NextResponse.json(devis);
  } catch (error) {
    console.error('Error updating devis:', error);
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

    await prisma.devis.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting devis:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
