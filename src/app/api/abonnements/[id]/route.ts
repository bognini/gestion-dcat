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

    const abonnement = await prisma.abonnement.findUnique({
      where: { id },
      include: {
        echeances: {
          orderBy: { dateEcheance: 'asc' },
        },
      },
    });

    if (!abonnement) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }

    return NextResponse.json(abonnement);
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

    // Mark echeance as paid
    if (data.payEcheance) {
      await prisma.echeanceAbonnement.update({
        where: { id: data.payEcheance.echeanceId },
        data: {
          statut: 'paye',
          datePaiement: data.payEcheance.datePaiement 
            ? new Date(data.payEcheance.datePaiement) 
            : new Date(),
          reference: data.payEcheance.reference || null,
        },
      });

      // Update next payment date
      const abonnement = await prisma.abonnement.findUnique({ where: { id } });
      if (abonnement) {
        let nextDate = new Date(abonnement.dateProchainePaiement || new Date());
        if (abonnement.periodicite === 'annuel') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        await prisma.abonnement.update({
          where: { id },
          data: { dateProchainePaiement: nextDate },
        });
      }

      const updated = await prisma.abonnement.findUnique({
        where: { id },
        include: { echeances: { orderBy: { dateEcheance: 'asc' } } },
      });

      return NextResponse.json(updated);
    }

    // Generate echeances
    if (data.generateEcheances) {
      const abonnement = await prisma.abonnement.findUnique({ where: { id } });
      if (!abonnement) {
        return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });
      }

      const count = data.generateEcheances.count || 12;
      const startDate = new Date(data.generateEcheances.startDate || abonnement.dateDebut);
      
      const echeancesToCreate = [];
      for (let i = 0; i < count; i++) {
        const dateEcheance = new Date(startDate);
        if (abonnement.periodicite === 'annuel') {
          dateEcheance.setFullYear(dateEcheance.getFullYear() + i);
        } else {
          dateEcheance.setMonth(dateEcheance.getMonth() + i);
        }
        
        echeancesToCreate.push({
          abonnementId: id,
          dateEcheance,
          montant: abonnement.montant,
          statut: 'a_payer',
        });
      }

      await prisma.echeanceAbonnement.createMany({
        data: echeancesToCreate,
        skipDuplicates: true,
      });

      const updated = await prisma.abonnement.findUnique({
        where: { id },
        include: { echeances: { orderBy: { dateEcheance: 'asc' } } },
      });

      return NextResponse.json(updated);
    }

    // Regular update
    const abonnement = await prisma.abonnement.update({
      where: { id },
      data: {
        nom: data.nom,
        type: data.type,
        fournisseur: data.fournisseur,
        montant: data.montant ? parseFloat(data.montant) : undefined,
        periodicite: data.periodicite,
        dateExpiration: data.dateExpiration ? new Date(data.dateExpiration) : null,
        statut: data.statut,
        reference: data.reference || null,
        notes: data.notes || null,
        alerteJours: data.alerteJours,
      },
      include: {
        echeances: { orderBy: { dateEcheance: 'asc' } },
      },
    });

    return NextResponse.json(abonnement);
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

    await prisma.abonnement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
