import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

function generateNumero(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `CPS-${year}-${random}`;
}

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

    const contrats = await prisma.contratPrestataire.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        partenaire: {
          select: { id: true, nom: true, adresse: true, ville: true, email: true, telephone1: true },
        },
      },
    });

    return NextResponse.json(contrats);
  } catch (error) {
    console.error('Error fetching contrats prestataires:', error);
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
      return NextResponse.json({ error: 'Prestataire requis' }, { status: 400 });
    }
    if (!data.objet?.trim()) {
      return NextResponse.json({ error: 'Objet requis' }, { status: 400 });
    }
    if (!data.montant) {
      return NextResponse.json({ error: 'Montant requis' }, { status: 400 });
    }
    if (!data.dateDebut) {
      return NextResponse.json({ error: 'Date de début requise' }, { status: 400 });
    }

    // Generate unique numero
    let numero = generateNumero();
    let exists = await prisma.contratPrestataire.findUnique({ where: { numero } });
    while (exists) {
      numero = generateNumero();
      exists = await prisma.contratPrestataire.findUnique({ where: { numero } });
    }

    const contrat = await prisma.contratPrestataire.create({
      data: {
        numero,
        partenaireId: data.partenaireId,
        objet: data.objet.trim(),
        description: data.description?.trim() || null,
        montant: parseFloat(data.montant),
        dateDebut: new Date(data.dateDebut),
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        delaiExecution: data.delaiExecution?.trim() || null,
        conditionsPaiement: data.conditionsPaiement?.trim() || null,
        statut: 'en_cours',
        notes: data.notes?.trim() || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(contrat);
  } catch (error) {
    console.error('Error creating contrat prestataire:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
