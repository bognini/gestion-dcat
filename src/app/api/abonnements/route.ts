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
    const type = searchParams.get('type');

    const where: { statut?: string; type?: string } = {};
    if (statut && statut !== 'all') where.statut = statut;
    if (type && type !== 'all') where.type = type;

    const abonnements = await prisma.abonnement.findMany({
      where,
      orderBy: { dateProchainePaiement: 'asc' },
      include: {
        echeances: {
          orderBy: { dateEcheance: 'desc' },
          take: 3,
        },
      },
    });

    return NextResponse.json(abonnements);
  } catch (error) {
    console.error('Error fetching abonnements:', error);
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

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }
    if (!data.fournisseur?.trim()) {
      return NextResponse.json({ error: 'Fournisseur requis' }, { status: 400 });
    }
    if (!data.type) {
      return NextResponse.json({ error: 'Type requis' }, { status: 400 });
    }
    if (!data.montant) {
      return NextResponse.json({ error: 'Montant requis' }, { status: 400 });
    }
    if (!data.dateDebut) {
      return NextResponse.json({ error: 'Date de début requise' }, { status: 400 });
    }

    // Calculate next payment date based on periodicity
    const dateDebut = new Date(data.dateDebut);
    let dateProchainePaiement = new Date(dateDebut);
    
    if (data.periodicite === 'annuel') {
      dateProchainePaiement.setFullYear(dateProchainePaiement.getFullYear() + 1);
    } else {
      dateProchainePaiement.setMonth(dateProchainePaiement.getMonth() + 1);
    }

    const abonnement = await prisma.abonnement.create({
      data: {
        nom: data.nom.trim(),
        type: data.type,
        fournisseur: data.fournisseur.trim(),
        montant: parseFloat(data.montant),
        periodicite: data.periodicite || 'mensuel',
        dateDebut: dateDebut,
        dateProchainePaiement,
        dateExpiration: data.dateExpiration ? new Date(data.dateExpiration) : null,
        statut: 'actif',
        reference: data.reference?.trim() || null,
        notes: data.notes?.trim() || null,
        alerteJours: data.alerteJours || 7,
      },
      include: {
        echeances: true,
      },
    });

    return NextResponse.json(abonnement);
  } catch (error) {
    console.error('Error creating abonnement:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
