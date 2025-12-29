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

    const remboursement = await prisma.remboursement.findUnique({
      where: { id },
      include: {
        partenaire: {
          select: { id: true, nom: true, telephone1: true, email: true },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
        },
      },
    });

    if (!remboursement) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }

    return NextResponse.json(remboursement);
  } catch (error) {
    console.error('Error:', error);
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

    // If adding a payment
    if (data.addPaiement) {
      const remboursement = await prisma.remboursement.findUnique({
        where: { id },
      });

      if (!remboursement) {
        return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
      }

      const newMontantPaye = remboursement.montantPaye + data.addPaiement.montant;
      let newStatut = remboursement.statut;
      
      if (newMontantPaye >= remboursement.montantTotal) {
        newStatut = 'solde';
      } else if (newMontantPaye > 0) {
        newStatut = 'partiel';
      }

      const updated = await prisma.remboursement.update({
        where: { id },
        data: {
          montantPaye: newMontantPaye,
          statut: newStatut,
          paiements: {
            create: {
              montant: data.addPaiement.montant,
              modePaiement: data.addPaiement.modePaiement,
              reference: data.addPaiement.reference || null,
              notes: data.addPaiement.notes || null,
              datePaiement: data.addPaiement.datePaiement 
                ? new Date(data.addPaiement.datePaiement) 
                : new Date(),
            },
          },
        },
        include: {
          partenaire: {
            select: { id: true, nom: true },
          },
          paiements: {
            orderBy: { datePaiement: 'desc' },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // Regular update
    const updated = await prisma.remboursement.update({
      where: { id },
      data: {
        motif: data.motif,
        reference: data.reference || null,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        statut: data.statut,
        notes: data.notes || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error:', error);
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

    await prisma.remboursement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
