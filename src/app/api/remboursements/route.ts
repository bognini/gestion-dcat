import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const partenaireId = searchParams.get('partenaireId');

    const where: { statut?: string; partenaireId?: string } = {};
    if (statut && statut !== 'all') where.statut = statut;
    if (partenaireId) where.partenaireId = partenaireId;

    const remboursements = await prisma.remboursement.findMany({
      where,
      orderBy: [{ statut: 'asc' }, { dateEcheance: 'asc' }],
      include: {
        partenaire: {
          select: { id: true, nom: true, telephone1: true, email: true },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
        },
      },
    });

    return NextResponse.json(remboursements);
  } catch (error) {
    console.error('Error fetching remboursements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.partenaireId) {
      return NextResponse.json({ error: 'Client requis' }, { status: 400 });
    }
    if (!data.montantTotal || data.montantTotal <= 0) {
      return NextResponse.json({ error: 'Montant total requis' }, { status: 400 });
    }
    if (!data.motif?.trim()) {
      return NextResponse.json({ error: 'Motif requis' }, { status: 400 });
    }

    const remboursement = await prisma.remboursement.create({
      data: {
        partenaireId: data.partenaireId,
        montantTotal: data.montantTotal,
        montantPaye: 0,
        motif: data.motif.trim(),
        reference: data.reference?.trim() || null,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        statut: 'en_cours',
        notes: data.notes?.trim() || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        paiements: true,
      },
    });

    return NextResponse.json(remboursement);
  } catch (error) {
    console.error('Error creating remboursement:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
