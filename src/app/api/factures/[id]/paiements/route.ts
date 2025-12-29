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

    const { id } = await params;
    const data = await request.json();

    // Get facture
    const facture = await prisma.facture.findUnique({
      where: { id },
      select: { id: true, resteAPayer: true, montantPaye: true, totalTTC: true },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    const montant = parseFloat(data.montant);
    if (!montant || montant <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    if (montant > facture.resteAPayer) {
      return NextResponse.json({ error: 'Montant supérieur au reste à payer' }, { status: 400 });
    }

    // Generate reference: PAY-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.paiement.count({
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const reference = `PAY-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create payment
    const paiement = await prisma.paiement.create({
      data: {
        reference,
        factureId: id,
        montant,
        modePaiement: data.modePaiement || 'especes',
        notes: data.notes || null,
        createdById: user.id,
      },
    });

    // Update facture
    const newMontantPaye = facture.montantPaye + montant;
    const newResteAPayer = facture.totalTTC - newMontantPaye;
    let newStatut = 'envoyee';
    if (newResteAPayer <= 0) {
      newStatut = 'payee';
    } else if (newMontantPaye > 0) {
      newStatut = 'payee_partiellement';
    }

    await prisma.facture.update({
      where: { id },
      data: {
        montantPaye: newMontantPaye,
        resteAPayer: newResteAPayer,
        statut: newStatut,
      },
    });

    return NextResponse.json(paiement);
  } catch (error) {
    console.error('Error creating paiement:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
