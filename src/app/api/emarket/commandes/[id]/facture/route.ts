import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextReference, pad } from '@/lib/sequence';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const denied = requirePermission(user, ['marketing', 'finance'], 'write');
    if (denied) return denied;

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
            partenaireId: true,
          },
        },
        lignes: {
          include: {
            produit: {
              select: { id: true, sku: true },
            },
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Interprétation: "validée" = commande confirmée ou au-delà (pas en_attente/annulee)
    if (commande.statut === 'en_attente' || commande.statut === 'annulee') {
      return NextResponse.json(
        { error: 'La commande doit être validée avant de créer une facture' },
        { status: 400 }
      );
    }

    const marker = `EMARKET_COMMANDE_ID:${commande.id}`;
    const existing = await prisma.facture.findFirst({
      where: {
        notes: {
          contains: marker,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ id: existing.id, alreadyExists: true });
    }

    // Generate unique reference: FAC-YYYY-XXXX
    const year = new Date().getFullYear();
    const reference = await nextReference(
      `facture:${year}`,
      (n) => `FAC-${year}-${pad(n)}`,
      async (ref) => !!(await prisma.facture.findUnique({ where: { reference: ref }, select: { id: true } }))
    );

    const clientNom = `${commande.client.prenom ? `${commande.client.prenom} ` : ''}${commande.client.nom}`.trim();

    const lignes = commande.lignes.map((l, idx) => ({
      ordre: idx,
      produitId: l.produitId,
      reference: l.produit?.sku || 'REF-',
      designation: l.designation,
      details: null as string | null,
      quantite: l.quantite,
      unite: 'u',
      prixUnitaire: l.prixUnitaire,
      montant: l.montant,
    }));

    const totalHT = lignes.reduce((sum, l) => sum + (l.montant || 0), 0);
    const totalTTC = totalHT;

    const facture = await prisma.facture.create({
      data: {
        reference,
        clientNom,
        clientAdresse: commande.adresseLivraison || null,
        clientVille: null,
        clientPays: 'Côte d\'Ivoire',
        clientEmail: commande.client.email || null,
        clientTelephone: commande.client.telephone || null,
        partenaireId: commande.client.partenaireId || null,
        devisId: null,
        dateEcheance: null,
        objet: `Commande ${commande.reference}`,
        totalHT,
        totalTTC,
        resteAPayer: totalTTC,
        statut: 'brouillon',
        notes: `${marker}\nCommande: ${commande.reference}\nMode paiement: ${commande.modePaiement || '-'}\n${commande.notes || ''}`.trim(),
        createdById: user.id,
        lignes: {
          create: lignes.map((l) => ({
            ordre: l.ordre,
            produitId: l.produitId,
            reference: l.reference,
            designation: l.designation,
            details: l.details,
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaire: l.prixUnitaire,
            montant: l.montant,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: facture.id, alreadyExists: false });
  } catch (error) {
    console.error('Error creating facture from commande:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
