import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const mouvements = await prisma.mouvementCaisse.findMany({
      orderBy: { date: 'desc' },
    });

    // Calculate current balance
    const solde = mouvements.reduce((acc, m) => {
      return m.type === 'entree' ? acc + m.montant : acc - m.montant;
    }, 0);

    return NextResponse.json({ mouvements, solde });
  } catch (error) {
    console.error('Error fetching caisse:', error);
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

    if (!data.type || !['entree', 'sortie'].includes(data.type)) {
      return NextResponse.json({ error: 'Type invalide (entree ou sortie)' }, { status: 400 });
    }

    if (!data.montant || data.montant <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    // For sortie, check if there's enough balance
    if (data.type === 'sortie') {
      const mouvements = await prisma.mouvementCaisse.findMany();
      const solde = mouvements.reduce((acc, m) => {
        return m.type === 'entree' ? acc + m.montant : acc - m.montant;
      }, 0);

      if (data.montant > solde) {
        return NextResponse.json(
          { error: `Solde insuffisant. Solde actuel: ${solde.toLocaleString()} FCFA` },
          { status: 400 }
        );
      }
    }

    const mouvement = await prisma.mouvementCaisse.create({
      data: {
        type: data.type,
        montant: data.montant,
        description: data.description?.trim() || null,
        justificatif: data.justificatif || null,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    return NextResponse.json(mouvement);
  } catch (error) {
    console.error('Error creating mouvement caisse:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
