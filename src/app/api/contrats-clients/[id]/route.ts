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

    const contrat = await prisma.contratClient.findUnique({
      where: { id },
      include: {
        partenaire: {
          select: { id: true, nom: true, telephone1: true, email: true },
        },
        echeances: {
          orderBy: { mois: 'asc' },
        },
      },
    });

    if (!contrat) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }

    return NextResponse.json(contrat);
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

    // If generating echeances
    if (data.generateEcheances) {
      const contrat = await prisma.contratClient.findUnique({
        where: { id },
      });

      if (!contrat) {
        return NextResponse.json({ error: 'Contrat non trouvé' }, { status: 404 });
      }

      const months = data.generateEcheances.months || 12;
      const startDate = new Date(data.generateEcheances.startDate || contrat.dateDebut);
      const montant = contrat.montantMensuel || 0;

      const echeancesToCreate = [];
      for (let i = 0; i < months; i++) {
        const mois = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        echeancesToCreate.push({
          contratId: id,
          mois,
          montant,
          statut: 'a_payer',
        });
      }

      await prisma.echeanceContrat.createMany({
        data: echeancesToCreate,
        skipDuplicates: true,
      });

      const updated = await prisma.contratClient.findUnique({
        where: { id },
        include: {
          partenaire: { select: { id: true, nom: true } },
          echeances: { orderBy: { mois: 'asc' } },
        },
      });

      return NextResponse.json(updated);
    }

    // If marking echeance as paid
    if (data.payEcheance) {
      await prisma.echeanceContrat.update({
        where: { id: data.payEcheance.echeanceId },
        data: {
          statut: 'paye',
          datePaiement: data.payEcheance.datePaiement 
            ? new Date(data.payEcheance.datePaiement) 
            : new Date(),
          reference: data.payEcheance.reference || null,
          notes: data.payEcheance.notes || null,
        },
      });

      const updated = await prisma.contratClient.findUnique({
        where: { id },
        include: {
          partenaire: { select: { id: true, nom: true } },
          echeances: { orderBy: { mois: 'asc' } },
        },
      });

      return NextResponse.json(updated);
    }

    // Regular update
    const contrat = await prisma.contratClient.update({
      where: { id },
      data: {
        titre: data.titre,
        type: data.type,
        montantMensuel: data.montantMensuel || null,
        montantAnnuel: data.montantAnnuel || null,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        modePaiement: data.modePaiement,
        jourPaiement: data.jourPaiement || null,
        statut: data.statut,
        description: data.description || null,
        notes: data.notes || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        echeances: {
          orderBy: { mois: 'asc' },
        },
      },
    });

    return NextResponse.json(contrat);
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

    await prisma.contratClient.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
