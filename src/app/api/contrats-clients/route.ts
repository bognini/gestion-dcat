import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

function generateNumero(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `CTR-${year}-${random}`;
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

    const contrats = await prisma.contratClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        partenaire: {
          select: { id: true, nom: true, telephone1: true, email: true },
        },
        echeances: {
          orderBy: { mois: 'desc' },
          take: 3,
        },
      },
    });

    return NextResponse.json(contrats);
  } catch (error) {
    console.error('Error fetching contrats:', error);
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
    if (!data.titre?.trim()) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }
    if (!data.type) {
      return NextResponse.json({ error: 'Type requis' }, { status: 400 });
    }
    if (!data.dateDebut) {
      return NextResponse.json({ error: 'Date de début requise' }, { status: 400 });
    }

    // Generate unique numero
    let numero = generateNumero();
    let exists = await prisma.contratClient.findUnique({ where: { numero } });
    while (exists) {
      numero = generateNumero();
      exists = await prisma.contratClient.findUnique({ where: { numero } });
    }

    const contrat = await prisma.contratClient.create({
      data: {
        numero,
        titre: data.titre.trim(),
        partenaireId: data.partenaireId,
        type: data.type,
        montantMensuel: data.montantMensuel || null,
        montantAnnuel: data.montantAnnuel || null,
        dateDebut: new Date(data.dateDebut),
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        modePaiement: data.modePaiement || 'mensuel',
        jourPaiement: data.jourPaiement || null,
        statut: 'actif',
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        echeances: true,
      },
    });

    return NextResponse.json(contrat);
  } catch (error) {
    console.error('Error creating contrat:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
