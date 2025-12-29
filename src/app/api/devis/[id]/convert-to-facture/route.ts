import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: devisId } = await params;

    // Fetch the devis with its lines
    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
        },
      },
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
    }

    if (devis.statut !== 'accepte') {
      return NextResponse.json({ error: 'Le devis doit être accepté pour être converti en facture' }, { status: 400 });
    }

    // Check if facture already exists for this devis
    const existingFacture = await prisma.facture.findFirst({
      where: { devisId },
    });

    if (existingFacture) {
      return NextResponse.json({ error: 'Une facture existe déjà pour ce devis', factureId: existingFacture.id }, { status: 400 });
    }

    // Generate facture reference
    const year = new Date().getFullYear();
    const lastFacture = await prisma.facture.findFirst({
      where: {
        reference: {
          startsWith: `FAC-${year}`,
        },
      },
      orderBy: { reference: 'desc' },
    });

    let nextNumber = 1;
    if (lastFacture) {
      const match = lastFacture.reference.match(/FAC-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const reference = `FAC-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create the facture
    const facture = await prisma.facture.create({
      data: {
        reference,
        date: new Date(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        clientNom: devis.clientNom,
        clientAdresse: devis.clientAdresse,
        clientVille: devis.clientVille,
        clientPays: devis.clientPays,
        clientEmail: devis.clientEmail,
        clientTelephone: devis.clientTelephone,
        objet: devis.objet,
        totalHT: devis.totalHT,
        totalTTC: devis.totalTTC,
        montantPaye: 0,
        resteAPayer: devis.totalTTC,
        statut: 'brouillon',
        devisId,
        createdById: user.id,
        lignes: {
          create: devis.lignes.map((ligne) => ({
            ordre: ligne.ordre,
            reference: ligne.reference,
            designation: ligne.designation,
            details: ligne.details,
            quantite: ligne.quantite,
            unite: ligne.unite,
            prixUnitaire: ligne.prixUnitaire,
            montant: ligne.montant,
          })),
        },
      },
    });

    // Update devis status to "facturé"
    await prisma.devis.update({
      where: { id: devisId },
      data: { statut: 'facture' },
    });

    return NextResponse.json(facture);
  } catch (error) {
    console.error('Error converting devis to facture:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
