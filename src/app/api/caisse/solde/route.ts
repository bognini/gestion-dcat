import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const mouvements = await prisma.mouvementCaisse.findMany();

    const solde = mouvements.reduce((acc, m) => {
      return m.type === 'entree' ? acc + m.montant : acc - m.montant;
    }, 0);

    return NextResponse.json({ solde });
  } catch (error) {
    console.error('Error fetching solde caisse:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
