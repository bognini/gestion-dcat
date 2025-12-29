import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const paiements = await prisma.paiement.findMany({
      orderBy: { date: 'desc' },
      include: {
        facture: {
          select: {
            id: true,
            reference: true,
            clientNom: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json(paiements);
  } catch (error) {
    console.error('Error fetching paiements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
